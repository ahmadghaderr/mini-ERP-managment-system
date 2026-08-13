import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CustomerOrder } from './entities/customer-order.entity';
import { CustomerOrderItem } from './entities/customer-order-item.entity';
import { WarehouseProduct } from '../stock/entities/warehouse-prouct.entity';
import { StockMovement } from '../stock/entities/stock-movement.entity';
import { CustomerOrderStatus, StockMovementReason } from '../../common/enums';

interface ItemInput {
  extractedProductName: string;
  matchedProductId?: string;
  quantity: number;
  unitPrice?: number;
}

@Injectable()
export class CustomerOrdersService {
  constructor(
    @InjectRepository(CustomerOrder)
    private readonly orderRepo: Repository<CustomerOrder>,
    @InjectRepository(CustomerOrderItem)
    private readonly itemRepo: Repository<CustomerOrderItem>,
    private readonly dataSource: DataSource,
  ) {}

  findAll(): Promise<CustomerOrder[]> {
    return this.orderRepo.find({
      relations: ['items', 'warehouse'],
      order: { uploadedAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<CustomerOrder> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['items', 'warehouse'],
    });
    if (!order) throw new NotFoundException(`Customer order ${id} not found`);
    return order;
  }

  create(data: {
    fileUrl: string;
    warehouseId: string;
    extractedCustomerName?: string;
    items?: ItemInput[];
  }): Promise<CustomerOrder> {
    const order = this.orderRepo.create({
      fileUrl: data.fileUrl,
      warehouseId: data.warehouseId,
      extractedCustomerName: data.extractedCustomerName,
      items: data.items?.map((it) => this.itemRepo.create(it)),
    });
    return this.orderRepo.save(order);
  }

  // CONFIRM — reserves stock (doesn't remove it yet)
  async confirm(id: string, reviewedBy?: string): Promise<CustomerOrder> {
    const order = await this.findOne(id);
    if (order.status !== CustomerOrderStatus.PENDING) {
      throw new BadRequestException(
        `Only pending orders can be confirmed (current: "${order.status}")`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      for (const item of order.items) {
        if (!item.matchedProductId) continue;

        const stock = await manager.findOne(WarehouseProduct, {
          where: { warehouseId: order.warehouseId, productId: item.matchedProductId },
        });
        const available =
          (stock?.quantityOnHand ?? 0) - (stock?.quantityReserved ?? 0);
        if (!stock || available < item.quantity) {
          throw new BadRequestException(
            `Not enough available stock for a product (have ${available}, need ${item.quantity})`,
          );
        }
        stock.quantityReserved += item.quantity; // reserve, don't remove
        await manager.save(stock);
      }

      order.status = CustomerOrderStatus.CONFIRMED;
      order.confirmedAt = new Date();
      order.reviewedBy = reviewedBy;
      return manager.save(order);
    });
  }

  // DELIVER — actually removes the reserved stock, logs movements
  async deliver(id: string): Promise<CustomerOrder> {
    const order = await this.findOne(id);
    if (order.status !== CustomerOrderStatus.CONFIRMED) {
      throw new BadRequestException(
        `Only confirmed orders can be delivered (current: "${order.status}")`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      for (const item of order.items) {
        if (!item.matchedProductId) continue;

        const stock = await manager.findOne(WarehouseProduct, {
          where: { warehouseId: order.warehouseId, productId: item.matchedProductId },
        });
        if (!stock) continue;

        // remove from on-hand AND release the reservation
        stock.quantityOnHand -= item.quantity;
        stock.quantityReserved -= item.quantity;
        await manager.save(stock);

        const movement = manager.create(StockMovement, {
          warehouseId: order.warehouseId,
          productId: item.matchedProductId,
          quantityChange: -item.quantity, // negative — stock leaving
          reason: StockMovementReason.ORDER_DELIVERED,
          referenceId: order.id,
        });
        await manager.save(movement);
      }

      order.status = CustomerOrderStatus.DELIVERED;
      order.deliveredAt = new Date();
      return manager.save(order);
    });
  }

  // REJECT — if it was confirmed, release the reservation
  async reject(id: string, reviewedBy?: string): Promise<CustomerOrder> {
    const order = await this.findOne(id);

    return this.dataSource.transaction(async (manager) => {
      // if it was already confirmed, give the reserved stock back
      if (order.status === CustomerOrderStatus.CONFIRMED) {
        for (const item of order.items) {
          if (!item.matchedProductId) continue;
          const stock = await manager.findOne(WarehouseProduct, {
            where: { warehouseId: order.warehouseId, productId: item.matchedProductId },
          });
          if (stock) {
            stock.quantityReserved -= item.quantity;
            await manager.save(stock);
          }
        }
      }

      order.status = CustomerOrderStatus.REJECTED;
      order.rejectedAt = new Date();
      order.reviewedBy = reviewedBy;
      return manager.save(order);
    });
  }

  async remove(id: string): Promise<void> {
    const order = await this.findOne(id);
    await this.orderRepo.remove(order);
  }
}