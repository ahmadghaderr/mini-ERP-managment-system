import axios from 'axios';
import type { SupplierInvoice, SupplierInvoiceItem } from '../types/supplierInvoice';

const API_BASE = 'http://localhost:3001';

function authHeaders() {
  const token = localStorage.getItem('accessToken');
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface CalendarEventResult {
  success: boolean;
  message: string;
}

export interface ConfirmInvoiceResponse {
  invoice: SupplierInvoice;
  calendarEvent: CalendarEventResult;
}

export async function fetchSupplierInvoices(): Promise<SupplierInvoice[]> {
  const response = await axios.get(`${API_BASE}/supplier-invoices`, {
    headers: authHeaders(),
  });
  return response.data;
}

export async function fetchSupplierInvoice(id: string): Promise<SupplierInvoice> {
  const response = await axios.get(`${API_BASE}/supplier-invoices/${id}`, {
    headers: authHeaders(),
  });
  return response.data;
}

export async function uploadAndExtractSupplierInvoice(
  file: File,
  warehouseId: string,
): Promise<{ invoice: SupplierInvoice; lowConfidenceFields: string[] }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('warehouseId', warehouseId);

  const response = await axios.post(`${API_BASE}/supplier-invoices/upload`, formData, {
    headers: {
      ...authHeaders(),
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

export async function matchSupplierInvoiceItem(
  invoiceId: string,
  itemId: string,
  matchedProductId: string,
): Promise<SupplierInvoiceItem> {
  const response = await axios.patch(
    `${API_BASE}/supplier-invoices/${invoiceId}/items/${itemId}/match`,
    { matchedProductId },
    { headers: { ...authHeaders(), 'Content-Type': 'application/json' } },
  );
  return response.data;
}

export async function confirmSupplierInvoice(id: string): Promise<ConfirmInvoiceResponse> {
  const response = await axios.patch(
    `${API_BASE}/supplier-invoices/${id}/confirm`,
    {},
    { headers: authHeaders() },
  );
  return response.data;
}

export async function rejectSupplierInvoice(id: string): Promise<SupplierInvoice> {
  const response = await axios.patch(
    `${API_BASE}/supplier-invoices/${id}/reject`,
    {},
    { headers: authHeaders() },
  );
  return response.data;
}

export async function deliverSupplierInvoice(id: string): Promise<SupplierInvoice> {
  const response = await axios.patch(
    `${API_BASE}/supplier-invoices/${id}/deliver`,
    {},
    { headers: authHeaders() },
  );
  return response.data;
}

export async function deleteSupplierInvoice(id: string): Promise<void> {
  await axios.delete(`${API_BASE}/supplier-invoices/${id}`, {
    headers: authHeaders(),
  });
}