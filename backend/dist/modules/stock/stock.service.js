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
exports.StockService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const stock_movement_entity_1 = require("./entities/stock-movement.entity");
const warehouse_prouct_entity_1 = require("./entities/warehouse-prouct.entity");
const enums_1 = require("../../common/enums");
let StockService = class StockService {
    movementRepo;
    warehouseProductRepo;
    dataSource;
    constructor(movementRepo, warehouseProductRepo, dataSource) {
        this.movementRepo = movementRepo;
        this.warehouseProductRepo = warehouseProductRepo;
        this.dataSource = dataSource;
    }
    findAllMovements() {
        return this.movementRepo.find({
            relations: ['warehouse', 'product'],
            order: { createdAt: 'DESC' },
        });
    }
    findAllStock() {
        return this.warehouseProductRepo.find({
            relations: ['warehouse', 'product'],
        });
    }
    async adjustStock(dto) {
        return this.dataSource.transaction(async (manager) => {
            let stock = await manager.findOne(warehouse_prouct_entity_1.WarehouseProduct, {
                where: { warehouseId: dto.warehouseId, productId: dto.productId },
            });
            if (!stock) {
                if (dto.quantityChange < 0) {
                    throw new common_1.BadRequestException('Cannot adjust stock below zero for a product with no existing stock record');
                }
                stock = manager.create(warehouse_prouct_entity_1.WarehouseProduct, {
                    warehouseId: dto.warehouseId,
                    productId: dto.productId,
                    quantityOnHand: 0,
                    quantityReserved: 0,
                });
            }
            const newQuantityOnHand = stock.quantityOnHand + dto.quantityChange;
            if (newQuantityOnHand < stock.quantityReserved) {
                throw new common_1.BadRequestException(`Adjustment would leave on-hand (${newQuantityOnHand}) below reserved (${stock.quantityReserved})`);
            }
            stock.quantityOnHand = newQuantityOnHand;
            await manager.save(stock);
            const movement = manager.create(stock_movement_entity_1.StockMovement, {
                warehouseId: dto.warehouseId,
                productId: dto.productId,
                quantityChange: dto.quantityChange,
                reason: enums_1.StockMovementReason.ADJUSTMENT,
                createdBy: dto.createdBy,
            });
            return manager.save(movement);
        });
    }
};
exports.StockService = StockService;
exports.StockService = StockService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(stock_movement_entity_1.StockMovement)),
    __param(1, (0, typeorm_1.InjectRepository)(warehouse_prouct_entity_1.WarehouseProduct)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], StockService);
//# sourceMappingURL=stock.service.js.map