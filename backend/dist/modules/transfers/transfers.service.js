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
exports.TransfersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const warehouse_transfer_entity_1 = require("./entities/warehouse-transfer.entity");
const warehouse_prouct_entity_1 = require("../stock/entities/warehouse-prouct.entity");
const stock_movement_entity_1 = require("../stock/entities/stock-movement.entity");
const enums_1 = require("../../common/enums");
let TransfersService = class TransfersService {
    transferRepo;
    dataSource;
    constructor(transferRepo, dataSource) {
        this.transferRepo = transferRepo;
        this.dataSource = dataSource;
    }
    findAll() {
        return this.transferRepo.find({
            relations: ['product', 'fromWarehouse', 'toWarehouse'],
            order: { createdAt: 'DESC' },
        });
    }
    async create(data) {
        const { productId, fromWarehouseId, toWarehouseId, quantity, createdBy } = data;
        if (fromWarehouseId === toWarehouseId) {
            throw new common_1.BadRequestException('Source and destination must differ');
        }
        return this.dataSource.transaction(async (manager) => {
            const source = await manager.findOne(warehouse_prouct_entity_1.WarehouseProduct, {
                where: { warehouseId: fromWarehouseId, productId },
            });
            const available = (source?.quantityOnHand ?? 0) - (source?.quantityReserved ?? 0);
            if (!source || available < quantity) {
                throw new common_1.BadRequestException(`Not enough available stock in source warehouse (have ${available}, need ${quantity})`);
            }
            source.quantityOnHand -= quantity;
            await manager.save(source);
            let dest = await manager.findOne(warehouse_prouct_entity_1.WarehouseProduct, {
                where: { warehouseId: toWarehouseId, productId },
            });
            if (!dest) {
                dest = manager.create(warehouse_prouct_entity_1.WarehouseProduct, {
                    warehouseId: toWarehouseId,
                    productId,
                    quantityOnHand: 0,
                    quantityReserved: 0,
                });
            }
            dest.quantityOnHand += quantity;
            await manager.save(dest);
            const transfer = manager.create(warehouse_transfer_entity_1.WarehouseTransfer, {
                productId,
                fromWarehouseId,
                toWarehouseId,
                quantity,
                createdBy,
            });
            const savedTransfer = await manager.save(transfer);
            const outMovement = manager.create(stock_movement_entity_1.StockMovement, {
                warehouseId: fromWarehouseId,
                productId,
                quantityChange: -quantity,
                reason: enums_1.StockMovementReason.TRANSFER_OUT,
                referenceId: savedTransfer.id,
                createdBy,
            });
            const inMovement = manager.create(stock_movement_entity_1.StockMovement, {
                warehouseId: toWarehouseId,
                productId,
                quantityChange: quantity,
                reason: enums_1.StockMovementReason.TRANSFER_IN,
                referenceId: savedTransfer.id,
                createdBy,
            });
            await manager.save([outMovement, inMovement]);
            return savedTransfer;
        });
    }
};
exports.TransfersService = TransfersService;
exports.TransfersService = TransfersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(warehouse_transfer_entity_1.WarehouseTransfer)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.DataSource])
], TransfersService);
//# sourceMappingURL=transfers.service.js.map