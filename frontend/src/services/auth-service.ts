import axios from 'axios';
import type { CurrentUser } from '../types/user';

const API_BASE = import.meta.env.VITE_API_URL;

export function authHeaders() {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const response = await axios.get<CurrentUser>(`${API_BASE}/auth/me`, {
    headers: authHeaders(),
  });
  return response.data;
}

export function logout(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('idToken');
}
