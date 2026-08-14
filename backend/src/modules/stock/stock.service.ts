import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockMovement } from './entities/stock-movement.entity';
import { WarehouseProduct } from './entities/warehouse-prouct.entity';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(StockMovement)
    private readonly movementRepo: Repository<StockMovement>,
    @InjectRepository(WarehouseProduct)
    private readonly warehouseProductRepo: Repository<WarehouseProduct>,
  ) {}

  // The ledger — all stock movements, newest first
  findAllMovements(): Promise<StockMovement[]> {
    return this.movementRepo.find({
      relations: ['warehouse', 'product'],
      order: { createdAt: 'DESC' },
    });
  }

  // Current stock levels across all warehouses
  findAllStock(): Promise<WarehouseProduct[]> {
    return this.warehouseProductRepo.find({
      relations: ['warehouse', 'product'],
    });
  }
}