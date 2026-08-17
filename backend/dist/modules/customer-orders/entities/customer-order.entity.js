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
exports.CustomerOrder = void 0;
const typeorm_1 = require("typeorm");
const warehouse_entity_1 = require("../../warehouse/entities/warehouse.entity");
const user_entity_1 = require("../../users/entities/user.entity");
const customer_order_item_entity_1 = require("./customer-order-item.entity");
const enums_1 = require("../../../common/enums");
let CustomerOrder = class CustomerOrder {
    id;
    fileUrl;
    extractedCustomerName;
    warehouseId;
    warehouse;
    status;
    uploadedAt;
    confirmedAt;
    deliveredAt;
    rejectedAt;
    reviewedBy;
    reviewer;
    items;
};
exports.CustomerOrder = CustomerOrder;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CustomerOrder.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_url', type: 'text' }),
    __metadata("design:type", String)
], CustomerOrder.prototype, "fileUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'extracted_customer_name', length: 200, nullable: true }),
    __metadata("design:type", String)
], CustomerOrder.prototype, "extractedCustomerName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'warehouse_id', type: 'uuid' }),
    __metadata("design:type", String)
], CustomerOrder.prototype, "warehouseId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => warehouse_entity_1.Warehouse, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'warehouse_id' }),
    __metadata("design:type", warehouse_entity_1.Warehouse)
], CustomerOrder.prototype, "warehouse", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: enums_1.CustomerOrderStatus,
        default: enums_1.CustomerOrderStatus.PENDING,
    }),
    __metadata("design:type", String)
], CustomerOrder.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'uploaded_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], CustomerOrder.prototype, "uploadedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'confirmed_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], CustomerOrder.prototype, "confirmedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'delivered_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], CustomerOrder.prototype, "deliveredAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'rejected_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], CustomerOrder.prototype, "rejectedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reviewed_by', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CustomerOrder.prototype, "reviewedBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'reviewed_by' }),
    __metadata("design:type", user_entity_1.User)
], CustomerOrder.prototype, "reviewer", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => customer_order_item_entity_1.CustomerOrderItem, (item) => item.customerOrder, {
        cascade: true,
    }),
    __metadata("design:type", Array)
], CustomerOrder.prototype, "items", void 0);
exports.CustomerOrder = CustomerOrder = __decorate([
    (0, typeorm_1.Entity)('customer_order')
], CustomerOrder);
//# sourceMappingURL=customer-order.entity.js.map