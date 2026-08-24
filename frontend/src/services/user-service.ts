import axios from 'axios';
import type { User, CreateUserPayload, UpdateUserPayload } from '../types/user';

const API_BASE = import.meta.env.VITE_API_URL;

function authHeaders() {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchUsers(): Promise<User[]> {
  const response = await axios.get(`${API_BASE}/users`, {
    headers: authHeaders(),
  });
  return response.data;
}

export async function createUser(data: CreateUserPayload): Promise<User> {
  const response = await axios.post(`${API_BASE}/users`, data, {
    headers: authHeaders(),
  });
  return response.data;
}

export async function updateUser(id: string, data: UpdateUserPayload): Promise<User> {
  const response = await axios.patch(`${API_BASE}/users/${id}`, data, {
    headers: authHeaders(),
  });
  return response.data;
}

export async function deleteUser(id: string): Promise<void> {
  await axios.delete(`${API_BASE}/users/${id}`, {
    headers: authHeaders(),
  });
}
