import { useState } from "react";
import UserRow from "./userRow";
import UserModal from "./userModal";
import "./users.css";
import type { User, UserListProps } from "../../types/user";

const roles = ["Admin", "Manager", "Staff"];

export function UserList({
  users,
  onEdit,
  onDelete,
  onToggleStatus,
  search,
  onSearchChange,
  filterRole,
  onFilterRoleChange,
  filterStatus,
  onFilterStatusChange,
}: UserListProps) {
  return (
    <div className="usr-card">
      <div className="usr-card-header">
        <div className="usr-card-title">All Users</div>
        <div className="usr-filters">
          <div className="usr-field">
            <input
              className="usr-input"
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <div className="usr-field">
            <select
              className="usr-select"
              value={filterRole}
              onChange={(e) => onFilterRoleChange(e.target.value)}
            >
              <option value="">All Roles</option>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
          <div className="usr-field">
            <select
              className="usr-select"
              value={filterStatus}
              onChange={(e) => onFilterStatusChange(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>
      <div className="usr-tbl-wrap">
        <table className="usr-tbl">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="usr-empty">
                    <div className="usr-empty-title">No users found</div>
                    <div className="usr-empty-sub">
                      {search || filterRole || filterStatus
                        ? "Try adjusting your filters"
                        : "Start by adding your first user"}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onToggleStatus={onToggleStatus}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const initialUsers: User[] = [
  {
    id: "1",
    fullName: "John Doe",
    email: "john@erp.com",
    role: "Admin",
    status: "active",
    lastActive: "2026-08-12 14:30",
  },
  {
    id: "2",
    fullName: "Jane Smith",
    email: "jane@erp.com",
    role: "Manager",
    status: "active",
    lastActive: "2026-08-12 11:20",
  },
  {
    id: "3",
    fullName: "Bob Johnson",
    email: "bob@erp.com",
    role: "Staff",
    status: "inactive",
    lastActive: "2026-08-10 09:15",
  },
  {
    id: "4",
    fullName: "Alice Brown",
    email: "alice@erp.com",
    role: "Manager",
    status: "pending",
    lastActive: "2026-08-11 16:45",
  },
];

export default function Users() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.fullName.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = !filterRole || user.role === filterRole;
    const matchesStatus = !filterStatus || user.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleAddUser = () => {
    setEditingUser(null);
    setShowModal(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const handleSaveUser = (userData: Omit<User, "id" | "lastActive">) => {
    if (editingUser) {
      setUsers(
        users.map((u) => (u.id === editingUser.id ? { ...u, ...userData } : u)),
      );
    } else {
      const newUser: User = {
        id: Date.now().toString(),
        ...userData,
        lastActive: new Date().toLocaleString(),
      };
      setUsers([newUser, ...users]);
    }
    setShowModal(false);
    setEditingUser(null);
  };

  const handleDeleteUser = (id: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      setUsers(users.filter((u) => u.id !== id));
    }
  };

  const handleToggleStatus = (id: string) => {
    setUsers(
      users.map((u) =>
        u.id === id
          ? { ...u, status: u.status === "active" ? "inactive" : "active" }
          : u,
      ),
    );
  };

  return (
    <div className="usr-pg">
      <div className="usr-pg-head">
        <div className="usr-pg-head-left">
          <div className="usr-pg-title">Users</div>
          <p className="usr-pg-sub">Manage user accounts and permissions</p>
        </div>
        <div className="usr-pg-head-right">
          <button className="usr-btn usr-btn--primary" onClick={handleAddUser}>
            + Add User
          </button>
        </div>
      </div>

      <UserList
        users={filteredUsers}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
        onToggleStatus={handleToggleStatus}
        search={search}
        onSearchChange={setSearch}
        filterRole={filterRole}
        onFilterRoleChange={setFilterRole}
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
      />

      {showModal && (
        <UserModal
          user={editingUser}
          onSave={handleSaveUser}
          onClose={() => {
            setShowModal(false);
            setEditingUser(null);
          }}
        />
      )}
    </div>
  );
}
