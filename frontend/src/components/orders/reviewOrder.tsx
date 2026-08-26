import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import PageLoader from "../shared/PageLoader";
import { useNavigate, useParams } from "react-router-dom";
import "./orders.css";
import type { CustomerOrder } from "../../types/order";
import type { Product } from "../../types/product";
import {
  fetchCustomerOrder,
  matchCustomerOrderItem,
  updateCustomerOrderName,
  confirmCustomerOrder,
  deliverCustomerOrder,
  rejectCustomerOrder,
  deleteCustomerOrder,
} from "../../services/customerOrder-service";
import { fetchProducts } from "../../services/product-service";
import { getApiErrorMessage } from "../../lib/apiError";

export default function OrderReview() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    Promise.all([fetchCustomerOrder(id), fetchProducts()])
      .then(([ord, prods]) => {
        if (cancelled) return;
        setOrder(ord);
        setProducts(prods);
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(getApiErrorMessage(err));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const refreshFileUrl = () => {
      fetchCustomerOrder(id).then((ord) => {
        setOrder((prev) => (prev ? { ...prev, fileUrl: ord.fileUrl } : ord));
      });
    };

    const interval = setInterval(refreshFileUrl, 10 * 60 * 1000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshFileUrl();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", refreshFileUrl);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", refreshFileUrl);
    };
  }, [id]);

  const handleBack = () => navigate(-1);

  async function handleMatch(itemId: string, matchedProductId: string) {
    if (!order || !matchedProductId) return;
    setActionError(null);
    try {
      const updatedItem = await matchCustomerOrderItem(order.id, itemId, matchedProductId);
      setOrder({
        ...order,
        items: order.items.map((it) => (it.id === itemId ? updatedItem : it)),
      });
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    }
  }

  function startEditName() {
    if (!order) return;
    setNameDraft(order.extractedCustomerName ?? "");
    setEditingName(true);
  }

  function cancelEditName() {
    setEditingName(false);
  }

  async function handleSaveName() {
    if (!order) return;
    const trimmed = nameDraft.trim();
    if (!trimmed) return;

    setSavingName(true);
    setActionError(null);
    try {
      const updated = await updateCustomerOrderName(order.id, trimmed);
      setOrder(updated);
      setEditingName(false);
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    } finally {
      setSavingName(false);
    }
  }

  async function handleConfirm() {
    if (!order) return;
    setSaving(true);
    setActionError(null);
    try {
      await confirmCustomerOrder(order.id);
      navigate("/orders");
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeliver() {
    if (!order) return;
    setSaving(true);
    setActionError(null);
    try {
      await deliverCustomerOrder(order.id);
      navigate("/orders");
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleReject() {
    if (!order) return;
    if (!confirm(t("orders.rejectConfirmMsg"))) return;
    setSaving(true);
    setActionError(null);
    try {
      await rejectCustomerOrder(order.id);
      navigate("/orders");
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!order) return;
    if (!confirm(t("orders.deleteConfirmMsg")))
      return;
    setSaving(true);
    setActionError(null);
    try {
      await deleteCustomerOrder(order.id);
      navigate("/orders");
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <PageLoader />;
  }

  if (loadError) {
    return <div style={{ padding: 24, color: "crimson" }}>{loadError}</div>;
  }

  if (!order) {
    return <div style={{ padding: 24 }}>Order not found.</div>;
  }

  const isMatchable = order.status === "pending";
  const canConfirm = order.status === "pending";
  const canDeliver = order.status === "confirmed";
  const canReject = order.status === "pending" || order.status === "confirmed";
  const allMatched = order.items.every((it) => it.matchedProductId);

  const totalPrice = order.items.reduce(
    (sum, item) => sum + (Number(item.unitPrice) || 0) * item.quantity,
    0,
  );

  return (
    <div className="ord-pg">
      <div className="ord-pg-head">
        <div>
          <h1 className="ord-pg-title">Review order</h1>
          {editingName ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
              <input
                className="ord-input ord-input--sm"
                style={{ maxWidth: 240 }}
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                autoFocus
                disabled={savingName}
              />
              <button
                className="ord-btn ord-btn--primary"
                style={{ padding: "6px 14px", minHeight: 32 }}
                disabled={savingName || !nameDraft.trim()}
                onClick={handleSaveName}
              >
                Save
              </button>
              <button
                className="ord-btn ord-btn--ghost"
                style={{ padding: "6px 14px", minHeight: 32 }}
                disabled={savingName}
                onClick={cancelEditName}
              >
                Cancel
              </button>
            </div>
          ) : (
            <p
              className="ord-subtext"
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              {order.extractedCustomerName ?? "Unknown customer"}
              {isMatchable && (
                <button
                  onClick={startEditName}
                  aria-label="Edit customer name"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#3ab5cc",
                    fontWeight: 600,
                    fontSize: 12,
                    padding: 0,
                  }}
                >
                  Edit
                </button>
              )}
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button className="ord-btn ord-btn--ghost" onClick={handleBack}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            {t("common.back")}
          </button>
          <button
            className="ord-btn ord-btn--danger"
            disabled={saving || order.status === "delivered"}
            onClick={handleDelete}
            title={
              order.status === "delivered"
                ? "Delivered orders already reserved/decreased stock and can't be deleted"
                : undefined
            }
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
            {t("common.delete")}
          </button>
        </div>
      </div>

      {actionError && (
        <div className="ord-banner" style={{ borderColor: "crimson", color: "crimson" }}>
          {actionError}
        </div>
      )}

      <div className="ord-banner">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        {order.status === "pending" && t("orders.matchBeforeConfirm")}
        {order.status === "confirmed" && t("orders.confirmedReadyDeliver")}
        {order.status === "delivered" && t("orders.alreadyDelivered")}
        {order.status === "rejected" && t("orders.alreadyRejected")}
      </div>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 16 }}>
        <div
          className="ord-card ord-preview-card"
          style={{ flex: "1 1 450px", minHeight: "480px", padding: 0, overflow: "hidden" }}
        >
          {order.fileUrl ? (
            <iframe
              src={order.fileUrl}
              title="Order PDF Preview"
              style={{ width: "100%", height: "100%", minHeight: "480px", border: "none" }}
            />
          ) : (
            <div style={{ padding: 24, textAlign: "center" }}>
              {t("orders.uploadPlaceholder")}
            </div>
          )}
        </div>

        <div className="ord-card" style={{ flex: "1 1 380px", height: "fit-content" }}>
          <table className="ord-tbl">
            <thead>
              <tr>
                <th>{t("orders.colExtractedName")}</th>
                <th style={{ width: 70 }}>{t("orders.colQty")}</th>
                <th style={{ width: 90 }}>{t("orders.colUnitPrice")}</th>
                <th style={{ width: 180 }}>{t("orders.colMatchedProduct")}</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.extractedProductName}</td>
                  <td>{item.quantity}</td>
                  <td>
                    {item.unitPrice != null
                      ? `$${Number(item.unitPrice).toFixed(2)}`
                      : "—"}
                  </td>
                  <td>
                    <select
                      className="ord-input ord-input--sm"
                      value={item.matchedProductId ?? ""}
                      disabled={!isMatchable}
                      onChange={(e) => handleMatch(item.id, e.target.value)}
                    >
                      <option value="" disabled>
                        {t("orders.selectProduct")}
                      </option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.productName}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} className="ord-total-label">
                  {t("orders.total")}
                </td>
                <td colSpan={2} className="ord-total-value">
                  ${totalPrice.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        {canConfirm && (
          <button
            className="ord-btn ord-btn--primary"
            disabled={!allMatched || saving}
            onClick={handleConfirm}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {t("common.confirm")}
          </button>
        )}

        {canDeliver && (
          <button
            className="ord-btn ord-btn--primary"
            disabled={saving}
            onClick={handleDeliver}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {t("orders.deliverButton")}
          </button>
        )}

        {canReject && (
          <button
            className="ord-btn ord-btn--danger"
            disabled={saving}
            onClick={handleReject}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            {t("common.reject")}
          </button>
        )}
      </div>
    </div>
  );
} 