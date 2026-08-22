import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { WarehouseTransfer } from './entities/warehouse-transfer.entity';
import { WarehouseProduct } from '../stock/entities/warehouse-prouct.entity';
import { StockMovement } from '../stock/entities/stock-movement.entity';
import { StockMovementReason } from '../../common/enums';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class TransfersService {
  constructor(
    @InjectRepository(WarehouseTransfer)
    private readonly transferRepo: Repository<WarehouseTransfer>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  findAll(): Promise<WarehouseTransfer[]> {
    return this.transferRepo.find({
      relations: ['product', 'fromWarehouse', 'toWarehouse'],
      order: { createdAt: 'DESC' },
    });
  }

  private async resolveUserId(cognitoSub?: string): Promise<string | undefined> {
    if (!cognitoSub) return undefined;
    const user = await this.userRepo.findOne({ where: { cognitoSub } });
    if (!user) {
      throw new BadRequestException('No user found for the given identity');
    }
    return user.id;
  }

  async create(data: CreateTransferDto): Promise<WarehouseTransfer> {
    const { productId, fromWarehouseId, toWarehouseId, quantity, createdBy } = data;

    if (fromWarehouseId === toWarehouseId) {
      throw new BadRequestException('Source and destination must differ');
    }

    const resolvedUserId = await this.resolveUserId(createdBy);

    return this.dataSource.transaction(async (manager) => {
      const source = await manager.findOne(WarehouseProduct, {
        where: { warehouseId: fromWarehouseId, productId },
      });

      const available = (source?.quantityOnHand ?? 0) - (source?.quantityReserved ?? 0);
      if (!source || available < quantity) {
        throw new BadRequestException(
          `Not enough available stock in source warehouse (have ${available}, need ${quantity})`,
        );
      }

      source.quantityOnHand -= quantity;
      await manager.save(source);

      let dest = await manager.findOne(WarehouseProduct, {
        where: { warehouseId: toWarehouseId, productId },
      });
      if (!dest) {
        dest = manager.create(WarehouseProduct, {
          warehouseId: toWarehouseId,
          productId,
          quantityOnHand: 0,
          quantityReserved: 0,
        });
      }
      dest.quantityOnHand += quantity;
      await manager.save(dest);

      const transfer = manager.create(WarehouseTransfer, {
        productId,
        fromWarehouseId,
        toWarehouseId,
        quantity,
        createdBy: resolvedUserId,
      });
      const savedTransfer = await manager.save(transfer);

      const outMovement = manager.create(StockMovement, {
        warehouseId: fromWarehouseId,
        productId,
        quantityChange: -quantity,
        reason: StockMovementReason.TRANSFER_OUT,
        referenceId: savedTransfer.id,
        createdBy: resolvedUserId,
      });
      const inMovement = manager.create(StockMovement, {
        warehouseId: toWarehouseId,
        productId,
        quantityChange: quantity,
        reason: StockMovementReason.TRANSFER_IN,
        referenceId: savedTransfer.id,
        createdBy: resolvedUserId,
      });
      await manager.save([outMovement, inMovement]);

      return savedTransfer;
    });
  }
}