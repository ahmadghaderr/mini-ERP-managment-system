export type Category = "water" | "food" | "healthcare" | "electronics";

export interface Product {
  id: string;
  name: string;
  category: Category;
  price: number;
}

export type ProductFormData = Omit<Product, "id">;