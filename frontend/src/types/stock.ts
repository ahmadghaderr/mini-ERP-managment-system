export type StockMovementReason =
  | "invoice_delivered"
  | "order_delivered"
  | "transfer_out"
  | "transfer_in"
  | "adjustment";

export interface WarehouseStock {
  id: string;
  warehouseId: string;
  productId: string;
  quantityOnHand: number;
  quantityReserved: number;
  updatedAt: string;
  warehouse?: { id: string; warehouseName: string };
  product?: { id: string; productName: string };
}

export interface StockMovement {
  id: string;
  warehouseId: string;
  productId: string;
  quantityChange: number;
  reason: StockMovementReason;
  referenceId: string | null;
  createdAt: string;
  createdById: string | null;
  warehouse?: { id: string; warehouseName: string };
  product?: { id: string; productName: string };
}

export interface AdjustStockPayload {
  warehouseId: string;
  productId: string;
  quantityChange: number;
  createdBy?: string;
}

export interface WarehouseTransfer {
  id: string;
  productId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  createdAt: string;
  createdById: string | null;
  product?: { id: string; productName: string };
  fromWarehouse?: { id: string; warehouseName: string };
  toWarehouse?: { id: string; warehouseName: string };
}

export interface CreateTransferPayload {
  productId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  createdBy?: string;
}