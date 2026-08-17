import { useState } from "react";
import { hasPermission } from "../permissions/permissions";
import type { Role } from "../permissions/permissions";
import type { Category, Product } from "../../types/product";

const initialProducts: Product[] = [
  { id: "p-1", name: "Bottled Water 500ml", category: "water", price: 0.4 },
  { id: "p-2", name: "Canned Beans", category: "food", price: 0.9 },
  { id: "p-3", name: "First Aid Kit", category: "healthcare", price: 12.5 },
  { id: "p-4", name: "USB Charger", category: "electronics", price: 8.0 },
];

const CATEGORIES: (Category | "all")[] = [
  "all",
  "water",
  "food",
  "healthcare",
  "electronics",
];

const categoryBadgeStyles: Record<Category, React.CSSProperties> = {
  water: {
    background: "#eef2ff", // matches your purple family
    color: "#4338ca", // indigo (matches purple theme)
    border: "1px solid #c7d2fe",
  },
  food: {
    background: "#fefce8", // warm but muted
    color: "#713f12", // brown (earthy, goes with purple)
    border: "1px solid #fde68a",
  },
  healthcare: {
    background: "#fdf2f8", // soft rose
    color: "#9d174d", // deep rose (muted, not neon)
    border: "1px solid #fbcfe8",
  },
  electronics: {
    background: "#f5f3ff", // light purple (matches your brand!)
    color: "#5b21b6", // your exact brand purple
    border: "1px solid #ddd6fe",
  },
};

export default function Products() {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");

  const userJson = localStorage.getItem("currentUser");
  const role = (userJson ? JSON.parse(userJson).role : "staff") as Role;
  const canManage = hasPermission(role, "products:manage");

  const rows = products.filter(
    (p) =>
      (category === "all" || p.category === category) &&
      p.name.toLowerCase().includes(search.toLowerCase())
  );

  function handleDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div style={styles.pageWrapper}>
      {/* Header Row */}
      <div style={styles.headerRow}>
        <h1 style={styles.mainTitle}>Products</h1>
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
            Add Product
          </button>
        )}
      </div>

      {/* Card Wrapper */}
      <div style={styles.cardContainer}>
        {/* Toolbar / Filters */}
        <div style={styles.toolbarRow}>
          <div style={styles.fieldGroup}>
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
                placeholder="Search products..."
              />
            </div>

            <select
              style={styles.selectInput}
              value={category}
              onChange={(e) => setCategory(e.target.value as Category | "all")}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c === "all" ? "All Categories" : c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>NAME</th>
              <th style={styles.th}>CATEGORY</th>
              <th style={styles.th}>PRICE</th>
              {canManage && <th style={{ ...styles.th, textAlign: "right" }}>ACTIONS</th>}
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((p) => (
                <tr key={p.id} style={styles.tr}>
                  <td style={styles.tdName}>{p.name}</td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.badgeBase,
                        ...categoryBadgeStyles[p.category],
                      }}
                    >
                      {p.category}
                    </span>
                  </td>
                  <td style={styles.td}>${p.price.toFixed(2)}</td>
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
                          onClick={() => handleDelete(p.id)}
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
                  No products found.
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
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  mainTitle: {
    fontSize: "26px",
    fontWeight: 700,
    color: "#0f172a",
    margin: 0,
    letterSpacing: "-0.5px",
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
    alignItems: "center",
    borderBottom: "1px solid #f1f5f9",
    background: "#ffffff",
  },
  fieldGroup: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },
  searchBox: {
    position: "relative",
    width: "260px",
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
  selectInput: {
    padding: "8px 12px",
    fontSize: "13px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    outline: "none",
    background: "#f8fafc",
    color: "#0f172a",
    cursor: "pointer",
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
  badgeBase: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 12px",
    borderRadius: "9999px",
    fontSize: "12px",
    fontWeight: 600,
    textTransform: "capitalize",
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