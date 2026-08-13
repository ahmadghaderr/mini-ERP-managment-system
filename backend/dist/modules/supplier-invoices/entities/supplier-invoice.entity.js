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
exports.SupplierInvoice = void 0;
const typeorm_1 = require("typeorm");
const warehouse_entity_1 = require("../../warehouse/entities/warehouse.entity");
const user_entity_1 = require("../../users/entities/user.entity");
const supplier_invoice_item_entity_1 = require("./supplier-invoice-item.entity");
const enums_1 = require("../../../common/enums");
let SupplierInvoice = class SupplierInvoice {
    id;
    fileUrl;
    extractedSupplierName;
    invoiceDateExtracted;
    extractedDeliveryDate;
    warehouseId;
    warehouse;
    status;
    uploadedAt;
    confirmedAt;
    deliveredAt;
    reviewedBy;
    reviewer;
    items;
};
exports.SupplierInvoice = SupplierInvoice;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SupplierInvoice.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_url', type: 'text' }),
    __metadata("design:type", String)
], SupplierInvoice.prototype, "fileUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'extracted_supplier_name', length: 200, nullable: true }),
    __metadata("design:type", String)
], SupplierInvoice.prototype, "extractedSupplierName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'invoice_date_extracted', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], SupplierInvoice.prototype, "invoiceDateExtracted", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'extracted_delivery_date', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], SupplierInvoice.prototype, "extractedDeliveryDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'warehouse_id', type: 'uuid' }),
    __metadata("design:type", String)
], SupplierInvoice.prototype, "warehouseId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => warehouse_entity_1.Warehouse, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'warehouse_id' }),
    __metadata("design:type", warehouse_entity_1.Warehouse)
], SupplierInvoice.prototype, "warehouse", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: enums_1.SupplierInvoiceStatus,
        default: enums_1.SupplierInvoiceStatus.PENDING_EXTRACTION,
    }),
    __metadata("design:type", String)
], SupplierInvoice.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'uploaded_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], SupplierInvoice.prototype, "uploadedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'confirmed_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], SupplierInvoice.prototype, "confirmedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'delivered_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], SupplierInvoice.prototype, "deliveredAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reviewed_by', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], SupplierInvoice.prototype, "reviewedBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'reviewed_by' }),
    __metadata("design:type", user_entity_1.User)
], SupplierInvoice.prototype, "reviewer", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => supplier_invoice_item_entity_1.SupplierInvoiceItem, (item) => item.supplierInvoice, {
        cascade: true,
    }),
    __metadata("design:type", Array)
], SupplierInvoice.prototype, "items", void 0);
exports.SupplierInvoice = SupplierInvoice = __decorate([
    (0, typeorm_1.Entity)('supplier_invoice')
], SupplierInvoice);
//# sourceMappingURL=supplier-invoice.entity.js.map