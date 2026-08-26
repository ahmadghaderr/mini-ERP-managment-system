import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import PageLoader from "../shared/PageLoader";
import "./orders.css";
import type { CustomerOrder, CustomerOrderStatus } from "../../types/order";
import { fetchCustomerOrders } from "../../services/customerOrder-service";
import { formatLocalDate } from "../../lib/formatDate";
import i18n from "../../i18n/config";

const STATUSES: (CustomerOrderStatus | "all")[] = [
  "all",
  "pending",
  "confirmed",
  "delivered",
  "rejected",
];

interface ListProps {
  onUploadClick?: () => void;
}

export default function List({ onUploadClick }: ListProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CustomerOrderStatus | "all">("all");

  useEffect(() => {
    let cancelled = false;
    fetchCustomerOrders()
      .then((data) => {
        if (!cancelled) setOrders(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load orders.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleUpload = onUploadClick ?? (() => navigate("/orders/upload"));

  const rows = orders.filter(
    (order) =>
      (status === "all" || order.status === status) &&
      (order.extractedCustomerName ?? "")
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    return <div style={{ padding: 24, color: "crimson" }}>{error}</div>;
  }

  return (
    <div className="ord-pg">
      <div className="ord-pg-head">
        <div>
          <h1 className="ord-pg-title">{t("orders.title")}</h1>
        </div>
        <button className="ord-btn ord-btn--primary" onClick={handleUpload}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          {t("orders.uploadButton")}
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
            placeholder={t("orders.searchPlaceholder")}
          />
        </div>
        <select
          className="filter-select"
          value={status}
          onChange={(e) => setStatus(e.target.value as CustomerOrderStatus | "all")}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? t("orders.allStatuses") : t(`orders.statuses.${s}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="ord-card">
        <table className="ord-tbl">
          <thead>
            <tr>
              <th>{t("orders.colCustomer")}</th>
              <th>{t("orders.colUploaded")}</th>
              <th>{t("orders.colDelivered")}</th>
              <th>{t("orders.colWarehouse")}</th>
              <th>{t("orders.colStatus")}</th>
              <th style={{ width: 90 }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 24 }}>
                  {t("orders.noOrdersFound")}
                </td>
              </tr>
            ) : (
              rows.map((order) => (
                <tr key={order.id}>
                  <td>{order.extractedCustomerName ?? t("orders.unknownCustomer")}</td>
                  <td>{formatLocalDate(order.uploadedAt, i18n.language)}</td>
                  <td>
                    {order.deliveredAt
                      ? formatLocalDate(order.deliveredAt, i18n.language)
                      : "—"}
                  </td>
                  <td>{order.warehouse?.warehouseName ?? "—"}</td>
                  <td>
                    <span className={`ord-badge ord-badge--${order.status}`}>
                      {t(`orders.statuses.${order.status}`)}
                    </span>
                  </td>
                  <td>
                    <button
                      className="ord-btn ord-btn--ghost"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      {t("orders.reviewButton")}
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