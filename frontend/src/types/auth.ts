import type { ReactNode } from 'react';
import type { Role } from '../components/permissions/permissions';

export interface AuthFieldProps {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export interface AuthCardProps {
  title: string;
  subtitle: string;
  error?: string;
  children: ReactNode;
}

export interface CurrentUser {
  userName: string;
  userEmail: string;
  role: Role;
}