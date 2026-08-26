import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import PageLoader from "../shared/PageLoader";
import "./stock.css";
import type { StockMovement, StockMovementReason } from "../../types/stock";
import { fetchStockMovements } from "../../services/stock-service";
import { formatLocalDateTime } from "../../lib/formatDate";
import i18n from "../../i18n/config";

type ColumnKey = "id" | "referenceId" | "createdAt" | "product" | "warehouse" | "quantityChange" | "reason";

const DEFAULT_WIDTHS: Record<ColumnKey, number> = {
  id: 140,
  referenceId: 140,
  createdAt: 160,
  product: 160,
  warehouse: 140,
  quantityChange: 110,
  reason: 160,
};

const MIN_COLUMN_WIDTH = 60;

const COLUMN_ORDER: ColumnKey[] = [
  "id", "referenceId", "createdAt", "product", "warehouse", "quantityChange", "reason",
];

const TYPE_KEY_MAP: Record<StockMovementReason, string> = {
  transfer_in: "ledger.types.transferIn",
  transfer_out: "ledger.types.transferOut",
  invoice_delivered: "ledger.types.invoiceDelivered",
  order_delivered: "ledger.types.orderDelivered",
  adjustment: "ledger.types.adjustment",
};

const TYPE_BADGE: Record<StockMovementReason, string> = {
  transfer_in: "stk-badge--success",
  transfer_out: "stk-badge--info",
  invoice_delivered: "stk-badge--success",
  order_delivered: "stk-badge--info",
  adjustment: "stk-badge--warning",
};

export default function Ledger() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [colWidths, setColWidths] = useState<Record<ColumnKey, number>>(DEFAULT_WIDTHS);

  const resizingRef = useRef<{ key: ColumnKey; startX: number; startWidth: number } | null>(null);
  const [resizingKey, setResizingKey] = useState<ColumnKey | null>(null);

  const COLUMN_LABEL_KEYS: Record<ColumnKey, string> = {
    id: "ledger.colLedgerId",
    referenceId: "ledger.colReference",
    createdAt: "ledger.colTimestamp",
    product: "ledger.colProduct",
    warehouse: "ledger.colWarehouse",
    quantityChange: "ledger.colQtyChange",
    reason: "ledger.colType",
  };

  useEffect(() => {
    let cancelled = false;
    fetchStockMovements()
      .then((data) => {
        if (!cancelled) setEntries(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!resizingRef.current) return;
      const { key, startX, startWidth } = resizingRef.current;
      const isRtl = document.documentElement.dir === "rtl";
      const rawDelta = e.clientX - startX;
      const delta = isRtl ? -rawDelta : rawDelta;
      const newWidth = Math.max(MIN_COLUMN_WIDTH, startWidth + delta);
      setColWidths((prev) => ({ ...prev, [key]: newWidth }));
    }

    function handleMouseUp() {
      resizingRef.current = null;
      setResizingKey(null);
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  function startResize(key: ColumnKey, e: React.MouseEvent) {
    e.preventDefault();
    resizingRef.current = { key, startX: e.clientX, startWidth: colWidths[key] };
    setResizingKey(key);
  }

  const filteredEntries = entries.filter(
    (e) =>
      (e.product?.productName ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (e.referenceId ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (e.warehouse?.warehouseName ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  function renderCell(entry: StockMovement, key: ColumnKey) {
    switch (key) {
      case "id":
        return <span style={{ fontSize: 12, fontFamily: "monospace" }}>{entry.id}</span>;
      case "referenceId":
        return <span style={{ fontWeight: 600 }}>{entry.referenceId ?? "—"}</span>;
      case "createdAt":
        return <span style={{ fontSize: 13 }}>{formatLocalDateTime(entry.createdAt, i18n.language)}</span>;
      case "product":
        return entry.product?.productName ?? "—";
      case "warehouse":
        return entry.warehouse?.warehouseName ?? "—";
      case "quantityChange":
        return (
          <span style={{ fontWeight: 600 }}>
            {entry.quantityChange > 0 ? "+" : ""}
            {entry.quantityChange}
          </span>
        );
      case "reason":
        return (
          <span className={`stk-badge ${TYPE_BADGE[entry.reason]}`}>
            {t(TYPE_KEY_MAP[entry.reason])}
          </span>
        );
    }
  }

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="stk-pg">
      <div className="stk-pg-head">
        <div>
          <div className="stk-pg-title">{t("ledger.title")}</div>
        </div>
      </div>

      <div className="stk-card">
        <div className="stk-card-header stk-ledger-header">
          <div className="stk-card-title">{t("ledger.cardTitle")}</div>
          <div className="search-wrap stk-ledger-search">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="search-input"
              type="text"
              placeholder={t("ledger.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="stk-tbl-wrap">
          <table className="stk-tbl stk-tbl--excel">
            <colgroup>
              {COLUMN_ORDER.map((key) => (
                <col key={key} style={{ width: colWidths[key] }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                {COLUMN_ORDER.map((key) => (
                  <th key={key}>
                    {t(COLUMN_LABEL_KEYS[key])}
                    <div
                      className={`stk-col-resize-handle ${resizingKey === key ? "is-resizing" : ""}`}
                      onMouseDown={(e) => startResize(key, e)}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 24 }}>
                    {t("ledger.noRecordsFound")}
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr key={entry.id}>
                    {COLUMN_ORDER.map((key) => (
                      <td key={key}>{renderCell(entry, key)}</td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}