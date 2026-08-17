import { useState } from "react";
import { hasPermission } from "../permissions/permissions";
import type { Role } from "../permissions/permissions";
import type { Warehouse } from "../../types/warehouse";

const initialWarehouses: Warehouse[] = [
  {
    id: "wh-1",
    name: "Main Warehouse",
    location: "Tripoli, LB",
    createdAt: "2026-07-01",
  },
  {
    id: "wh-2",
    name: "North Depot",
    location: "Beirut, LB",
    createdAt: "2026-07-10",
  },
  {
    id: "wh-3",
    name: "South Storage",
    location: "Saida, LB",
    createdAt: "2026-07-22",
  },
];

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState(initialWarehouses);
  const [search, setSearch] = useState("");

  const userJson = localStorage.getItem("currentUser");
  const role = (userJson ? JSON.parse(userJson).role : "staff") as Role;
  const canManage = hasPermission(role, "warehouses:manage");

  const rows = warehouses.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.location.toLowerCase().includes(search.toLowerCase())
  );

  function handleDelete(id: string) {
    if (!confirm("Delete this warehouse?")) return;
    setWarehouses((prev) => prev.filter((w) => w.id !== id));
  }

  return (
    <div style={styles.pageWrapper}>
      {/* Page Title Row */}
      <div style={styles.headerRow}>
        <div style={styles.titleGroup}>
          <h1 style={styles.mainTitle}>Warehouses</h1>
          <span style={styles.countBadge}>{rows.length} total</span>
        </div>
      </div>

      {/* Unified Table Card */}
      <div style={styles.cardContainer}>
        {/* Card Toolbar */}
        <div style={styles.toolbarRow}>
          <div style={styles.searchBox}>
            <svg
              style={styles.searchIcon}
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              style={styles.searchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or location..."
            />
          </div>

          {canManage && (
            <button
              style={styles.addBtn}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add Warehouse
            </button>
          )}
        </div>

        {/* Clean Table */}
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>NAME</th>
              <th style={styles.th}>LOCATION</th>
              <th style={styles.th}>CREATED</th>
              {canManage && <th style={{ ...styles.th, textAlign: "right" }}>ACTIONS</th>}
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((w) => (
                <tr key={w.id} style={styles.tr}>
                  <td style={styles.tdName}>{w.name}</td>
                  <td style={styles.td}>
                    <span style={styles.locationBadge}>{w.location}</span>
                  </td>
                  <td style={styles.tdMuted}>{w.createdAt}</td>
                  {canManage && (
                    <td style={{ ...styles.td, textAlign: "right" }}>
                      <div style={styles.actionsFlex}>
                        <button
                          style={styles.editBtn}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                        >
                          Edit
                        </button>
                        <button
                          style={styles.deleteBtn}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#f1f5f9";
                            e.currentTarget.style.color = "#0f172a";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "none";
                            e.currentTarget.style.color = "#64748b";
                          }}
                          onClick={() => handleDelete(w.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={canManage ? 4 : 3} style={styles.emptyTd}>
                  No warehouses match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  pageWrapper: {
    padding: "32px 40px",
    maxWidth: "1100px",
    margin: "0 auto",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    color: "#0f172a",
  },
  headerRow: {
    marginBottom: "20px",
  },
  titleGroup: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  mainTitle: {
    fontSize: "26px",
    fontWeight: 700,
    color: "#0f172a",
    margin: 0,
    letterSpacing: "-0.5px",
  },
  countBadge: {
    background: "#e2e8f0",
    color: "#475569",
    fontSize: "12px",
    fontWeight: 600,
    padding: "3px 10px",
    borderRadius: "20px",
  },
  cardContainer: {
    background: "#ffffff",
    borderRadius: "14px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.03), 0 2px 4px -1px rgba(0, 0, 0, 0.02)",
    overflow: "hidden",
  },
  toolbarRow: {
    padding: "16px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #f1f5f9",
    background: "#ffffff",
  },
  searchBox: {
    position: "relative",
    width: "280px",
  },
  searchIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
  },
  searchInput: {
    width: "100%",
    padding: "8px 12px 8px 34px",
    fontSize: "13px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    outline: "none",
    background: "#f8fafc",
    color: "#0f172a",
    boxSizing: "border-box",
  },
  addBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "linear-gradient(135deg, #7065d4 0%, #5b50c6 100%)",
    color: "#ffffff",
    border: "none",
    borderRadius: "9999px",
    padding: "7px 16px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "opacity 0.15s ease",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
  },
  th: {
    background: "#f8fafc",
    color: "#64748b",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.06em",
    padding: "12px 20px",
    borderBottom: "1px solid #e2e8f0",
  },
  tr: {
    borderBottom: "1px solid #f1f5f9",
  },
  td: {
    padding: "14px 20px",
    fontSize: "14px",
    color: "#334155",
  },
  tdName: {
    padding: "14px 20px",
    fontSize: "14px",
    fontWeight: 600,
    color: "#0f172a",
  },
  tdMuted: {
    padding: "14px 20px",
    fontSize: "13px",
    color: "#64748b",
  },
  locationBadge: {
    display: "inline-block",
    background: "#f1f5f9",
    color: "#334155",
    padding: "3px 8px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: 500,
    border: "1px solid #e2e8f0",
  },
  actionsFlex: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "6px",
  },
  editBtn: {
    background: "none",
    border: "none",
    fontSize: "13px",
    fontWeight: 500,
    color: "#334155",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: "6px",
    transition: "background 0.15s ease",
  },
  deleteBtn: {
    background: "none",
    border: "none",
    fontSize: "13px",
    fontWeight: 500,
    color: "#64748b",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: "6px",
    transition: "all 0.15s ease",
  },
  emptyTd: {
    textAlign: "center",
    padding: "32px",
    color: "#64748b",
    fontSize: "14px",
  },
};