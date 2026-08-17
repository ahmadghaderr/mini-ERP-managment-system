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
exports.SupplierInvoicesController = void 0;
const common_1 = require("@nestjs/common");
const supplier_invoices_service_1 = require("./supplier-invoices.service");
const create_supplier_invoice_dto_1 = require("./dto/create-supplier-invoice.dto");
const review_supplier_invoice_dto_1 = require("./dto/review-supplier-invoice.dto");
const match_item_dto_1 = require("./dto/match-item.dto");
let SupplierInvoicesController = class SupplierInvoicesController {
    service;
    constructor(service) {
        this.service = service;
    }
    findAll() {
        return this.service.findAll();
    }
    findOne(id) {
        return this.service.findOne(id);
    }
    create(data) {
        return this.service.create(data);
    }
    matchItem(invoiceId, itemId, dto) {
        return this.service.matchItem(invoiceId, itemId, dto.matchedProductId);
    }
    confirm(id, body) {
        return this.service.confirm(id, body?.reviewedBy);
    }
    reject(id, body) {
        return this.service.reject(id, body?.reviewedBy);
    }
    deliver(id) {
        return this.service.deliver(id);
    }
    remove(id) {
        return this.service.remove(id);
    }
};
exports.SupplierInvoicesController = SupplierInvoicesController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SupplierInvoicesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SupplierInvoicesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_supplier_invoice_dto_1.CreateSupplierInvoiceDto]),
    __metadata("design:returntype", void 0)
], SupplierInvoicesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':invoiceId/items/:itemId/match'),
    __param(0, (0, common_1.Param)('invoiceId')),
    __param(1, (0, common_1.Param)('itemId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, match_item_dto_1.MatchItemDto]),
    __metadata("design:returntype", void 0)
], SupplierInvoicesController.prototype, "matchItem", null);
__decorate([
    (0, common_1.Patch)(':id/confirm'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, review_supplier_invoice_dto_1.ReviewSupplierInvoiceDto]),
    __metadata("design:returntype", void 0)
], SupplierInvoicesController.prototype, "confirm", null);
__decorate([
    (0, common_1.Patch)(':id/reject'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, review_supplier_invoice_dto_1.ReviewSupplierInvoiceDto]),
    __metadata("design:returntype", void 0)
], SupplierInvoicesController.prototype, "reject", null);
__decorate([
    (0, common_1.Patch)(':id/deliver'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SupplierInvoicesController.prototype, "deliver", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(204),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SupplierInvoicesController.prototype, "remove", null);
exports.SupplierInvoicesController = SupplierInvoicesController = __decorate([
    (0, common_1.Controller)('supplier-invoices'),
    __metadata("design:paramtypes", [supplier_invoices_service_1.SupplierInvoicesService])
], SupplierInvoicesController);
//# sourceMappingURL=supplier-invoices.controller.js.map