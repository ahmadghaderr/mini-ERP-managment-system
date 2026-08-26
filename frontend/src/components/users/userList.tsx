import { useTranslation } from "react-i18next";
import UserRow from "./userRow";
import "./users.css";
import type { UserListProps } from "../../types/user";

const roles = ["admin", "manager", "staff"];

export function UserList({
  users,
  onEdit,
  onDelete,
  search,
  onSearchChange,
  filterRole,
  onFilterRoleChange,
}: UserListProps) {
  const { t } = useTranslation();
  return (
    <div className="usr-card">
      <div className="usr-card-header">
        <div className="usr-card-title">{t("users.allUsers")}</div>
        <div className="usr-filters">
          <div className="search-wrap usr-search-wrap">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="search-input"
              type="text"
              placeholder={t("users.searchPlaceholder")}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <div className="usr-field">
            <select className="usr-select" value={filterRole} onChange={(e) => onFilterRoleChange(e.target.value)}>
              <option value="">{t("users.allRoles")}</option>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {t(`users.roles.${role}`)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="usr-tbl-wrap">
        <table className="usr-tbl">
          <thead>
            <tr>
              <th>{t("users.colUser")}</th>
              <th>{t("users.colEmail")}</th>
              <th>{t("users.colRole")}</th>
              <th>{t("users.colCreated")}</th>
              <th>{t("users.colActions")}</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="usr-empty">
                    <div className="usr-empty-title">{t("users.noUsersFound")}</div>
                    <div className="usr-empty-sub">
                      {search || filterRole ? t("users.tryAdjustingFilters") : t("users.startByAdding")}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((user) => <UserRow key={user.id} user={user} onEdit={onEdit} onDelete={onDelete} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}