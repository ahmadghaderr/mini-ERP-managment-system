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
exports.SupplierInvoicesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const supplier_invoice_entity_1 = require("./entities/supplier-invoice.entity");
const supplier_invoice_item_entity_1 = require("./entities/supplier-invoice-item.entity");
const enums_1 = require("../../common/enums");
const typeorm_3 = require("typeorm");
const warehouse_prouct_entity_1 = require("../stock/entities/warehouse-prouct.entity");
const stock_movement_entity_1 = require("../stock/entities/stock-movement.entity");
const enums_2 = require("../../common/enums");
let SupplierInvoicesService = class SupplierInvoicesService {
    invoiceRepo;
    itemRepo;
    dataSource;
    constructor(invoiceRepo, itemRepo, dataSource) {
        this.invoiceRepo = invoiceRepo;
        this.itemRepo = itemRepo;
        this.dataSource = dataSource;
    }
    findAll() {
        return this.invoiceRepo.find({
            relations: ['items', 'warehouse'],
            order: { uploadedAt: 'DESC' },
        });
    }
    async findOne(id) {
        const invoice = await this.invoiceRepo.findOne({
            where: { id },
            relations: ['items', 'warehouse'],
        });
        if (!invoice) {
            throw new common_1.NotFoundException(`Supplier invoice ${id} not found`);
        }
        return invoice;
    }
    create(data) {
        const invoice = this.invoiceRepo.create({
            fileUrl: data.fileUrl,
            warehouseId: data.warehouseId,
            extractedSupplierName: data.extractedSupplierName,
            invoiceDateExtracted: data.invoiceDateExtracted,
            extractedDeliveryDate: data.extractedDeliveryDate,
            items: data.items?.map((it) => this.itemRepo.create(it)),
        });
        return this.invoiceRepo.save(invoice);
    }
    async confirm(id, reviewedBy) {
        const invoice = await this.findOne(id);
        if (invoice.status !== enums_1.SupplierInvoiceStatus.EXTRACTED &&
            invoice.status !== enums_1.SupplierInvoiceStatus.PENDING_EXTRACTION) {
            throw new common_1.BadRequestException(`Cannot confirm an invoice with status "${invoice.status}"`);
        }
        invoice.status = enums_1.SupplierInvoiceStatus.CONFIRMED;
        invoice.confirmedAt = new Date();
        invoice.reviewedBy = reviewedBy;
        return this.invoiceRepo.save(invoice);
    }
    async reject(id, reviewedBy) {
        const invoice = await this.findOne(id);
        invoice.status = enums_1.SupplierInvoiceStatus.REJECTED;
        invoice.reviewedBy = reviewedBy;
        return this.invoiceRepo.save(invoice);
    }
    async deliver(id) {
        const invoice = await this.findOne(id);
        if (invoice.status !== enums_1.SupplierInvoiceStatus.CONFIRMED) {
            throw new common_1.BadRequestException(`Only confirmed invoices can be delivered (current: "${invoice.status}")`);
        }
        return this.dataSource.transaction(async (manager) => {
            for (const item of invoice.items) {
                if (!item.matchedProductId)
                    continue;
                let stock = await manager.findOne(warehouse_prouct_entity_1.WarehouseProduct, {
                    where: {
                        warehouseId: invoice.warehouseId,
                        productId: item.matchedProductId,
                    },
                });
                if (!stock) {
                    stock = manager.create(warehouse_prouct_entity_1.WarehouseProduct, {
                        warehouseId: invoice.warehouseId,
                        productId: item.matchedProductId,
                        quantityOnHand: 0,
                        quantityReserved: 0,
                    });
                }
                stock.quantityOnHand += item.quantity;
                await manager.save(stock);
                const movement = manager.create(stock_movement_entity_1.StockMovement, {
                    warehouseId: invoice.warehouseId,
                    productId: item.matchedProductId,
                    quantityChange: item.quantity,
                    reason: enums_2.StockMovementReason.INVOICE_DELIVERED,
                    referenceId: invoice.id,
                });
                await manager.save(movement);
            }
            invoice.status = enums_1.SupplierInvoiceStatus.DELIVERED;
            invoice.deliveredAt = new Date();
            return manager.save(invoice);
        });
    }
    invoice;
    status = enums_1.SupplierInvoiceStatus.DELIVERED;
    invoice;
    deliveredAt = new Date();
};
exports.SupplierInvoicesService = SupplierInvoicesService;
exports.SupplierInvoicesService = SupplierInvoicesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(supplier_invoice_entity_1.SupplierInvoice)),
    __param(1, (0, typeorm_1.InjectRepository)(supplier_invoice_item_entity_1.SupplierInvoiceItem)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_3.DataSource])
], SupplierInvoicesService);
return this.invoiceRepo.save(invoice);
async;
remove(id, string);
Promise < void  > {
    const: invoice = await this.findOne(id),
    await, this: .invoiceRepo.remove(invoice)
};
//# sourceMappingURL=supplier-invoices.service.js.map