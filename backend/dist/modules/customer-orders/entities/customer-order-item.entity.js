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
exports.CustomerOrderItem = void 0;
const typeorm_1 = require("typeorm");
const customer_order_entity_1 = require("./customer-order.entity");
const product_entity_1 = require("../../products/entities/product.entity");
let CustomerOrderItem = class CustomerOrderItem {
    id;
    customerOrderId;
    customerOrder;
    extractedProductName;
    matchedProductId;
    matchedProduct;
    quantity;
    unitPrice;
};
exports.CustomerOrderItem = CustomerOrderItem;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CustomerOrderItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'customer_order_id', type: 'uuid' }),
    __metadata("design:type", String)
], CustomerOrderItem.prototype, "customerOrderId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => customer_order_entity_1.CustomerOrder, (order) => order.items, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'customer_order_id' }),
    __metadata("design:type", customer_order_entity_1.CustomerOrder)
], CustomerOrderItem.prototype, "customerOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'extracted_product_name', length: 255 }),
    __metadata("design:type", String)
], CustomerOrderItem.prototype, "extractedProductName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'matched_product_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CustomerOrderItem.prototype, "matchedProductId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_entity_1.Product, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'matched_product_id' }),
    __metadata("design:type", product_entity_1.Product)
], CustomerOrderItem.prototype, "matchedProduct", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], CustomerOrderItem.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'unit_price',
        type: 'numeric',
        precision: 12,
        scale: 2,
        nullable: true,
    }),
    __metadata("design:type", Number)
], CustomerOrderItem.prototype, "unitPrice", void 0);
exports.CustomerOrderItem = CustomerOrderItem = __decorate([
    (0, typeorm_1.Entity)('customer_order_items')
], CustomerOrderItem);
//# sourceMappingURL=customer-order-item.entity.js.map