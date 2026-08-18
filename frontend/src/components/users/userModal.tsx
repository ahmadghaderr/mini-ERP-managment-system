import { useState } from "react";
import "./users.css";
import type { User, UserFormData, UserModalProps } from "../../types/user";

const roles = ["Admin", "Manager", "Staff"];

export default function UserModal({ user, onSave, onClose }: UserModalProps) {
  const [formData, setFormData] = useState<UserFormData>({
    fullName: user?.fullName ?? "",
    email: user?.email ?? "",
    role: user?.role ?? "Staff",
    status: user?.status ?? "active",
  });

  const handleSubmit = () => {
    if (!formData.fullName || !formData.email) {
      alert("Please fill in all fields");
      return;
    }
    onSave(formData);
  };

  return (
    <div className="usr-modal-overlay" onClick={onClose}>
      <div className="usr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="usr-modal-header">
          <div className="usr-modal-title">
            {user ? "Edit User" : "Add New User"}
          </div>
          <button className="usr-modal-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="usr-modal-body">
          <div className="usr-field">
            <label>Full Name</label>
            <input
              className="usr-input"
              type="text"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              placeholder="Enter full name"
            />
          </div>
          <div className="usr-field">
            <label>Email</label>
            <input
              className="usr-input"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="Enter email address"
            />
          </div>
          <div className="usr-field">
            <label>Role</label>
            <select
              className="usr-select"
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
          <div className="usr-field">
            <label>Status</label>
            <select
              className="usr-select"
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as User["status"],
                })
              }
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
        <div className="usr-modal-footer">
          <button className="usr-btn usr-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="usr-btn usr-btn--primary" onClick={handleSubmit}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {user ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}