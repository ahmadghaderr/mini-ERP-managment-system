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
exports.WarehouseTransfer = void 0;
const typeorm_1 = require("typeorm");
const product_entity_1 = require("../../products/entities/product.entity");
const warehouse_entity_1 = require("../../warehouse/entities/warehouse.entity");
const user_entity_1 = require("../../users/entities/user.entity");
let WarehouseTransfer = class WarehouseTransfer {
    id;
    productId;
    product;
    fromWarehouseId;
    fromWarehouse;
    toWarehouseId;
    toWarehouse;
    quantity;
    createdAt;
    createdBy;
    user;
};
exports.WarehouseTransfer = WarehouseTransfer;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], WarehouseTransfer.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'product_id', type: 'uuid' }),
    __metadata("design:type", String)
], WarehouseTransfer.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_entity_1.Product, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'product_id' }),
    __metadata("design:type", product_entity_1.Product)
], WarehouseTransfer.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'from_warehouse_id', type: 'uuid' }),
    __metadata("design:type", String)
], WarehouseTransfer.prototype, "fromWarehouseId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => warehouse_entity_1.Warehouse, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'from_warehouse_id' }),
    __metadata("design:type", warehouse_entity_1.Warehouse)
], WarehouseTransfer.prototype, "fromWarehouse", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'to_warehouse_id', type: 'uuid' }),
    __metadata("design:type", String)
], WarehouseTransfer.prototype, "toWarehouseId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => warehouse_entity_1.Warehouse, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'to_warehouse_id' }),
    __metadata("design:type", warehouse_entity_1.Warehouse)
], WarehouseTransfer.prototype, "toWarehouse", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], WarehouseTransfer.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], WarehouseTransfer.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], WarehouseTransfer.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", user_entity_1.User)
], WarehouseTransfer.prototype, "user", void 0);
exports.WarehouseTransfer = WarehouseTransfer = __decorate([
    (0, typeorm_1.Entity)('warehouse_transfer')
], WarehouseTransfer);
//# sourceMappingURL=warehouse-transfer.entity.js.map