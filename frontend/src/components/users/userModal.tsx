import { useState } from "react";
import "./users.css";
import type { CreateUserPayload, Role, UserModalProps } from "../../types/user";

const roles: Role[] = ["admin", "manager", "staff"];

export default function UserModal({ user, onSave, onClose }: UserModalProps) {
  const [formData, setFormData] = useState<CreateUserPayload>({
    userName: user?.userName ?? "",
    userEmail: user?.userEmail ?? "",
    role: user?.role ?? "staff",
  });

  const handleSubmit = () => {
    if (!formData.userName || !formData.userEmail) {
      alert("Please fill in all fields");
      return;
    }
    onSave(formData);
  };

  return (
    <div className="usr-modal-overlay" onClick={onClose}>
      <div className="usr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="usr-modal-header">
          <div className="usr-modal-title">{user ? "Edit User" : "Add New User"}</div>
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
              value={formData.userName}
              onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
              placeholder="Enter full name"
            />
          </div>
          <div className="usr-field">
            <label>Email</label>
            <input
              className="usr-input"
              type="email"
              value={formData.userEmail}
              onChange={(e) => setFormData({ ...formData, userEmail: e.target.value })}
              placeholder="Enter email address"
              disabled={!!user}
            />
          </div>
          <div className="usr-field">
            <label>Role</label>
            <select
              className="usr-select"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
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