import axios from 'axios';
import type { WarehouseTransfer, CreateTransferPayload } from '../types/stock';

const API_BASE = import.meta.env.VITE_API_URL;

function authHeaders() {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchTransfers(): Promise<WarehouseTransfer[]> {
  const response = await axios.get(`${API_BASE}/transfers`, {
    headers: authHeaders(),
  });
  return response.data;
}

export async function createTransfer(data: CreateTransferPayload): Promise<WarehouseTransfer> {
  const response = await axios.post(`${API_BASE}/transfers`, data, {
    headers: authHeaders(),
  });
  return response.data;
}
