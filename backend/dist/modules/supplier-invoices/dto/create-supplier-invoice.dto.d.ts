import { CreateSupplierInvoiceItemDto } from './create-supplier-invoice-item.dto';
export declare class CreateSupplierInvoiceDto {
    fileUrl: string;
    warehouseId: string;
    extractedSupplierName?: string;
    invoiceDateExtracted?: string;
    extractedDeliveryDate?: string;
    items?: CreateSupplierInvoiceItemDto[];
}
