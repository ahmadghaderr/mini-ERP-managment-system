export interface Warehouse {
  id: string;
  warehouseName: string;
  warehouseLocation: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateWarehousePayload = Omit<Warehouse, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateWarehousePayload = Partial<CreateWarehousePayload>;

export interface WarehouseModalProps {
  warehouse: Warehouse | null;
  onSave: (data: CreateWarehousePayload) => void;
  onClose: () => void;
}