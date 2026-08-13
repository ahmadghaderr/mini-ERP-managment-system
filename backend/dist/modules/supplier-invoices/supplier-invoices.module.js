"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupplierInvoicesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const supplier_invoice_entity_1 = require("./entities/supplier-invoice.entity");
const supplier_invoice_item_entity_1 = require("./entities/supplier-invoice-item.entity");
let SupplierInvoicesModule = class SupplierInvoicesModule {
};
exports.SupplierInvoicesModule = SupplierInvoicesModule;
exports.SupplierInvoicesModule = SupplierInvoicesModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([supplier_invoice_entity_1.SupplierInvoice, supplier_invoice_item_entity_1.SupplierInvoiceItem])],
        exports: [typeorm_1.TypeOrmModule],
    })
], SupplierInvoicesModule);
//# sourceMappingURL=supplier-invoices.module.js.map