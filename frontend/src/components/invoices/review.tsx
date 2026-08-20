import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./invoices.css";
import type {
  SupplierInvoice,
  SupplierInvoiceItem,
} from "../../types/supplierInvoice";
import type { Product } from "../../types/product";
import {
  fetchSupplierInvoice,
  matchSupplierInvoiceItem,
  confirmSupplierInvoice,
  rejectSupplierInvoice,
  deleteSupplierInvoice,
} from "../../services/invoice-service";
import { fetchProducts } from "../../services/product-service";
import { decodeToken } from "../../lib/cognito";
import { hasPermission } from "../permissions/permissions";
import type { Role } from "../permissions/permissions";

export default function Review() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState<SupplierInvoice | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const idToken = localStorage.getItem("idToken");
  const tokenPayload = idToken ? decodeToken(idToken) : null;
  const groups = (tokenPayload?.["cognito:groups"] as string[]) ?? [];
  const role = (groups[0] ?? "staff") as Role;
  const canApprove = hasPermission(role, "invoices:approve");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    Promise.all([fetchSupplierInvoice(id), fetchProducts()])
      .then(([inv, prods]) => {
        if (cancelled) return;
        setInvoice(inv);
        setProducts(prods);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleBack = () => navigate(-1);

  async function handleMatch(
    item: SupplierInvoiceItem,
    matchedProductId: string,
  ) {
    if (!invoice || !matchedProductId) return;
    await matchSupplierInvoiceItem(invoice.id, item.id, matchedProductId);
    setInvoice({
      ...invoice,
      items: invoice.items.map((it) =>
        it.id === item.id ? { ...it, matchedProductId } : it,
      ),
    });
  }

  async function handleConfirm() {
    if (!invoice) return;
    setSaving(true);
    try {
      await confirmSupplierInvoice(invoice.id);
      navigate("/invoices");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not confirm invoice.");
    } finally {
      setSaving(false);
    }
  }

  async function handleReject() {
    if (!invoice) return;
    if (!confirm("Are you sure you want to reject this invoice?")) return;
    setSaving(true);
    try {
      await rejectSupplierInvoice(invoice.id);
      navigate("/invoices");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not reject invoice.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!invoice) return;
    if (
      !confirm(
        "Are you sure you want to delete this invoice? This action cannot be undone.",
      )
    )
      return;

    setSaving(true);
    try {
      await deleteSupplierInvoice(invoice.id);
      navigate("/invoices");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not delete invoice.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }

  if (!invoice) {
    return <div style={{ padding: 24 }}>Invoice not found.</div>;
  }

  const isReviewable =
    invoice.status === "pending_extraction" || invoice.status === "extracted";

  return (
    <div className="inv-pg">
      <div className="inv-pg-head">
        <div>
          <h1 className="inv-pg-title">Review invoice</h1>
          <p className="inv-pg-subtitle">
            {invoice.extractedSupplierName ?? "Unknown supplier"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button className="inv-btn inv-btn--ghost" onClick={handleBack}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back
          </button>
          {canApprove && (
            <button
              className="inv-btn inv-btn--danger"
              disabled={saving}
              onClick={handleDelete}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
              Delete
            </button>
          )}
        </div>
      </div>

      {isReviewable ? (
        <div className="inv-banner">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          Match each line item to a product before confirming. Confirming
          accepts the extracted data only — stock is added later, when the
          shipment arrives (delivered).
        </div>
      ) : (
        <div className="inv-banner">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          This invoice has already been {invoice.status.replaceAll("_", " ")}.
        </div>
      )}

      <div
        style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 16 }}
      >
        <div
          className="inv-preview"
          style={{
            flex: "1 1 450px",
            minHeight: "480px",
            padding: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {invoice.fileUrl ? (
            <iframe
              src={invoice.fileUrl}
              title="Invoice PDF Preview"
              style={{
                width: "100%",
                height: "100%",
                minHeight: "480px",
                border: "none",
              }}
            />
          ) : (
            <div style={{ padding: 24, textAlign: "center" }}>
              No PDF preview available.
            </div>
          )}
        </div>

        <div
          className="inv-card"
          style={{ flex: "1 1 380px", height: "fit-content" }}
        >
          <table className="inv-tbl">
            <thead>
              <tr>
                <th>Extracted product</th>
                <th>Qty</th>
                <th>Unit price</th>
                <th>Matched product</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((it) => {
                const unitPriceNum =
                  it.unitPrice != null ? Number(it.unitPrice) : null;
                return (
                  <tr key={it.id}>
                    <td>{it.extractedProductName}</td>
                    <td>{it.quantity}</td>
                    <td>
                      {unitPriceNum != null && !Number.isNaN(unitPriceNum)
                        ? `$${unitPriceNum.toFixed(2)}`
                        : "—"}
                    </td>
                    <td>
                      <select
                        className="inv-select"
                        style={{ width: 180 }}
                        value={it.matchedProductId ?? ""}
                        disabled={!isReviewable}
                        onChange={(e) => handleMatch(it, e.target.value)}
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isReviewable && canApprove && (
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button
            className="inv-btn inv-btn--primary"
            disabled={saving}
            onClick={handleConfirm}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Confirm
          </button>
          <button
            className="inv-btn inv-btn--danger"
            disabled={saving}
            onClick={handleReject}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Reject
          </button>
        </div>
      )}

      {isReviewable && !canApprove && (
        <p className="inv-subtext" style={{ marginTop: 20 }}>
          Match each item to a product, then a manager can confirm or reject
          this invoice.
        </p>
      )}
    </div>
  );
}