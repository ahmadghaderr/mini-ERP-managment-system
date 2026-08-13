import { Repository } from 'typeorm';
import { SupplierInvoice } from './entities/supplier-invoice.entity';
import { SupplierInvoiceItem } from './entities/supplier-invoice-item.entity';
import { SupplierInvoiceStatus } from '../../common/enums';
import { DataSource } from 'typeorm';
interface ItemInput {
    extractedProductName: string;
    matchedProductId?: string;
    quantity: number;
    unitPrice?: number;
}
export declare class SupplierInvoicesService {
    private readonly invoiceRepo;
    private readonly itemRepo;
    private readonly dataSource;
    constructor(invoiceRepo: Repository<SupplierInvoice>, itemRepo: Repository<SupplierInvoiceItem>, dataSource: DataSource);
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
    invoice: any;
    status: SupplierInvoiceStatus;
    invoice: any;
    deliveredAt: Date;
}
export {};
