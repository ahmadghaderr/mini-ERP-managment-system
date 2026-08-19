export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  STAFF = 'staff',
}

export enum ProductCategory {
  WATER = 'water',
  FOOD = 'food',
  HEALTHCARE = 'healthcare',
  ELECTRONICS = 'electronics',
  OTHERS = 'others',
}

export enum StockMovementReason {
  INVOICE_DELIVERED = 'invoice_delivered',
  ORDER_DELIVERED = 'order_delivered',
  TRANSFER_OUT = 'transfer_out',
  TRANSFER_IN = 'transfer_in',
  ADJUSTMENT = 'adjustment',
}

export enum SupplierInvoiceStatus {
  PENDING_EXTRACTION = 'pending_extraction',
  EXTRACTED = 'extracted',
  CONFIRMED = 'confirmed',
  DELIVERED = 'delivered',
  REJECTED = 'rejected',
}

export enum CustomerOrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  DELIVERED = 'delivered',
  REJECTED = 'rejected',
}

export enum AccessRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}
