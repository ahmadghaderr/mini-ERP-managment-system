export type TransferStatus =
  | "pending"
  | "approved"
  | "dispatched"
  | "received"
  | "cancelled";

export interface Warehouse {
  id: string;
  name: string;
  code: string;
}

export interface TransferItem {
  productId: string;
  productName: string;
  quantity: number;
}

export interface TransferRequest {
  id: string;
  sourceWarehouseId: string;
  sourceWarehouseName: string;
  destinationWarehouseId: string;
  destinationWarehouseName: string;
  items: TransferItem[];
  status: TransferStatus;
  requestedBy: string;
  requestedAt: string;
  dispatchedAt?: string;
  receivedAt?: string;
  notes?: string;
}

export interface LedgerEntry {
  id: string;
  transferId?: string;
  timestamp: string;
  productId?: string;
  productName: string;
  quantity: number;
  fromWarehouse?: string;
  toWarehouse?: string;
  performedBy: string;
  type: "TRANSFER_IN" | "TRANSFER_OUT" | "ADJUSTMENT_IN" | "ADJUSTMENT_OUT";
  reason?: string;
}

export type NewTransferPayload = Omit<
  TransferRequest,
  "id" | "status" | "requestedAt"
>;

export interface OpeningStockRow {
  productName: string;
  warehouseName: string;
  quantity: number;
}

export interface StockLevel {
  productName: string;
  warehouseName: string;
  quantity: number;
}