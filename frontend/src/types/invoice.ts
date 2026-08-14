export type InvoiceStatus =
  | "pending_extraction"
  | "extracted"
  | "confirmed"
  | "delivered"
  | "rejected";

export interface InvoiceType {
  id: string;
  name: string;
}

export interface SupplierInvoice {
  id: string;
  supplier: string;
  invoiceDate: string;
  deliveryDate: string;
  warehouse: string;
  type: string;
  status: InvoiceStatus;
}

export interface InvoiceItem {
  id: string;
  extractedName: string;
  quantity: number;
  unitPrice: number;
}