import { useEffect, useState } from "react";
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

export default function Ledger() {
  const [entries, setEntries] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchStockMovements()
      .then((data) => {
        if (!cancelled) setEntries(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load ledger.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredEntries = entries.filter(
    (e) =>
      (e.product?.productName ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (e.referenceId ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (e.warehouse?.warehouseName ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }

  if (error) {
    return <div style={{ padding: 24, color: "crimson" }}>{error}</div>;
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
          <div className="search-wrap stk-ledger-search" style={{ position: "relative" }}>
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
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  fontSize: 16,
                  lineHeight: 1,
                  padding: 4,
                  color: "#888",
                }}
              >
                &times;
              </button>
            )}
          </div>
        </div>

        <div className="stk-tbl-wrap">
          <table className="stk-tbl">
            <thead>
              <tr>
                <th>Ledger ID</th>
                <th>Reference</th>
                <th>Timestamp</th>
                <th>Product</th>
                <th>Warehouse</th>
                <th>Qty Change</th>
                <th>Type</th>
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
                    <td style={{ fontSize: 12, fontFamily: "monospace" }}>
                      {entry.id}
                    </td>
                    <td style={{ fontWeight: 600 }}>{entry.referenceId ?? "—"}</td>
                    <td style={{ fontSize: 13 }}>
                      {new Date(entry.createdAt).toLocaleString()}
                    </td>
                    <td>{entry.product?.productName ?? "—"}</td>
                    <td>{entry.warehouse?.warehouseName ?? "—"}</td>
                    <td style={{ fontWeight: 600 }}>
                      {entry.quantityChange > 0 ? "+" : ""}
                      {entry.quantityChange}
                    </td>
                    <td>
                      <span className={`stk-badge ${TYPE_BADGE[entry.reason]}`}>
                        {TYPE_LABELS[entry.reason]}
                      </span>
                    </td>
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