import axios from 'axios';
import type { Product, CreateProductPayload, UpdateProductPayload } from '../types/product';

const API_BASE = import.meta.env.VITE_API_URL;

function authHeaders() {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchProducts(): Promise<Product[]> {
  const response = await axios.get(`${API_BASE}/products`, {
    headers: authHeaders(),
  });
  return response.data;
}

export async function fetchProduct(id: string): Promise<Product> {
  const response = await axios.get(`${API_BASE}/products/${id}`, {
    headers: authHeaders(),
  });
  return response.data;
}

export async function createProduct(data: CreateProductPayload): Promise<Product> {
  const response = await axios.post(`${API_BASE}/products`, data, {
    headers: authHeaders(),
  });
  return response.data;
}

export async function updateProduct(id: string, data: UpdateProductPayload): Promise<Product> {
  const response = await axios.patch(`${API_BASE}/products/${id}`, data, {
    headers: authHeaders(),
  });
  return response.data;
}

export async function deleteProduct(id: string): Promise<void> {
  await axios.delete(`${API_BASE}/products/${id}`, {
    headers: authHeaders(),
  });
}
