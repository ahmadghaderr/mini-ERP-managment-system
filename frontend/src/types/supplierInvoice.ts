export type SupplierInvoiceStatus =
  | 'pending_extraction'
  | 'extracted'
  | 'confirmed'
  | 'delivered'
  | 'rejected';

export interface SupplierInvoiceItem {
  id: string;
  supplierInvoiceId: string;
  extractedProductName: string;
  matchedProductId: string | null;
  quantity: number;
  unitPrice: number | null;
}

export interface SupplierInvoice {
  id: string;
  fileUrl: string;
  extractedSupplierName: string | null;
  invoiceDateExtracted: string | null;
  extractedDeliveryDate: string | null;
  warehouseId: string;
  status: SupplierInvoiceStatus;
  uploadedAt: string;
  confirmedAt: string | null;
  deliveredAt: string | null;
  reviewedBy: string | null;
  items: SupplierInvoiceItem[];
  warehouse?: { id: string; warehouseName: string };
}

export interface CreateSupplierInvoiceItemPayload {
  extractedProductName: string;
  quantity: number;
  unitPrice?: number;
}

export interface CreateSupplierInvoicePayload {
  fileUrl: string;
  warehouseId: string;
  extractedSupplierName?: string;
  invoiceDateExtracted?: string;
  extractedDeliveryDate?: string;
  items?: CreateSupplierInvoiceItemPayload[];
}