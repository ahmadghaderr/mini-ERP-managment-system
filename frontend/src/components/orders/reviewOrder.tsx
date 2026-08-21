import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./orders.css";
import type { CustomerOrder } from "../../types/order";
import type { Product } from "../../types/product";
import {
  fetchCustomerOrder,
  matchCustomerOrderItem,
  confirmCustomerOrder,
  deliverCustomerOrder,
  rejectCustomerOrder,
  deleteCustomerOrder,
} from "../../services/customerOrder-service";
import { fetchProducts } from "../../services/product-service";
import { getApiErrorMessage } from "../../lib/apiError";

export default function OrderReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
    if (!confirm("Are you sure you want to reject this order?")) return;
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
    if (
      !confirm(
        "Are you sure you want to delete this order? This action cannot be undone.",
      )
    )
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
    return <div style={{ padding: 24 }}>Loading...</div>;
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
          <p className="ord-subtext">
            {order.extractedCustomerName ?? "Unknown customer"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button className="ord-btn ord-btn--ghost" onClick={handleBack}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back
          </button>
          <button
            className="ord-btn ord-btn--danger"
            disabled={saving}
            onClick={handleDelete}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
            Delete
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
        {order.status === "pending" && "Match each item to a product before confirming."}
        {order.status === "confirmed" && "Order confirmed — stock reserved. Ready to deliver."}
        {order.status === "delivered" && "This order has already been delivered."}
        {order.status === "rejected" && "This order has been rejected."}
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
              No PDF preview available.
            </div>
          )}
        </div>

        <div className="ord-card" style={{ flex: "1 1 380px", height: "fit-content" }}>
          <table className="ord-tbl">
            <thead>
              <tr>
                <th>Extracted name</th>
                <th style={{ width: 70 }}>Qty</th>
                <th style={{ width: 90 }}>Unit price</th>
                <th style={{ width: 180 }}>Matched product</th>
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
                        Select product
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
          </table>

          <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px 0", fontWeight: 600 }}>
            Total: ${totalPrice.toFixed(2)}
          </div>
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
            Confirm
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
            Deliver
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
            Reject
          </button>
        )}
      </div>
    </div>
  );
}