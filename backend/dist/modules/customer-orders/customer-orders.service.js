"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerOrdersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const customer_order_entity_1 = require("./entities/customer-order.entity");
const customer_order_item_entity_1 = require("./entities/customer-order-item.entity");
const warehouse_prouct_entity_1 = require("../stock/entities/warehouse-prouct.entity");
const stock_movement_entity_1 = require("../stock/entities/stock-movement.entity");
const enums_1 = require("../../common/enums");
let CustomerOrdersService = class CustomerOrdersService {
    orderRepo;
    itemRepo;
    dataSource;
    constructor(orderRepo, itemRepo, dataSource) {
        this.orderRepo = orderRepo;
        this.itemRepo = itemRepo;
        this.dataSource = dataSource;
    }
    findAll() {
        return this.orderRepo.find({
            relations: ['items', 'warehouse'],
            order: { uploadedAt: 'DESC' },
        });
    }
    async findOne(id) {
        const order = await this.orderRepo.findOne({
            where: { id },
            relations: ['items', 'warehouse'],
        });
        if (!order)
            throw new common_1.NotFoundException(`Customer order ${id} not found`);
        return order;
    }
    create(data) {
        const order = this.orderRepo.create({
            fileUrl: data.fileUrl,
            warehouseId: data.warehouseId,
            extractedCustomerName: data.extractedCustomerName,
            items: data.items?.map((it) => this.itemRepo.create(it)),
        });
        return this.orderRepo.save(order);
    }
    async matchItem(orderId, itemId, matchedProductId) {
        const item = await this.itemRepo.findOne({
            where: { id: itemId, customerOrderId: orderId },
        });
        if (!item) {
            throw new common_1.NotFoundException(`Item ${itemId} not found on order ${orderId}`);
        }
        item.matchedProductId = matchedProductId;
        return this.itemRepo.save(item);
    }
    async confirm(id, reviewedBy) {
        const order = await this.findOne(id);
        if (order.status !== enums_1.CustomerOrderStatus.PENDING) {
            throw new common_1.BadRequestException(`Only pending orders can be confirmed (current: "${order.status}")`);
        }
        const unmatchedItem = order.items.find((item) => !item.matchedProductId);
        if (unmatchedItem) {
            throw new common_1.BadRequestException(`Cannot confirm — item "${unmatchedItem.extractedProductName}" has no matched product`);
        }
        return this.dataSource.transaction(async (manager) => {
            for (const item of order.items) {
                if (!item.matchedProductId)
                    continue;
                const stock = await manager.findOne(warehouse_prouct_entity_1.WarehouseProduct, {
                    where: {
                        warehouseId: order.warehouseId,
                        productId: item.matchedProductId,
                    },
                });
                const available = (stock?.quantityOnHand ?? 0) - (stock?.quantityReserved ?? 0);
                if (!stock || available < item.quantity) {
                    throw new common_1.BadRequestException(`Not enough available stock for a product (have ${available}, need ${item.quantity})`);
                }
                stock.quantityReserved += item.quantity;
                await manager.save(stock);
            }
            order.status = enums_1.CustomerOrderStatus.CONFIRMED;
            order.confirmedAt = new Date();
            order.reviewedBy = reviewedBy;
            return manager.save(order);
        });
    }
    async deliver(id) {
        const order = await this.findOne(id);
        if (order.status !== enums_1.CustomerOrderStatus.CONFIRMED) {
            throw new common_1.BadRequestException(`Only confirmed orders can be delivered (current: "${order.status}")`);
        }
        return this.dataSource.transaction(async (manager) => {
            for (const item of order.items) {
                if (!item.matchedProductId)
                    continue;
                const stock = await manager.findOne(warehouse_prouct_entity_1.WarehouseProduct, {
                    where: {
                        warehouseId: order.warehouseId,
                        productId: item.matchedProductId,
                    },
                });
                if (!stock)
                    continue;
                stock.quantityOnHand -= item.quantity;
                stock.quantityReserved -= item.quantity;
                await manager.save(stock);
                const movement = manager.create(stock_movement_entity_1.StockMovement, {
                    warehouseId: order.warehouseId,
                    productId: item.matchedProductId,
                    quantityChange: -item.quantity,
                    reason: enums_1.StockMovementReason.ORDER_DELIVERED,
                    referenceId: order.id,
                });
                await manager.save(movement);
            }
            order.status = enums_1.CustomerOrderStatus.DELIVERED;
            order.deliveredAt = new Date();
            return manager.save(order);
        });
    }
    async reject(id, reviewedBy) {
        const order = await this.findOne(id);
        return this.dataSource.transaction(async (manager) => {
            if (order.status === enums_1.CustomerOrderStatus.CONFIRMED) {
                for (const item of order.items) {
                    if (!item.matchedProductId)
                        continue;
                    const stock = await manager.findOne(warehouse_prouct_entity_1.WarehouseProduct, {
                        where: {
                            warehouseId: order.warehouseId,
                            productId: item.matchedProductId,
                        },
                    });
                    if (stock) {
                        stock.quantityReserved -= item.quantity;
                        await manager.save(stock);
                    }
                }
            }
            order.status = enums_1.CustomerOrderStatus.REJECTED;
            order.rejectedAt = new Date();
            order.reviewedBy = reviewedBy;
            return manager.save(order);
        });
    }
    async remove(id) {
        const order = await this.findOne(id);
        await this.orderRepo.remove(order);
    }
};
exports.CustomerOrdersService = CustomerOrdersService;
exports.CustomerOrdersService = CustomerOrdersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(customer_order_entity_1.CustomerOrder)),
    __param(1, (0, typeorm_1.InjectRepository)(customer_order_item_entity_1.CustomerOrderItem)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], CustomerOrdersService);
//# sourceMappingURL=customer-orders.service.js.map