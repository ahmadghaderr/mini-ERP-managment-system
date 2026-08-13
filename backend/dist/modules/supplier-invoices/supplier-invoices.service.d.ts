import { Repository } from 'typeorm';
import { SupplierInvoice } from './entities/supplier-invoice.entity';
import { SupplierInvoiceItem } from './entities/supplier-invoice-item.entity';
interface ItemInput {
    extractedProductName: string;
    matchedProductId?: string;
    quantity: number;
    unitPrice?: number;
}
export declare class SupplierInvoicesService {
    private readonly invoiceRepo;
    private readonly itemRepo;
    constructor(invoiceRepo: Repository<SupplierInvoice>, itemRepo: Repository<SupplierInvoiceItem>);
    findAll(): Promise<SupplierInvoice[]>;
    findOne(id: string): Promise<SupplierInvoice>;
    create(data: {
        fileUrl: string;
        warehouseId: string;
        extractedSupplierName?: string;
        invoiceDateExtracted?: Date;
        extractedDeliveryDate?: Date;
        items?: ItemInput[];
    }): Promise<SupplierInvoice>;
    confirm(id: string, reviewedBy?: string): Promise<SupplierInvoice>;
    reject(id: string, reviewedBy?: string): Promise<SupplierInvoice>;
    deliver(id: string): Promise<SupplierInvoice>;
    remove(id: string): Promise<void>;
}
export {};
