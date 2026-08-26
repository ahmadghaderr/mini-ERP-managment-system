import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import PageLoader from "../shared/PageLoader";
import { formatLocalDate } from "../../lib/formatDate";
import {
  fetchAccessRequests,
  approveAccessRequest,
  rejectAccessRequest,
} from "../../services/accessRequests-service";
import type { AccessRequest } from "../../types/accessRequests";
import "./access-requests.css";
import i18n from "../../i18n/config";

const ROLES = ["admin", "manager", "staff"];

export default function PendingRequests() {
  const { t } = useTranslation();
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
      setActionError(t("accessRequests.enterNameError"));
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
    if (!confirm(t("accessRequests.rejectConfirm"))) return;
    await rejectAccessRequest(id);
    loadRequests();
  }

  const pending = requests.filter((r) => r.status === "pending");
  const reviewed = requests.filter((r) => r.status !== "pending");

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="pg">
      <div className="pg-head">
        <div>
          <div className="pg-title">{t("accessRequests.pendingTitle")}</div>
          <p className="pg-subtitle">
            {t("accessRequests.pendingSubtitle")}
          </p>
        </div>
      </div>

      <div className="acr-card acr-list-card">
        <div className="acr-card-header">
          <div className="acr-card-title">{t("accessRequests.pendingCount")} ({pending.length})</div>
        </div>
        <table className="acr-tbl">
          <thead>
            <tr>
              <th>{t("accessRequests.colEmail")}</th>
              <th>{t("accessRequests.colRequested")}</th>
              <th style={{ width: 220 }}></th>
            </tr>
          </thead>
          <tbody>
            {pending.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ textAlign: "center", padding: 24 }}>
                  {t("accessRequests.noPending")}
                </td>
              </tr>
            ) : (
              pending.map((r) => (
                <>
                  <tr key={r.id}>
                    <td>{r.email}</td>
                    <td>{formatLocalDate(r.requestedAt, i18n.language)}</td>
                    <td>
                      {approvingId === r.id ? (
                        <button
                          className="acr-link-btn"
                          onClick={() => setApprovingId(null)}
                        >
                          {t("accessRequests.cancel")}
                        </button>
                      ) : (
                        <div className="acr-row-actions">
                          <button
                            className="acr-btn acr-btn--primary acr-btn-sm"
                            onClick={() => openApprove(r.id)}
                          >
                            {t("accessRequests.approve")}
                          </button>
                          <button
                            className="acr-btn acr-btn--danger acr-btn-sm"
                            onClick={() => handleReject(r.id)}
                          >
                            {t("accessRequests.reject")}
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
                            <label className="acr-label">{t("accessRequests.fieldFullName")}</label>
                            <input
                              className="acr-input"
                              value={userName}
                              onChange={(e) => setUserName(e.target.value)}
                              placeholder={t("accessRequests.fieldFullNamePlaceholder")}
                            />
                          </div>
                          <div className="acr-field">
                            <label className="acr-label">{t("accessRequests.fieldRole")}</label>
                            <select
                              className="acr-select"
                              value={role}
                              onChange={(e) => setRole(e.target.value)}
                            >
                              {ROLES.map((roleOption) => (
                                <option key={roleOption} value={roleOption}>
                                  {t(`accessRequests.roles.${roleOption}`)}
                                </option>
                              ))}
                            </select>
                          </div>
                          <button
                            className="acr-btn acr-btn--primary acr-btn-sm"
                            onClick={() => submitApprove(r.id)}
                          >
                            {t("accessRequests.confirmApproval")}
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
            <div className="acr-card-title">{t("accessRequests.reviewedTitle")}</div>
          </div>
          <table className="acr-tbl">
            <thead>
              <tr>
                <th>{t("accessRequests.colEmail")}</th>
                <th>{t("accessRequests.colStatus")}</th>
                <th>{t("accessRequests.colReviewed")}</th>
              </tr>
            </thead>
            <tbody>
              {reviewed.map((r) => (
                <tr key={r.id}>
                  <td>{r.email}</td>
                  <td>
                    <span className={`acr-badge acr-badge--${r.status}`}>
                      {t(`accessRequests.status.${r.status}`)}
                    </span>
                  </td>
                  <td>
                    {r.reviewedAt
                      ? formatLocalDate(r.reviewedAt, i18n.language)
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