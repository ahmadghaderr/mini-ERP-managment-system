import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { StockMovement } from './entities/stock-movement.entity';
import { WarehouseProduct } from './entities/warehouse-prouct.entity';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { StockMovementReason } from '../../common/enums';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(StockMovement)
    private readonly movementRepo: Repository<StockMovement>,
    @InjectRepository(WarehouseProduct)
    private readonly warehouseProductRepo: Repository<WarehouseProduct>,
    private readonly dataSource: DataSource,
  ) {}

  findAllMovements(): Promise<StockMovement[]> {
    return this.movementRepo.find({
      relations: ['warehouse', 'product'],
      order: { createdAt: 'DESC' },
    });
  }

  findAllStock(): Promise<WarehouseProduct[]> {
    return this.warehouseProductRepo.find({
      relations: ['warehouse', 'product'],
    });
  }

  async adjustStock(dto: AdjustStockDto): Promise<StockMovement> {
    return this.dataSource.transaction(async (manager) => {
      let stock = await manager.findOne(WarehouseProduct, {
        where: { warehouseId: dto.warehouseId, productId: dto.productId },
      });
      if (!stock) {
        if (dto.quantityChange < 0) {
          throw new BadRequestException(
            'Cannot adjust stock below zero for a product with no existing stock record',
          );
        }
        stock = manager.create(WarehouseProduct, {
          warehouseId: dto.warehouseId,
          productId: dto.productId,
          quantityOnHand: 0,
          quantityReserved: 0,
        });
      }

      const newQuantityOnHand = stock.quantityOnHand + dto.quantityChange;
      if (newQuantityOnHand < stock.quantityReserved) {
        throw new BadRequestException(
          `Adjustment would leave on-hand (${newQuantityOnHand}) below reserved (${stock.quantityReserved})`,
        );
      }

      stock.quantityOnHand = newQuantityOnHand;
      await manager.save(stock);

      const movement = manager.create(StockMovement, {
        warehouseId: dto.warehouseId,
        productId: dto.productId,
        quantityChange: dto.quantityChange,
        reason: StockMovementReason.ADJUSTMENT,
        createdBy: dto.createdBy,
      });
      return manager.save(movement);
    });
  }
}
