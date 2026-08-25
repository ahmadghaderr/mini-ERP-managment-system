import { useEffect, useMemo, useState } from "react";
import "./stock.css";
import PageLoader from "../shared/PageLoader";
import { fetchStockLevels, adjustStock } from "../../services/stock-service";
import type { WarehouseStock, StockRow, StockTableProps } from "../../types/stock";
import { fetchProducts } from "../../services/product-service";
import type { Product } from "../../types/product";

const PREVIEW_COUNT = 3;

function StockTable({ rows, emptyMessage, emptyPadding }: StockTableProps) {
  return (
    <table className="stk-tbl">
      <thead>
        <tr>
          <th>Product</th>
          <th style={{ width: 90 }}>On Hand</th>
          <th style={{ width: 90 }}>Reserved</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={3} style={{ textAlign: "center", padding: emptyPadding }}>
              {emptyMessage}
            </td>
          </tr>
        ) : (
          rows.map((row, idx) => (
            <tr key={`${row.productName}-${idx}`}>
              <td>{row.productName}</td>
              <td style={{ fontWeight: 600 }}>{row.quantityOnHand}</td>
              <td style={{ color: "var(--text-muted)" }}>{row.quantityReserved}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

export default function Inventory() {
  const [stock, setStock] = useState<WarehouseStock[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeWarehouse, setActiveWarehouse] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [addProductId, setAddProductId] = useState("");
  const [addQuantity, setAddQuantity] = useState("");
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  function loadStock() {
    setLoading(true);
    return fetchStockLevels()
      .then((data) => setStock(data))
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Could not load inventory.");
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchStockLevels(), fetchProducts()])
      .then(([stockData, productData]) => {
        if (cancelled) return;
        setStock(stockData);
        setProducts(productData);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load inventory.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const warehouseNames = useMemo(() => {
    const names = new Set<string>();
    stock.forEach((s) => {
      if (s.warehouse?.warehouseName) names.add(s.warehouse.warehouseName);
    });
    return Array.from(names).sort();
  }, [stock]);

  const warehouseNameToId = useMemo(() => {
    const map = new Map<string, string>();
    stock.forEach((s) => {
      if (s.warehouse?.warehouseName) {
        map.set(s.warehouse.warehouseName, s.warehouseId);
      }
    });
    return map;
  }, [stock]);

  const rowsByWarehouse = useMemo(() => {
    const map = new Map<string, StockRow[]>();
    warehouseNames.forEach((name) => map.set(name, []));

    stock
      .filter((s) =>
        (s.product?.productName ?? "").toLowerCase().includes(search.toLowerCase()),
      )
      .forEach((s) => {
        const warehouseName = s.warehouse?.warehouseName ?? "Unknown warehouse";
        const productName = s.product?.productName ?? "Unknown product";
        if (!map.has(warehouseName)) map.set(warehouseName, []);
        map.get(warehouseName)!.push({
          productName,
          quantityOnHand: s.quantityOnHand,
          quantityReserved: s.quantityReserved,
        });
      });

    map.forEach((rows) =>
      rows.sort((a, b) => a.productName.localeCompare(b.productName)),
    );

    return map;
  }, [stock, search, warehouseNames]);

  function closeModal() {
    setActiveWarehouse(null);
    setShowAddForm(false);
    setAddProductId("");
    setAddQuantity("");
    setAddError(null);
  }

  async function handleAddProduct() {
    const warehouseId = activeWarehouse ? warehouseNameToId.get(activeWarehouse) : undefined;
    const quantity = Number(addQuantity);

    if (!warehouseId || !addProductId) {
      setAddError("Select a product and enter a quantity.");
      return;
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setAddError("Quantity must be a positive number.");
      return;
    }

    setAddSaving(true);
    setAddError(null);
    try {
      await adjustStock({
        warehouseId,
        productId: addProductId,
        quantityChange: quantity,
      });
      await loadStock();
      setShowAddForm(false);
      setAddProductId("");
      setAddQuantity("");
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Could not add product.");
    } finally {
      setAddSaving(false);
    }
  }

  const activeRows = activeWarehouse ? (rowsByWarehouse.get(activeWarehouse) ?? []) : [];

    if (loading) {
    return <PageLoader />;
  }

  if (error) {
    return <div style={{ padding: 24, color: "crimson" }}>{error}</div>;
  }

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

      <div
        className="stk-warehouse-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
        }}
      >
        {warehouseNames.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center" }}>
            No warehouse stock recorded yet.
          </div>
        ) : (
          warehouseNames.map((warehouse) => {
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
          })
        )}
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

              {showAddForm ? (
                <div style={{ marginTop: 16, padding: 16, border: "1px solid #e2e2e2", borderRadius: 8 }}>
                  {addError && (
                    <div style={{ color: "crimson", marginBottom: 8, fontSize: 13 }}>
                      {addError}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <select
                      value={addProductId}
                      onChange={(e) => setAddProductId(e.target.value)}
                      style={{ flex: "1 1 200px", padding: 8 }}
                    >
                      <option value="" disabled>
                        Select product
                      </option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.productName}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      placeholder="Quantity"
                      value={addQuantity}
                      onChange={(e) => setAddQuantity(e.target.value)}
                      style={{ width: 120, padding: 8 }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                    <button
                      className="stk-btn stk-btn--ghost"
                      onClick={() => setShowAddForm(false)}
                      disabled={addSaving}
                    >
                      Cancel
                    </button>
                    <button
                      className="stk-btn stk-btn--primary"
                      onClick={handleAddProduct}
                      disabled={addSaving}
                    >
                      {addSaving ? "Adding..." : "Add"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="stk-btn stk-btn--ghost"
                  style={{ marginTop: 16 }}
                  onClick={() => setShowAddForm(true)}
                >
                  + Add product to this warehouse
                </button>
              )}
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