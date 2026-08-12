export interface WarehouseItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  minStock: number;
  location: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}