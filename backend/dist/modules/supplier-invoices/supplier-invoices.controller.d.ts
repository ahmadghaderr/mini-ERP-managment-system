import { SupplierInvoicesService } from './supplier-invoices.service';
import { CreateSupplierInvoiceDto } from './dto/create-supplier-invoice.dto';
import { ReviewSupplierInvoiceDto } from './dto/review-supplier-invoice.dto';
import { MatchItemDto } from './dto/match-item.dto';
export declare class SupplierInvoicesController {
    private readonly service;
    constructor(service: SupplierInvoicesService);
    findAll(): Promise<import("./entities/supplier-invoice.entity").SupplierInvoice[]>;
    findOne(id: string): Promise<import("./entities/supplier-invoice.entity").SupplierInvoice>;
    create(data: CreateSupplierInvoiceDto): Promise<import("./entities/supplier-invoice.entity").SupplierInvoice>;
    matchItem(invoiceId: string, itemId: string, dto: MatchItemDto): Promise<import("./entities/supplier-invoice-item.entity").SupplierInvoiceItem>;
    confirm(id: string, body: ReviewSupplierInvoiceDto): Promise<import("./entities/supplier-invoice.entity").SupplierInvoice>;
    reject(id: string, body: ReviewSupplierInvoiceDto): Promise<import("./entities/supplier-invoice.entity").SupplierInvoice>;
    deliver(id: string): Promise<import("./entities/supplier-invoice.entity").SupplierInvoice>;
    remove(id: string): Promise<void>;
}
