import type { Role, Action } from '../permissions/permissions';

export interface CurrentUser {
  id: string;
  userName: string;
  userEmail: string;
  role: Role;
}

export interface NavItem {
  to: string;
  label: string;
  requires?: Action;
}

export interface UserAvatarProps {
  name: string;
  variant: 'sidebar' | 'topbar';
}

export interface UserSummaryProps {
  name: string;
  role: string;
  variant: 'sidebar' | 'topbar';
}