import { SupplierInvoicesService } from './supplier-invoices.service';
export declare class SupplierInvoicesController {
    private readonly service;
    constructor(service: SupplierInvoicesService);
    findAll(): Promise<import("./entities/supplier-invoice.entity").SupplierInvoice[]>;
    findOne(id: string): Promise<import("./entities/supplier-invoice.entity").SupplierInvoice>;
    create(data: any): Promise<import("./entities/supplier-invoice.entity").SupplierInvoice>;
    confirm(id: string, body: {
        reviewedBy?: string;
    }): Promise<import("./entities/supplier-invoice.entity").SupplierInvoice>;
    reject(id: string, body: {
        reviewedBy?: string;
    }): Promise<import("./entities/supplier-invoice.entity").SupplierInvoice>;
    deliver(id: string): Promise<import("./entities/supplier-invoice.entity").SupplierInvoice>;
    remove(id: string): any;
}
