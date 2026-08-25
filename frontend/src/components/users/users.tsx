import { useState, useEffect } from "react";
import { UserList } from "./userList";
import PageLoader from "../shared/PageLoader";
import UserModal from "./userModal";
import "./users.css";
import { fetchUsers, createUser, updateUser, deleteUser } from "../../services/user-service";
import type { User, CreateUserPayload } from "../../types/user";

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.userName.toLowerCase().includes(search.toLowerCase()) ||
      user.userEmail.toLowerCase().includes(search.toLowerCase());
    const matchesRole = !filterRole || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleAddUser = () => {
    setEditingUser(null);
    setShowModal(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowModal(true);
  };

  async function handleSaveUser(data: CreateUserPayload) {
    if (editingUser) {
      await updateUser(editingUser.id, data);
    } else {
      await createUser(data);
    }
    setShowModal(false);
    setEditingUser(null);
    loadUsers();
  }

  async function handleDeleteUser(id: string) {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    await deleteUser(id);
    loadUsers();
  }

  if (loading) {
        return <PageLoader />;
  }

  return (
    <div className="usr-pg">
      <div className="usr-pg-head">
        <div className="usr-pg-head-left">
          <h1 className="usr-pg-title">Users</h1>
        </div>
        <div className="usr-pg-head-right">
          <button className="usr-btn usr-btn--primary" onClick={handleAddUser}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add User
          </button>
        </div>
      </div>

      <UserList
        users={filteredUsers}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
        search={search}
        onSearchChange={setSearch}
        filterRole={filterRole}
        onFilterRoleChange={setFilterRole}
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