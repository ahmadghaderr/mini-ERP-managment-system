import { useState } from "react";
import "./stock.css";
import type { LedgerEntry } from "../../types/stock";

export const mockLedgerEntries: LedgerEntry[] = [
  {
    id: "led-01",
    transferId: "tr-101",
    timestamp: "2026-08-10 10:00",
    productName: "Bottled Water 500ml",
    quantity: 100,
    fromWarehouse: "Main Warehouse",
    toWarehouse: "North Branch",
    performedBy: "Ahmad Ghader",
    type: "TRANSFER_OUT",
  },
  {
    id: "led-02",
    transferId: "tr-102",
    timestamp: "2026-08-11 14:30",
    productName: "Canned Beans",
    quantity: 50,
    fromWarehouse: "Main Warehouse",
    toWarehouse: "South Hub",
    performedBy: "Ahmad Ghader",
    type: "TRANSFER_IN",
  },
];

interface LedgerProps {
  entries?: LedgerEntry[];
}

const TYPE_LABELS: Record<LedgerEntry["type"], string> = {
  TRANSFER_IN: "TRANSFER IN",
  TRANSFER_OUT: "TRANSFER OUT",
  ADJUSTMENT_IN: "ADJUSTMENT IN",
  ADJUSTMENT_OUT: "ADJUSTMENT OUT",
};

const TYPE_BADGE: Record<LedgerEntry["type"], string> = {
  TRANSFER_IN: "stk-badge--success",
  TRANSFER_OUT: "stk-badge--info",
  ADJUSTMENT_IN: "stk-badge--success",
  ADJUSTMENT_OUT: "stk-badge--warning",
};

export default function Ledger({ entries = mockLedgerEntries }: LedgerProps) {
  const [search, setSearch] = useState("");

  const filteredEntries = entries.filter(
    (e) =>
      e.productName.toLowerCase().includes(search.toLowerCase()) ||
      (e.transferId ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (e.fromWarehouse ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (e.toWarehouse ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="stk-pg">
      <div className="stk-pg-head">
        <div>
          <div className="stk-pg-title">Ledger</div>
        </div>
      </div>

      <div className="stk-card">
        <div className="stk-card-header stk-ledger-header">
          <div className="stk-card-title">Transfer Ledger Audit</div>
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
          <table className="stk-tbl">
            <thead>
              <tr>
                <th>Ledger ID</th>
                <th>Transfer Ref</th>
                <th>Timestamp</th>
                <th>Product</th>
                <th>Qty Moved</th>
                <th>Route</th>
                <th>Logged By</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 24 }}>
                    No ledger records found.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td style={{ fontSize: 12, fontFamily: "monospace" }}>
                      {entry.id}
                    </td>
                    <td style={{ fontWeight: 600 }}>{entry.transferId ?? "—"}</td>
                    <td style={{ fontSize: 13 }}>{entry.timestamp}</td>
                    <td>{entry.productName}</td>
                    <td style={{ fontWeight: 600 }}>{entry.quantity}</td>
                    <td style={{ fontSize: 12 }}>
                      {entry.fromWarehouse && entry.toWarehouse
                        ? `${entry.fromWarehouse} → ${entry.toWarehouse}`
                        : entry.toWarehouse
                          ? `+ ${entry.toWarehouse}`
                          : `- ${entry.fromWarehouse}`}
                    </td>
                    <td style={{ fontSize: 13 }}>{entry.performedBy}</td>
                    <td>
                      <span className={`stk-badge ${TYPE_BADGE[entry.type]}`}>
                        {TYPE_LABELS[entry.type]}
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