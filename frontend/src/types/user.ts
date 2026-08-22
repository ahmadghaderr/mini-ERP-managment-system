export type Role = 'admin' | 'manager' | 'staff';

export interface User {
  id: string;
  userName: string;
  userEmail: string;
  role: Role;
  createdAt: string;
}

export type CreateUserPayload = Omit<User, 'id' | 'createdAt'>;
export type UpdateUserPayload = Partial<CreateUserPayload>;

export interface UserListProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  filterRole: string;
  onFilterRoleChange: (value: string) => void;
}

export interface UserRowProps {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
}

export interface UserModalProps {
  user: User | null;
  onSave: (data: CreateUserPayload) => void;
  onClose: () => void;
}

export interface CurrentUser {
  userName: string;
  userEmail: string;
  role: Role;
}