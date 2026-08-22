export type CustomerOrderStatus = "pending" | "confirmed" | "delivered" | "rejected";

export interface CustomerOrderItem {
  id: string;
  customerOrderId: string;
  extractedProductName: string;
  matchedProductId: string | null;
  quantity: number;
  unitPrice: number | null;
}

export interface CustomerOrder {
  id: string;
  fileUrl: string;
  extractedCustomerName?: string;
  warehouseId: string;
  status: CustomerOrderStatus;
  uploadedAt: string;
  confirmedAt: string | null;
  deliveredAt: string | null;
  rejectedAt: string | null;
  reviewedBy: string | null;
  items: CustomerOrderItem[];
  warehouse: {
    id: string;
    warehouseName: string;
    warehouseLocation: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface UploadCustomerOrderResponse {
  order: CustomerOrder;
  lowConfidenceFields: string[];
}