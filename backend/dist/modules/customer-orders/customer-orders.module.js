"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerOrdersModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const customer_order_entity_1 = require("./entities/customer-order.entity");
const customer_order_item_entity_1 = require("./entities/customer-order-item.entity");
const warehouse_prouct_entity_1 = require("../stock/entities/warehouse-prouct.entity");
const stock_movement_entity_1 = require("../stock/entities/stock-movement.entity");
const customer_orders_service_1 = require("./customer-orders.service");
const customer_orders_controller_1 = require("./customer-orders.controller");
let CustomerOrdersModule = class CustomerOrdersModule {
};
exports.CustomerOrdersModule = CustomerOrdersModule;
exports.CustomerOrdersModule = CustomerOrdersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                customer_order_entity_1.CustomerOrder,
                customer_order_item_entity_1.CustomerOrderItem,
                warehouse_prouct_entity_1.WarehouseProduct,
                stock_movement_entity_1.StockMovement,
            ]),
        ],
        controllers: [customer_orders_controller_1.CustomerOrdersController],
        providers: [customer_orders_service_1.CustomerOrdersService],
        exports: [customer_orders_service_1.CustomerOrdersService],
    })
], CustomerOrdersModule);
//# sourceMappingURL=customer-orders.module.js.map