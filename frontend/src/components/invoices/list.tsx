import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import PageLoader from "../shared/PageLoader";
import { useNavigate } from "react-router-dom";
import "./invoices.css";
import type { SupplierInvoice, SupplierInvoiceStatus } from "../../types/supplierInvoice";
import { fetchSupplierInvoices } from "../../services/invoice-service";


const STATUSES: (SupplierInvoiceStatus | "all")[] = [
  "all",
  "pending_extraction",
  "extracted",
  "confirmed",
  "delivered",
  "rejected",
];

export default function List() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<SupplierInvoiceStatus | "all">("all");

  useEffect(() => {
    let cancelled = false;
    fetchSupplierInvoices()
      .then((data) => {
        if (!cancelled) setInvoices(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleUpload = () => navigate("/invoices/upload");
  const handleReview = (id: string) => navigate(`/invoices/review/${id}`);

  const rows = invoices.filter(
    (inv) =>
      (status === "all" || inv.status === status) &&
      (inv.extractedSupplierName ?? "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="inv-pg">
      <div className="inv-pg-head">
        <div>
          <h1 className="inv-pg-title">{t("invoices.title")}</h1>
        </div>
        <button className="inv-btn inv-btn--primary" onClick={handleUpload}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          {t("invoices.uploadButton")}
        </button>
      </div>

      <div className="pg-toolbar">
        <div className="search-wrap">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("invoices.searchPlaceholder")}
          />
        </div>
        <select
          className="filter-select"
          value={status}
          onChange={(e) =>
            setStatus(e.target.value as SupplierInvoiceStatus | "all")
          }
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? t("invoices.allStatuses") : t(`invoices.statuses.${s}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="inv-card">
        <table className="inv-tbl">
          <thead>
            <tr>
              <th>{t("invoices.colSupplier")}</th>
              <th>{t("invoices.colInvoiceDate")}</th>
              <th>{t("invoices.colDeliveryDate")}</th>
              <th>{t("invoices.colWarehouse")}</th>
              <th>{t("invoices.colStatus")}</th>
              <th style={{ width: 90 }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 24 }}>
                  {t("invoices.noInvoicesFound")}
                </td>
              </tr>
            ) : (
              rows.map((inv) => (
                <tr key={inv.id}>
                  <td>{inv.extractedSupplierName ?? "—"}</td>
                  <td>{inv.invoiceDateExtracted ?? "—"}</td>
                  <td>{inv.extractedDeliveryDate ?? "—"}</td>
                  <td>{inv.warehouse?.warehouseName ?? "—"}</td>
                  <td>
                    <span
                      className={`inv-badge inv-badge--${inv.status.replaceAll(
                        "_",
                        "-"
                      )}`}
                    >
                      {t(`invoices.statuses.${inv.status}`)}
                    </span>
                  </td>
                  <td>
                    <button
                      className="inv-btn inv-btn--ghost"
                      onClick={() => handleReview(inv.id)}
                    >
                      {t("invoices.reviewButton")}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}