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
exports.SupplierInvoiceItem = void 0;
const typeorm_1 = require("typeorm");
const supplier_invoice_entity_1 = require("./supplier-invoice.entity");
const product_entity_1 = require("../../products/entities/product.entity");
let SupplierInvoiceItem = class SupplierInvoiceItem {
    id;
    supplierInvoiceId;
    supplierInvoice;
    extractedProductName;
    matchedProductId;
    matchedProduct;
    quantity;
    unitPrice;
};
exports.SupplierInvoiceItem = SupplierInvoiceItem;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SupplierInvoiceItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'supplier_invoice_id', type: 'uuid' }),
    __metadata("design:type", String)
], SupplierInvoiceItem.prototype, "supplierInvoiceId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => supplier_invoice_entity_1.SupplierInvoice, (invoice) => invoice.items, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'supplier_invoice_id' }),
    __metadata("design:type", supplier_invoice_entity_1.SupplierInvoice)
], SupplierInvoiceItem.prototype, "supplierInvoice", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'extracted_product_name', length: 255 }),
    __metadata("design:type", String)
], SupplierInvoiceItem.prototype, "extractedProductName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'matched_product_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], SupplierInvoiceItem.prototype, "matchedProductId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_entity_1.Product, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'matched_product_id' }),
    __metadata("design:type", product_entity_1.Product)
], SupplierInvoiceItem.prototype, "matchedProduct", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], SupplierInvoiceItem.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'unit_price',
        type: 'numeric',
        precision: 12,
        scale: 2,
        nullable: true,
    }),
    __metadata("design:type", Number)
], SupplierInvoiceItem.prototype, "unitPrice", void 0);
exports.SupplierInvoiceItem = SupplierInvoiceItem = __decorate([
    (0, typeorm_1.Entity)('supplier_invoice_items')
], SupplierInvoiceItem);
//# sourceMappingURL=supplier-invoice-item.entity.js.map