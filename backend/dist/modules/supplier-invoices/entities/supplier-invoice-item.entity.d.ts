import { SupplierInvoice } from './supplier-invoice.entity';
import { Product } from '../../products/entities/product.entity';
export declare class SupplierInvoiceItem {
    id: string;
    supplierInvoiceId: string;
    supplierInvoice: SupplierInvoice;
    extractedProductName: string;
    matchedProductId?: string;
    matchedProduct?: Product;
    quantity: number;
    unitPrice?: number;
}
