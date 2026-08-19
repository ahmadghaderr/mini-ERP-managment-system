export interface OrderItem {
  id: string;
  extractedName: string;
  quantity: number;
}

export type ItemAvailability = "available" | "partial" | "unavailable";

export type OrderStep = "idle" | "extracting" | "extracted";

export interface NewCustomerOrderPayload {
  customerName: string;
  items: OrderItem[];
}

export type CustomerOrderStatus = "pending" | "confirmed" | "delivered" | "rejected";

export interface CustomerOrderSummary {
  id: string;
  customerName: string;
  orderDate: string;
  deliveryDate: string;
  warehouse: string;
  status: CustomerOrderStatus;
}