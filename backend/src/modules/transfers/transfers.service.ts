import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { WarehouseTransfer } from './entities/warehouse-transfer.entity';
import { WarehouseProduct } from '../stock/entities/warehouse-prouct.entity';
import { StockMovement } from '../stock/entities/stock-movement.entity';
import { StockMovementReason } from '../../common/enums';
import { CreateTransferDto } from './dto/create-transfer.dto';

@Injectable()
export class TransfersService {
  constructor(
    @InjectRepository(WarehouseTransfer)
    private readonly transferRepo: Repository<WarehouseTransfer>,
    private readonly dataSource: DataSource,
  ) {}

  findAll(): Promise<WarehouseTransfer[]> {
    return this.transferRepo.find({
      relations: ['product', 'fromWarehouse', 'toWarehouse'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(data: CreateTransferDto): Promise<WarehouseTransfer> {
    const { productId, fromWarehouseId, toWarehouseId, quantity, createdBy } =
      data;

    if (fromWarehouseId === toWarehouseId) {
      throw new BadRequestException('Source and destination must differ');
    }

    return this.dataSource.transaction(async (manager) => {
      // 1. find the source stock row
      const source = await manager.findOne(WarehouseProduct, {
        where: { warehouseId: fromWarehouseId, productId },
      });

      const available =
        (source?.quantityOnHand ?? 0) - (source?.quantityReserved ?? 0);
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
        createdBy,
      });
      const savedTransfer = await manager.save(transfer);

      const outMovement = manager.create(StockMovement, {
        warehouseId: fromWarehouseId,
        productId,
        quantityChange: -quantity,
        reason: StockMovementReason.TRANSFER_OUT,
        referenceId: savedTransfer.id,
        createdBy,
      });
      const inMovement = manager.create(StockMovement, {
        warehouseId: toWarehouseId,
        productId,
        quantityChange: quantity,
        reason: StockMovementReason.TRANSFER_IN,
        referenceId: savedTransfer.id,
        createdBy,
      });
      await manager.save([outMovement, inMovement]);

      return savedTransfer;
    });
  }
}
