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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarehouseProduct = void 0;
const typeorm_1 = require("typeorm");
const warehouse_entity_1 = require("../../warehouse/entities/warehouse.entity");
const product_entity_1 = require("../../products/entities/product.entity");
let WarehouseProduct = class WarehouseProduct {
    id;
    warehouseId;
    warehouse;
    productId;
    product;
    quantityOnHand;
    quantityReserved;
    updatedAt;
};
exports.WarehouseProduct = WarehouseProduct;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], WarehouseProduct.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'warehouse_id', type: 'uuid' }),
    __metadata("design:type", String)
], WarehouseProduct.prototype, "warehouseId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => warehouse_entity_1.Warehouse, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'warehouse_id' }),
    __metadata("design:type", warehouse_entity_1.Warehouse)
], WarehouseProduct.prototype, "warehouse", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'product_id', type: 'uuid' }),
    __metadata("design:type", String)
], WarehouseProduct.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_entity_1.Product, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'product_id' }),
    __metadata("design:type", product_entity_1.Product)
], WarehouseProduct.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'quantity_on_hand', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], WarehouseProduct.prototype, "quantityOnHand", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'quantity_reserved', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], WarehouseProduct.prototype, "quantityReserved", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], WarehouseProduct.prototype, "updatedAt", void 0);
exports.WarehouseProduct = WarehouseProduct = __decorate([
    (0, typeorm_1.Entity)('warehouse_product'),
    (0, typeorm_1.Unique)(['warehouseId', 'productId'])
], WarehouseProduct);
//# sourceMappingURL=warehouse-prouct.entity.js.map