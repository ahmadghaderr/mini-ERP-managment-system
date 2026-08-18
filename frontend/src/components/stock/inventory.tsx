import { useMemo, useState } from "react";
import "./stock.css";
import { mockLedgerEntries } from "./ledger";
import { rowKey, computeStockLevels } from "./stock-utils";
import type { LedgerEntry, StockLevel } from "../../types/stock";

const WAREHOUSE_NAMES = ["Main Warehouse", "North Branch", "South Hub"];

const PREVIEW_COUNT = 3;

interface StockTableProps {
  rows: StockLevel[];
  emptyMessage: string;
  emptyPadding: number;
}

function StockTable({ rows, emptyMessage, emptyPadding }: StockTableProps) {
  return (
    <table className="stk-tbl">
      <thead>
        <tr>
          <th>Product</th>
          <th style={{ width: 90 }}>Qty</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={2} style={{ textAlign: "center", padding: emptyPadding }}>
              {emptyMessage}
            </td>
          </tr>
        ) : (
          rows.map((row) => (
            <tr key={rowKey(row.productName, row.warehouseName)}>
              <td>{row.productName}</td>
              <td style={{ fontWeight: 600 }}>{row.quantity}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

export default function Inventory() {
  const [entries] = useState<LedgerEntry[]>(mockLedgerEntries);
  const [search, setSearch] = useState("");
  const [activeWarehouse, setActiveWarehouse] = useState<string | null>(null);

  const stockLevels = useMemo(() => computeStockLevels(entries), [entries]);

  const rowsByWarehouse = useMemo(() => {
    const map = new Map<string, StockLevel[]>();
    WAREHOUSE_NAMES.forEach((w) => map.set(w, []));

    stockLevels
      .filter((r) => r.productName.toLowerCase().includes(search.toLowerCase()))
      .forEach((r) => {
        if (!map.has(r.warehouseName)) map.set(r.warehouseName, []);
        map.get(r.warehouseName)!.push(r);
      });

    map.forEach((rows) =>
      rows.sort((a, b) => a.productName.localeCompare(b.productName)),
    );

    return map;
  }, [stockLevels, search]);

  function closeModal() {
    setActiveWarehouse(null);
  }

  const activeRows = activeWarehouse ? (rowsByWarehouse.get(activeWarehouse) ?? []) : [];

  return (
    <div className="stk-pg">
      <div className="stk-pg-head">
        <div>
          <div className="stk-pg-title">Inventory</div>
        </div>
      </div>

      <div className="stk-toolbar">
        <div className="search-wrap">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name"
          />
        </div>
      </div>

      <div className="stk-warehouse-grid">
        {WAREHOUSE_NAMES.map((warehouse) => {
          const rows = rowsByWarehouse.get(warehouse) ?? [];
          const preview = rows.slice(0, PREVIEW_COUNT);
          return (
            <div className="stk-card" key={warehouse}>
              <div className="stk-card-header">
                <div className="stk-card-title">{warehouse}</div>
                <button className="stk-link-btn" onClick={() => setActiveWarehouse(warehouse)}>
                  View all ({rows.length})
                </button>
              </div>
              <StockTable rows={preview} emptyMessage="No stock records." emptyPadding={20} />
            </div>
          );
        })}
      </div>

      {activeWarehouse && (
        <div className="stk-modal-overlay" onClick={closeModal}>
          <div className="stk-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640, width: "100%" }}>
            <div className="stk-modal-header">
              <h3>{activeWarehouse} — Full Inventory</h3>
              <button className="stk-modal-close" onClick={closeModal}>
                &times;
              </button>
            </div>

            <div className="stk-modal-body" style={{ maxHeight: "65vh", overflowY: "auto" }}>
              <StockTable rows={activeRows} emptyMessage="No stock records found." emptyPadding={24} />
            </div>

            <div className="stk-modal-footer">
              <button className="stk-btn stk-btn--ghost" onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}