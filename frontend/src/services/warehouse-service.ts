import axios from 'axios';
import type { Warehouse, CreateWarehousePayload, UpdateWarehousePayload } from '../types/warehouse';

const API_BASE = import.meta.env.VITE_API_URL;

function authHeaders() {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchWarehouses(): Promise<Warehouse[]> {
  const response = await axios.get(`${API_BASE}/warehouses`, {
    headers: authHeaders(),
  });
  return response.data;
}

export async function fetchWarehouse(id: string): Promise<Warehouse> {
  const response = await axios.get(`${API_BASE}/warehouses/${id}`, {
    headers: authHeaders(),
  });
  return response.data;
}

export async function createWarehouse(data: CreateWarehousePayload): Promise<Warehouse> {
  const response = await axios.post(`${API_BASE}/warehouses`, data, {
    headers: authHeaders(),
  });
  return response.data;
}

export async function updateWarehouse(id: string, data: UpdateWarehousePayload): Promise<Warehouse> {
  const response = await axios.patch(`${API_BASE}/warehouses/${id}`, data, {
    headers: authHeaders(),
  });
  return response.data;
}

export async function deleteWarehouse(id: string): Promise<void> {
  await axios.delete(`${API_BASE}/warehouses/${id}`, {
    headers: authHeaders(),
  });
}

