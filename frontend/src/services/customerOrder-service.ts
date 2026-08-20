import axios from 'axios';
import type { CustomerOrder, CustomerOrderItem, UploadCustomerOrderResponse } from '../types/order';

const API_BASE = 'http://localhost:3001';

function authHeaders() {
  const token = localStorage.getItem('accessToken');
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchCustomerOrders(): Promise<CustomerOrder[]> {
  const response = await axios.get(`${API_BASE}/customer-orders`, {
    headers: authHeaders(),
  });
  return response.data;
}

export async function fetchCustomerOrder(id: string): Promise<CustomerOrder> {
  const response = await axios.get(`${API_BASE}/customer-orders/${id}`, {
    headers: authHeaders(),
  });
  return response.data;
}

export async function uploadCustomerOrder(
  file: File,
  warehouseId: string,
): Promise<UploadCustomerOrderResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('warehouseId', warehouseId);

  const response = await axios.post(`${API_BASE}/customer-orders/upload`, formData, {
    headers: {
      ...authHeaders(),
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

export async function matchCustomerOrderItem(
  orderId: string,
  itemId: string,
  matchedProductId: string,
): Promise<CustomerOrderItem> {
  const response = await axios.patch(
    `${API_BASE}/customer-orders/${orderId}/items/${itemId}/match`,
    { matchedProductId },
    { headers: { ...authHeaders(), 'Content-Type': 'application/json' } },
  );
  return response.data;
}

export async function confirmCustomerOrder(id: string): Promise<CustomerOrder> {
  const response = await axios.patch(
    `${API_BASE}/customer-orders/${id}/confirm`,
    {},
    { headers: authHeaders() },
  );
  return response.data;
}

export async function deliverCustomerOrder(id: string): Promise<CustomerOrder> {
  const response = await axios.patch(
    `${API_BASE}/customer-orders/${id}/deliver`,
    {},
    { headers: authHeaders() },
  );
  return response.data;
}

export async function rejectCustomerOrder(id: string): Promise<CustomerOrder> {
  const response = await axios.patch(
    `${API_BASE}/customer-orders/${id}/reject`,
    {},
    { headers: authHeaders() },
  );
  return response.data;
}