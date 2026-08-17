import type { ReactNode } from 'react';

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