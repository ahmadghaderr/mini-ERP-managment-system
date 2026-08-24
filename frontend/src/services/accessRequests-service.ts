import axios from 'axios';
import type { AccessRequest, ApproveAccessRequestPayload } from '../types/accessRequests';

const API_BASE = import.meta.env.VITE_API_URL;

function authHeaders() {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function submitAccessRequest(email: string): Promise<AccessRequest> {
  const response = await axios.post(`${API_BASE}/access-requests`, { email });
  return response.data;
}

export async function fetchAccessRequests(): Promise<AccessRequest[]> {
  const response = await axios.get(`${API_BASE}/access-requests`, {
    headers: authHeaders(),
  });
  return response.data;
}

export async function approveAccessRequest(
  id: string,
  payload: ApproveAccessRequestPayload,
): Promise<void> {
  await axios.patch(`${API_BASE}/access-requests/${id}/approve`, payload, {
    headers: authHeaders(),
  });
}

export async function rejectAccessRequest(id: string): Promise<void> {
  await axios.patch(`${API_BASE}/access-requests/${id}/reject`, null, {
    headers: authHeaders(),
  });
}

