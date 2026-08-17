import { Repository, DataSource } from 'typeorm';
import { SupplierInvoice } from './entities/supplier-invoice.entity';
import { SupplierInvoiceItem } from './entities/supplier-invoice-item.entity';
import { CreateSupplierInvoiceDto } from './dto/create-supplier-invoice.dto';
export declare class SupplierInvoicesService {
    private readonly invoiceRepo;
    private readonly itemRepo;
    private readonly dataSource;
    constructor(invoiceRepo: Repository<SupplierInvoice>, itemRepo: Repository<SupplierInvoiceItem>, dataSource: DataSource);
    findAll(): Promise<SupplierInvoice[]>;
    findOne(id: string): Promise<SupplierInvoice>;
    create(data: CreateSupplierInvoiceDto): Promise<SupplierInvoice>;
    matchItem(invoiceId: string, itemId: string, matchedProductId: string): Promise<SupplierInvoiceItem>;
    confirm(id: string, reviewedBy?: string): Promise<SupplierInvoice>;
    reject(id: string, reviewedBy?: string): Promise<SupplierInvoice>;
    deliver(id: string): Promise<SupplierInvoice>;
    remove(id: string): Promise<void>;
}
