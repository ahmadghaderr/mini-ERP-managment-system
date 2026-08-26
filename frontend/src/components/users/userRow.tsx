import { useTranslation } from "react-i18next";
import type { UserRowProps } from "../../types/user";
import { formatLocalDate } from "../../lib/formatDate";
import i18n from "../../i18n/config";

export default function UserRow({ user, onEdit, onDelete }: UserRowProps) {
  const { t } = useTranslation();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <tr>
      <td>
        <div className="usr-row-user">
          <div className="usr-avatar">{getInitials(user.userName)}</div>
          <strong>{user.userName}</strong>
        </div>
      </td>
      <td>{user.userEmail}</td>
      <td>
        <span className="usr-badge usr-badge--role">{t(`users.roles.${user.role}`)}</span>
      </td>
      <td>{formatLocalDate(user.createdAt, i18n.language)}</td>
      <td>
        <div className="usr-row-actions">
          <button className="usr-btn usr-btn--ghost usr-btn-sm" onClick={() => onEdit(user)}>
            {t("common.edit")}
          </button>
          <button className="usr-btn usr-btn--danger usr-btn-sm" onClick={() => onDelete(user.id)}>
            {t("common.delete")}
          </button>
        </div>
      </td>
    </tr>
  );
}