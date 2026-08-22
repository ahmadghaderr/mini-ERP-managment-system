import { useEffect, useRef, useState } from "react";
import "./stock.css";
import type { StockMovement, StockMovementReason } from "../../types/stock";
import { fetchStockMovements } from "../../services/stock-service";

const TYPE_LABELS: Record<StockMovementReason, string> = {
  transfer_in: "TRANSFER IN",
  transfer_out: "TRANSFER OUT",
  invoice_delivered: "INVOICE DELIVERED",
  order_delivered: "ORDER DELIVERED",
  adjustment: "ADJUSTMENT",
};

const TYPE_BADGE: Record<StockMovementReason, string> = {
  transfer_in: "stk-badge--success",
  transfer_out: "stk-badge--info",
  invoice_delivered: "stk-badge--success",
  order_delivered: "stk-badge--info",
  adjustment: "stk-badge--warning",
};

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

const COLUMN_LABELS: Record<ColumnKey, string> = {
  id: "Ledger ID",
  referenceId: "Reference",
  createdAt: "Timestamp",
  product: "Product",
  warehouse: "Warehouse",
  quantityChange: "Qty Change",
  reason: "Type",
};

const COLUMN_ORDER: ColumnKey[] = [
  "id", "referenceId", "createdAt", "product", "warehouse", "quantityChange", "reason",
];

export default function Ledger() {
  const [entries, setEntries] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [colWidths, setColWidths] = useState<Record<ColumnKey, number>>(DEFAULT_WIDTHS);

  const resizingRef = useRef<{ key: ColumnKey; startX: number; startWidth: number } | null>(null);
  const [resizingKey, setResizingKey] = useState<ColumnKey | null>(null);

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
      const delta = e.clientX - startX;
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
        return <span style={{ fontSize: 13 }}>{new Date(entry.createdAt).toLocaleString()}</span>;
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
            {TYPE_LABELS[entry.reason]}
          </span>
        );
    }
  }

  if (loading) {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }

  return (
    <div className="stk-pg">
      <div className="stk-pg-head">
        <div>
          <div className="stk-pg-title">Ledger</div>
        </div>
      </div>

      <div className="stk-card">
        <div className="stk-card-header stk-ledger-header">
          <div className="stk-card-title">Stock Movement Audit</div>
          <div className="search-wrap stk-ledger-search">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="search-input"
              type="text"
              placeholder="Search audit log..."
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
                    {COLUMN_LABELS[key]}
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
                    No ledger records found.
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