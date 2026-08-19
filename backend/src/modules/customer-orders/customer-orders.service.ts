import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CustomerOrder } from './entities/customer-order.entity';
import { CustomerOrderItem } from './entities/customer-order-item.entity';
import { CustomerOrderItemAllocation } from './entities/customer-order-item-allocation.entity';
import { WarehouseProduct } from '../stock/entities/warehouse-prouct.entity';
import { StockMovement } from '../stock/entities/stock-movement.entity';
import { CustomerOrderStatus, StockMovementReason } from '../../common/enums';
import { CreateCustomerOrderDto } from './dto/create-customer-order.dto';

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

  create(data: CreateCustomerOrderDto): Promise<CustomerOrder> {
    const order = this.orderRepo.create({
      fileUrl: data.fileUrl,
      warehouseId: data.warehouseId,
      extractedCustomerName: data.extractedCustomerName,
      items: data.items?.map((it) => this.itemRepo.create(it)),
    });
    return this.orderRepo.save(order);
  }

  async matchItem(
    orderId: string,
    itemId: string,
    matchedProductId: string,
  ): Promise<CustomerOrderItem> {
    const item = await this.itemRepo.findOne({
      where: { id: itemId, customerOrderId: orderId },
    });
    if (!item) {
      throw new NotFoundException(
        `Item ${itemId} not found on order ${orderId}`,
      );
    }
    item.matchedProductId = matchedProductId;
    return this.itemRepo.save(item);
  }

  async confirm(id: string, reviewedBy?: string): Promise<CustomerOrder> {
    const order = await this.findOne(id);
    if (order.status !== CustomerOrderStatus.PENDING) {
      throw new BadRequestException(
        `Only pending orders can be confirmed (current: "${order.status}")`,
      );
    }

    const unmatchedItem = order.items.find((item) => !item.matchedProductId);
    if (unmatchedItem) {
      throw new BadRequestException(
        `Cannot confirm — item "${unmatchedItem.extractedProductName}" has no matched product`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      for (const item of order.items) {
        if (!item.matchedProductId) continue;

        let remaining = item.quantity;

        const stockRows = await manager
          .createQueryBuilder(WarehouseProduct, 'wp')
          .leftJoinAndSelect('wp.warehouse', 'warehouse')
          .where('wp.productId = :productId', { productId: item.matchedProductId })
          .orderBy('warehouse.createdAt', 'ASC')
          .getMany();

        for (const stock of stockRows) {
          if (remaining <= 0) break;

          const available = stock.quantityOnHand - stock.quantityReserved;
          if (available <= 0) continue;

          const take = Math.min(available, remaining);
          stock.quantityReserved += take;
          await manager.save(stock);

          const allocation = manager.create(CustomerOrderItemAllocation, {
            customerOrderItemId: item.id,
            warehouseId: stock.warehouseId,
            quantity: take,
          });
          await manager.save(allocation);

          remaining -= take;
        }

        if (remaining > 0) {
          throw new BadRequestException(
            `Not enough available stock across all warehouses for "${item.extractedProductName}" (short by ${remaining})`,
          );
        }
      }

      order.status = CustomerOrderStatus.CONFIRMED;
      order.confirmedAt = new Date();
      order.reviewedBy = reviewedBy;
      return manager.save(order);
    });
  }

  async deliver(id: string): Promise<CustomerOrder> {
    const order = await this.findOne(id);
    if (order.status !== CustomerOrderStatus.CONFIRMED) {
      throw new BadRequestException(
        `Only confirmed orders can be delivered (current: "${order.status}")`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      for (const item of order.items) {
        const allocations = await manager.find(CustomerOrderItemAllocation, {
          where: { customerOrderItemId: item.id },
        });

        for (const allocation of allocations) {
          const stock = await manager.findOne(WarehouseProduct, {
            where: {
              warehouseId: allocation.warehouseId,
              productId: item.matchedProductId,
            },
          });
          if (!stock) continue;

          stock.quantityOnHand -= allocation.quantity;
          stock.quantityReserved -= allocation.quantity;
          await manager.save(stock);

          const movement = manager.create(StockMovement, {
            warehouseId: allocation.warehouseId,
            productId: item.matchedProductId,
            quantityChange: -allocation.quantity,
            reason: StockMovementReason.ORDER_DELIVERED,
            referenceId: order.id,
          });
          await manager.save(movement);
        }
      }

      order.status = CustomerOrderStatus.DELIVERED;
      order.deliveredAt = new Date();
      return manager.save(order);
    });
  }

  async reject(id: string, reviewedBy?: string): Promise<CustomerOrder> {
    const order = await this.findOne(id);

    return this.dataSource.transaction(async (manager) => {
      if (order.status === CustomerOrderStatus.CONFIRMED) {
        for (const item of order.items) {
          const allocations = await manager.find(CustomerOrderItemAllocation, {
            where: { customerOrderItemId: item.id },
          });

          for (const allocation of allocations) {
            const stock = await manager.findOne(WarehouseProduct, {
              where: {
                warehouseId: allocation.warehouseId,
                productId: item.matchedProductId,
              },
            });
            if (stock) {
              stock.quantityReserved -= allocation.quantity;
              await manager.save(stock);
            }
          }

          await manager.delete(CustomerOrderItemAllocation, {
            customerOrderItemId: item.id,
          });
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
