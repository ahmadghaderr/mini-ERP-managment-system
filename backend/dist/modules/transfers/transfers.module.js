"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransfersModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const warehouse_transfer_entity_1 = require("./entities/warehouse-transfer.entity");
const warehouse_prouct_entity_1 = require("../stock/entities/warehouse-prouct.entity");
const stock_movement_entity_1 = require("../stock/entities/stock-movement.entity");
const transfers_service_1 = require("./transfers.service");
const transfers_controller_1 = require("./transfers.controller");
let TransfersModule = class TransfersModule {
};
exports.TransfersModule = TransfersModule;
exports.TransfersModule = TransfersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([warehouse_transfer_entity_1.WarehouseTransfer, warehouse_prouct_entity_1.WarehouseProduct, stock_movement_entity_1.StockMovement]),
        ],
        controllers: [transfers_controller_1.TransfersController],
        providers: [transfers_service_1.TransfersService],
        exports: [transfers_service_1.TransfersService],
    })
], TransfersModule);
//# sourceMappingURL=transfers.module.js.map