import { useState, useEffect } from "react";
import {
  fetchAccessRequests,
  approveAccessRequest,
  rejectAccessRequest,
} from "../../services/accessRequests-service";
import type { AccessRequest } from "../../types/accessRequests";
import "./access-requests.css";

const ROLES = ["admin", "manager", "staff"];

export default function PendingRequests() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [role, setRole] = useState("staff");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);
    try {
      const data = await fetchAccessRequests();
      setRequests(data);
    } finally {
      setLoading(false);
    }
  }

  function openApprove(id: string) {
    setApprovingId(id);
    setUserName("");
    setRole("staff");
    setActionError("");
  }

  async function submitApprove(id: string) {
    if (!userName.trim()) {
      setActionError("Please enter a name.");
      return;
    }
    setActionError("");
    try {
      await approveAccessRequest(id, { userName, role });
      setApprovingId(null);
      loadRequests();
    } catch (err) {
      setActionError((err as Error).message);
    }
  }

  async function handleReject(id: string) {
    if (!confirm("Reject this access request?")) return;
    await rejectAccessRequest(id);
    loadRequests();
  }

  const pending = requests.filter((r) => r.status === "pending");
  const reviewed = requests.filter((r) => r.status !== "pending");

  if (loading) {
    return <div className="acr-page-content">Loading...</div>;
  }

  return (
    <div className="pg">
      <div className="pg-head">
        <div>
          <div className="pg-title">Pending Requests</div>
          <p className="pg-subtitle">
            Review and approve new account requests.
          </p>
        </div>
      </div>

      <div className="acr-card acr-list-card">
        <div className="acr-card-header">
          <div className="acr-card-title">Pending ({pending.length})</div>
        </div>
        <table className="acr-tbl">
          <thead>
            <tr>
              <th>Email</th>
              <th>Requested</th>
              <th style={{ width: 220 }}></th>
            </tr>
          </thead>
          <tbody>
            {pending.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ textAlign: "center", padding: 24 }}>
                  No pending requests.
                </td>
              </tr>
            ) : (
              pending.map((r) => (
                <>
                  <tr key={r.id}>
                    <td>{r.email}</td>
                    <td>{new Date(r.requestedAt).toLocaleDateString()}</td>
                    <td>
                      {approvingId === r.id ? (
                        <button
                          className="acr-link-btn"
                          onClick={() => setApprovingId(null)}
                        >
                          Cancel
                        </button>
                      ) : (
                        <div className="acr-row-actions">
                          <button
                            className="acr-btn acr-btn--primary acr-btn-sm"
                            onClick={() => openApprove(r.id)}
                          >
                            Approve
                          </button>
                          <button
                            className="acr-btn acr-btn--danger acr-btn-sm"
                            onClick={() => handleReject(r.id)}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                  {approvingId === r.id && (
                    <tr>
                      <td colSpan={3}>
                        <div className="acr-approve-panel">
                          {actionError && (
                            <div className="acr-error">{actionError}</div>
                          )}
                          <div className="acr-field">
                            <label className="acr-label">Full Name</label>
                            <input
                              className="acr-input"
                              value={userName}
                              onChange={(e) => setUserName(e.target.value)}
                              placeholder="e.g. Mohamad Farhat"
                            />
                          </div>
                          <div className="acr-field">
                            <label className="acr-label">Role</label>
                            <select
                              className="acr-select"
                              value={role}
                              onChange={(e) => setRole(e.target.value)}
                            >
                              {ROLES.map((roleOption) => (
                                <option key={roleOption} value={roleOption}>
                                  {roleOption}
                                </option>
                              ))}
                            </select>
                          </div>
                          <button
                            className="acr-btn acr-btn--primary acr-btn-sm"
                            onClick={() => submitApprove(r.id)}
                          >
                            Confirm Approval
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>

      {reviewed.length > 0 && (
        <div className="acr-card" style={{ marginTop: 24 }}>
          <div className="acr-card-header">
            <div className="acr-card-title">Reviewed</div>
          </div>
          <table className="acr-tbl">
            <thead>
              <tr>
                <th>Email</th>
                <th>Status</th>
                <th>Reviewed</th>
              </tr>
            </thead>
            <tbody>
              {reviewed.map((r) => (
                <tr key={r.id}>
                  <td>{r.email}</td>
                  <td>
                    <span className={`acr-badge acr-badge--${r.status}`}>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    {r.reviewedAt
                      ? new Date(r.reviewedAt).toLocaleDateString()
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
