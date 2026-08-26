import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import PageLoader from "../shared/PageLoader";
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
  deliverSupplierInvoice,
  deleteSupplierInvoice,
} from "../../services/invoice-service";
import { fetchProducts } from "../../services/product-service";
import { decodeToken } from "../../lib/cognito";
import { hasPermission } from "../permissions/permissions";
import type { Role } from "../permissions/permissions";
import { getApiErrorMessage } from "../../lib/apiError";

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

function findBestProductMatch(
  extractedName: string,
  products: Product[],
): Product | undefined {
  const normalizedExtracted = normalize(extractedName);
  if (!normalizedExtracted) return undefined;

  const exact = products.find(
    (p) => normalize(p.productName) === normalizedExtracted,
  );
  if (exact) return exact;

  const partial = products.find(
    (p) =>
      normalize(p.productName).includes(normalizedExtracted) ||
      normalizedExtracted.includes(normalize(p.productName)),
  );
  return partial;
}

export default function Review() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState<SupplierInvoice | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [autoMatching, setAutoMatching] = useState(false);
  const [confirming, setConfirming] = useState(false);

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
        autoMatchItems(inv, prods);
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
    const interval = setInterval(() => {
      fetchSupplierInvoice(id).then((inv) => {
        setInvoice((prev) => (prev ? { ...prev, fileUrl: inv.fileUrl } : inv));
      });
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [id]);

  async function autoMatchItems(inv: SupplierInvoice, productList: Product[]) {
    if (productList.length === 0) return;
    const unmatched = inv.items.filter((it) => !it.matchedProductId);
    if (unmatched.length === 0) return;

    setAutoMatching(true);
    let current = inv.items;
    for (const item of unmatched) {
      const match = findBestProductMatch(item.extractedProductName, productList);
      if (!match) continue;
      try {
        await matchSupplierInvoiceItem(inv.id, item.id, match.id);
        current = current.map((it) =>
          it.id === item.id ? { ...it, matchedProductId: match.id } : it,
        );
        setInvoice((prev) => (prev ? { ...prev, items: current } : prev));
      } catch {
        // leave unmatched, user can pick manually
      }
    }
    setAutoMatching(false);
  }

  const handleBack = () => navigate(-1);

  async function handleMatch(
    item: SupplierInvoiceItem,
    matchedProductId: string,
  ) {
    if (!invoice || !matchedProductId) return;
    setActionError(null);
    try {
      await matchSupplierInvoiceItem(invoice.id, item.id, matchedProductId);
      setInvoice({
        ...invoice,
        items: invoice.items.map((it) =>
          it.id === item.id ? { ...it, matchedProductId } : it,
        ),
      });
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    }
  }

  async function handleConfirm() {
    if (!invoice) return;
    setSaving(true);
    setConfirming(true);
    setActionError(null);
    try {
      const result = await confirmSupplierInvoice(invoice.id);
      if (result.calendarEvent.success) {
        alert(
          `${t("invoices.calendarSuccess")}\n\n${result.calendarEvent.message}`,
        );
      } else {
        alert(
          `${t("invoices.calendarFailure")}\n\n${result.calendarEvent.message}`,
        );
      }
      navigate("/invoices");
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
      setConfirming(false);
    }
  }

  async function handleReject() {
    if (!invoice) return;
    if (!confirm(t("invoices.rejectConfirmMsg"))) return;
    setSaving(true);
    setActionError(null);
    try {
      await rejectSupplierInvoice(invoice.id);
      navigate("/invoices");
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeliver() {
    if (!invoice) return;
    setSaving(true);
    setActionError(null);
    try {
      await deliverSupplierInvoice(invoice.id);
      navigate("/invoices");
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!invoice) return;
    if (!confirm(t("invoices.deleteConfirmMsg")))
      return;

    setSaving(true);
    setActionError(null);
    try {
      await deleteSupplierInvoice(invoice.id);
      navigate("/invoices");
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

  if (!invoice) {
    return <div style={{ padding: 24 }}>Invoice not found.</div>;
  }

  const isReviewable =
    invoice.status === "pending_extraction" || invoice.status === "extracted";
  const isConfirmed = invoice.status === "confirmed";

  return (
    <div className="inv-pg">
      <div className="inv-pg-head">
        <div>
          <h1 className="inv-pg-title">{t("invoices.reviewTitle")}</h1>
          <p className="inv-pg-subtitle">
            {invoice.extractedSupplierName ?? t("invoices.unknownSupplier")}
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
            {t("common.back")}
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
              {t("common.delete")}
            </button>
          )}
        </div>
      </div>

      {actionError && (
        <div className="inv-banner" style={{ borderColor: "crimson", color: "crimson" }}>
          {actionError}
        </div>
      )}

      {isReviewable && (
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
          {autoMatching
            ? t("invoices.autoMatching")
            : confirming
              ? t("invoices.confirmingMessage")
              : t("invoices.reviewInstructions")}
        </div>
      )}

      {isConfirmed && (
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
          {t("invoices.confirmedMessage")}
        </div>
      )}

      {!isReviewable && !isConfirmed && (
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
          {t("invoices.alreadyStatus")} {t(`invoices.statuses.${invoice.status}`)}.
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
              {t("invoices.noPdfPreview")}
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
                <th>{t("invoices.colExtractedProduct")}</th>
                <th>{t("invoices.colQty")}</th>
                <th>{t("invoices.colUnitPrice")}</th>
                <th>{t("invoices.colMatchedProduct")}</th>
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
                          {t("invoices.selectProduct")}
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
            disabled={saving || autoMatching}
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
            {confirming ? t("invoices.confirming") : t("common.confirm")}
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
            {t("common.reject")}
          </button>
        </div>
      )}

      {isConfirmed && canApprove && (
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button
            className="inv-btn inv-btn--primary"
            disabled={saving}
            onClick={handleDeliver}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {t("invoices.deliverButton")}
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
            {t("common.reject")}
          </button>
        </div>
      )}

      {isReviewable && !canApprove && (
        <p className="inv-subtext" style={{ marginTop: 20 }}>
          {t("invoices.matchThenManager")}
        </p>
      )}
    </div>
  );
}