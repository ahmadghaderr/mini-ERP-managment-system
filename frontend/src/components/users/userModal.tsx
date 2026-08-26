import { useState } from "react";
import { useTranslation } from "react-i18next";
import "./users.css";
import type { CreateUserPayload, Role, UserModalProps } from "../../types/user";

const roles: Role[] = ["admin", "manager", "staff"];

export default function UserModal({ user, onSave, onClose }: UserModalProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<CreateUserPayload>({
    userName: user?.userName ?? "",
    userEmail: user?.userEmail ?? "",
    role: user?.role ?? "staff",
  });

  const handleSubmit = () => {
    if (!formData.userName || !formData.userEmail) {
      alert(t("users.fillAllFields"));
      return;
    }
    onSave(formData);
  };

  return (
    <div className="usr-modal-overlay" onClick={onClose}>
      <div className="usr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="usr-modal-header">
          <div className="usr-modal-title">{user ? t("users.modalTitleEdit") : t("users.modalTitleAdd")}</div>
          <button className="usr-modal-close" onClick={onClose} aria-label={t("common.close")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="usr-modal-body">
          <div className="usr-field">
            <label>{t("users.fieldFullName")}</label>
            <input
              className="usr-input"
              type="text"
              value={formData.userName}
              onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
              placeholder={t("users.fieldFullNamePlaceholder")}
            />
          </div>
          <div className="usr-field">
            <label>{t("users.fieldEmail")}</label>
            <input
              className="usr-input"
              type="email"
              value={formData.userEmail}
              onChange={(e) => setFormData({ ...formData, userEmail: e.target.value })}
              placeholder={t("users.fieldEmailPlaceholder")}
              disabled={!!user}
            />
          </div>
          <div className="usr-field">
            <label>{t("users.fieldRole")}</label>
            <select
              className="usr-select"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {t(`users.roles.${role}`)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="usr-modal-footer">
          <button className="usr-btn usr-btn--ghost" onClick={onClose}>
            {t("common.cancel")}
          </button>
          <button className="usr-btn usr-btn--primary" onClick={handleSubmit}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {user ? t("users.update") : t("users.create")}
          </button>
        </div>
      </div>
    </div>
  );
}