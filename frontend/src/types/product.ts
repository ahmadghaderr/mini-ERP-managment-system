export type ProductCategory = 'water' | 'food' | 'healthcare' | 'electronics' | 'others';

export interface Product {
  id: string;
  productName: string;
  category: ProductCategory;
  price: number;
  createdAt: string;
  updatedAt: string;
}

export type CreateProductPayload = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateProductPayload = Partial<CreateProductPayload>;