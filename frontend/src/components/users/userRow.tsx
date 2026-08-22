import type { UserRowProps } from "../../types/user";

export default function UserRow({ user, onEdit, onDelete }: UserRowProps) {
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
        <span className="usr-badge usr-badge--role">{user.role}</span>
      </td>
      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
      <td>
        <div className="usr-row-actions">
          <button className="usr-btn usr-btn--ghost usr-btn-sm" onClick={() => onEdit(user)}>
            Edit
          </button>
          <button className="usr-btn usr-btn--danger usr-btn-sm" onClick={() => onDelete(user.id)}>
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
