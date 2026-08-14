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
exports.StockMovement = void 0;
const typeorm_1 = require("typeorm");
const warehouse_entity_1 = require("../../warehouse/entities/warehouse.entity");
const product_entity_1 = require("../../products/entities/product.entity");
const user_entity_1 = require("../../users/entities/user.entity");
const enums_1 = require("../../../common/enums");
let StockMovement = class StockMovement {
    id;
    warehouseId;
    warehouse;
    productId;
    product;
    quantityChange;
    reason;
    referenceId;
    createdAt;
    createdBy;
    user;
};
exports.StockMovement = StockMovement;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], StockMovement.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'warehouse_id', type: 'uuid' }),
    __metadata("design:type", String)
], StockMovement.prototype, "warehouseId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => warehouse_entity_1.Warehouse, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'warehouse_id' }),
    __metadata("design:type", warehouse_entity_1.Warehouse)
], StockMovement.prototype, "warehouse", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'product_id', type: 'uuid' }),
    __metadata("design:type", String)
], StockMovement.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_entity_1.Product, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'product_id' }),
    __metadata("design:type", product_entity_1.Product)
], StockMovement.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'quantity_change', type: 'int' }),
    __metadata("design:type", Number)
], StockMovement.prototype, "quantityChange", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: enums_1.StockMovementReason }),
    __metadata("design:type", String)
], StockMovement.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reference_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], StockMovement.prototype, "referenceId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], StockMovement.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], StockMovement.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", user_entity_1.User)
], StockMovement.prototype, "user", void 0);
exports.StockMovement = StockMovement = __decorate([
    (0, typeorm_1.Entity)('stock_movement')
], StockMovement);
//# sourceMappingURL=stock-movement.entity.js.map