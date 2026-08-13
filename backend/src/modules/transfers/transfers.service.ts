import {
  Injectable, BadRequestException, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { WarehouseTransfer } from './entities/warehouse-transfer.entity';
import { WarehouseProduct } from '../stock/entities/warehouse-prouct.entity';
import { StockMovement } from '../stock/entities/stock-movement.entity';
import { StockMovementReason } from '../../common/enums';

@Injectable()
export class TransfersService {
  constructor(
    @InjectRepository(WarehouseTransfer)
    private readonly transferRepo: Repository<WarehouseTransfer>,
    private readonly dataSource: DataSource, // for transactions
  ) {}

  // List all transfers (read side, simple)
  findAll(): Promise<WarehouseTransfer[]> {
    return this.transferRepo.find({
      relations: ['product', 'fromWarehouse', 'toWarehouse'],
      order: { createdAt: 'DESC' },
    });
  }

  // Create a transfer — the atomic part
  async create(data: {
    productId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    quantity: number;
    createdBy?: string;
  }): Promise<WarehouseTransfer> {
    const { productId, fromWarehouseId, toWarehouseId, quantity, createdBy } = data;

    // basic validation before touching the database
    if (fromWarehouseId === toWarehouseId) {
      throw new BadRequestException('Source and destination must differ');
    }
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    // everything inside here is all-or-nothing
    return this.dataSource.transaction(async (manager) => {
      // 1. find the source stock row
      const source = await manager.findOne(WarehouseProduct, {
        where: { warehouseId: fromWarehouseId, productId },
      });

      // can't transfer stock that isn't there, or isn't enough
      const available = (source?.quantityOnHand ?? 0) - (source?.quantityReserved ?? 0);
      if (!source || available < quantity) {
        throw new BadRequestException(
          `Not enough available stock in source warehouse (have ${available}, need ${quantity})`,
        );
      }

      // 2. decrement source
      source.quantityOnHand -= quantity;
      await manager.save(source);

      // 3. find or create the destination stock row
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

      // 4. create the transfer record
      const transfer = manager.create(WarehouseTransfer, {
        productId, fromWarehouseId, toWarehouseId, quantity, createdBy,
      });
      const savedTransfer = await manager.save(transfer);

      // 5. write two ledger rows: out of source, into destination
      const outMovement = manager.create(StockMovement, {
        warehouseId: fromWarehouseId, productId,
        quantityChange: -quantity,
        reason: StockMovementReason.TRANSFER_OUT,
        referenceId: savedTransfer.id,
        createdBy,
      });
      const inMovement = manager.create(StockMovement, {
        warehouseId: toWarehouseId, productId,
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