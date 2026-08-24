import axios from 'axios';
import type { WarehouseStock, StockMovement, AdjustStockPayload } from '../types/stock';

const API_BASE = import.meta.env.VITE_API_URL;

function authHeaders() {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchStockLevels(): Promise<WarehouseStock[]> {
  const response = await axios.get(`${API_BASE}/stock/levels`, {
    headers: authHeaders(),
  });
  return response.data;
}

export async function fetchStockMovements(): Promise<StockMovement[]> {
  const response = await axios.get(`${API_BASE}/stock/movements`, {
    headers: authHeaders(),
  });
  return response.data;
}

export async function adjustStock(data: AdjustStockPayload): Promise<StockMovement> {
  const response = await axios.post(`${API_BASE}/stock/adjustments`, data, {
    headers: authHeaders(),
  });
  return response.data;
}
