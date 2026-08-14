import type { UserRowProps } from "../../types/user";

export default function UserRow({
  user,
  onEdit,
  onDelete,
  onToggleStatus,
}: UserRowProps) {
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
          <div className="usr-avatar">{getInitials(user.fullName)}</div>
          <strong>{user.fullName}</strong>
        </div>
      </td>
      <td>{user.email}</td>
      <td>
        <span className="usr-badge usr-badge--role">{user.role}</span>
      </td>
      <td>
        <span className={`usr-badge usr-badge--${user.status}`}>
          {user.status}
        </span>
      </td>
      <td>{user.lastActive}</td>
      <td>
        <div className="usr-row-actions">
          <button
            className="usr-btn usr-btn--ghost usr-btn-sm"
            onClick={() => onEdit(user)}
          >
            Edit
          </button>
          <button
            className="usr-btn usr-btn--danger usr-btn-sm"
            onClick={() => onDelete(user.id)}
          >
            Delete
          </button>
          <button
            className={`usr-btn usr-btn-sm ${user.status === "active" ? "usr-btn--danger" : "usr-btn--success"}`}
            onClick={() => onToggleStatus(user.id)}
          >
            {user.status === "active" ? "Deactivate" : "Activate"}
          </button>
        </div>
      </td>
    </tr>
  );
}
