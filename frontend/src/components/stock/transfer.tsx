import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./stock.css";
import { fetchWarehouses } from "../../services/warehouse-service";
import { fetchProducts } from "../../services/product-service";
import { fetchTransfers, createTransfer } from "../../services/transfer-service";
import { decodeToken } from "../../lib/cognito";
import type { Warehouse } from "../../types/warehouse";
import type { Product } from "../../types/product";
import type { WarehouseTransfer, CreateTransferPayload } from "../../types/stock";

interface FormItem {
  productId: string;
  quantity: number;
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (
    err &&
    typeof err === "object" &&
    "response" in err &&
    err.response &&
    typeof err.response === "object" &&
    "data" in err.response
  ) {
    const data = (err.response as { data?: unknown }).data;
    if (data && typeof data === "object" && "message" in data) {
      const msg = (data as { message: unknown }).message;
      if (typeof msg === "string") return msg;
      if (Array.isArray(msg)) return msg.join(", ");
    }
  }
  return err instanceof Error ? err.message : fallback;
}

export default function Transfer() {
  const navigate = useNavigate();
  const handleBack = () => navigate(-1);

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [history, setHistory] = useState<WarehouseTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [sourceId, setSourceId] = useState("");
  const [destId, setDestId] = useState("");
  const [items, setItems] = useState<FormItem[]>([{ productId: "", quantity: 1 }]);
  const [notes, setNotes] = useState("");

  const idToken = localStorage.getItem("idToken");
  const tokenPayload = idToken ? decodeToken(idToken) : null;
  const createdBy = (tokenPayload?.sub as string | undefined) ?? undefined;

  async function loadAll() {
    const [wh, prod, hist] = await Promise.all([
      fetchWarehouses(),
      fetchProducts(),
      fetchTransfers(),
    ]);
    setWarehouses(wh);
    setProducts(prod);
    setHistory(hist);
    if (wh.length > 0) {
      setSourceId(wh[0].id);
      setDestId(wh[1]?.id ?? wh[0].id);
    }
    if (prod.length > 0) {
      setItems([{ productId: prod[0].id, quantity: 1 }]);
    }
  }

  useEffect(() => {
    loadAll().finally(() => setLoading(false));
  }, []);

  const updateItem = (index: number, fields: Partial<FormItem>) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...fields } : item)),
    );
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (sourceId === destId) {
      alert("Source and Destination warehouses must be different.");
      return;
    }
    if (items.some((it) => !it.productId)) {
      alert("Please select a product for every item.");
      return;
    }

    setSubmitting(true);
    try {
      // NOTE: backend accepts one product per transfer request. If multiple
      // items are added, submit them as separate transfer calls.
      for (const item of items) {
        const payload: CreateTransferPayload = {
          productId: item.productId,
          fromWarehouseId: sourceId,
          toWarehouseId: destId,
          quantity: item.quantity,
          createdBy,
        };
        await createTransfer(payload);
      }

      const prod = products[0];
      setItems([{ productId: prod?.id ?? "", quantity: 1 }]);
      setNotes("");
      const hist = await fetchTransfers();
      setHistory(hist);
    } catch (err) {
      alert(getErrorMessage(err, "Could not submit transfer."));
    } finally {
      setSubmitting(false);
    }
  }

  const recentHistory = [...history]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 8);

  if (loading) {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }

  return (
    <div className="stk-pg">
      <div className="stk-pg-head">
        <div>
          <div className="stk-pg-title">Create Stock Transfer</div>
          <p className="stk-pg-subtitle">
            Move inventory between warehouses and log it to the ledger.
          </p>
        </div>
        <button className="stk-btn stk-btn--ghost" onClick={handleBack}>
          ← Back
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="stk-card stk-upload-card">
          <div className="stk-filters-row">
            <div className="stk-field">
              <label>From Warehouse</label>
              <select
                className="stk-select"
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.warehouseName}
                  </option>
                ))}
              </select>
            </div>
            <div className="stk-field">
              <label>To Warehouse</label>
              <select
                className="stk-select"
                value={destId}
                onChange={(e) => setDestId(e.target.value)}
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.warehouseName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="stk-extracted-header">
              <label style={{ fontWeight: 600 }}>Transfer Items</label>
              <button
                type="button"
                className="stk-link-btn"
                onClick={() =>
                  setItems([...items, { productId: products[0]?.id ?? "", quantity: 1 }])
                }
              >
                + Add Item
              </button>
            </div>

            {items.map((item, idx) => (
              <div key={idx} className="stk-transfer-item-row">
                <select
                  className="stk-select"
                  value={item.productId}
                  onChange={(e) => updateItem(idx, { productId: e.target.value })}
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.productName}
                    </option>
                  ))}
                </select>

                <input
                  className="stk-input"
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(idx, { quantity: Math.max(1, parseInt(e.target.value) || 1) })
                  }
                />

                <button
                  type="button"
                  className="stk-remove-item-btn"
                  onClick={() =>
                    items.length > 1 && setItems(items.filter((_, i) => i !== idx))
                  }
                >
                  &times;
                </button>
              </div>
            ))}
          </div>

          <div className="stk-field">
            <label>Notes</label>
            <input
              className="stk-input"
              placeholder="Transfer remarks..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="stk-actions-row">
            <button type="submit" className="stk-btn stk-btn--primary" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Transfer"}
            </button>
            <button type="button" className="stk-btn stk-btn--ghost" onClick={handleBack}>
              Cancel
            </button>
          </div>
        </div>
      </form>

      <div className="stk-card" style={{ marginTop: 24 }}>
        <div className="stk-card-header">
          <div className="stk-card-title">Recent Transfer History</div>
        </div>
        <div className="stk-tbl-wrap">
          <table className="stk-tbl stk-history-tbl">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Route</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentHistory.length === 0 ? (
                <tr>
                  <td colSpan={4} className="stk-history-empty">
                    No transfer history yet.
                  </td>
                </tr>
              ) : (
                recentHistory.map((t) => (
                  <tr key={t.id}>
                    <td>{t.product?.productName ?? "—"}</td>
                    <td style={{ fontWeight: 600 }}>{t.quantity}</td>
                    <td className="stk-history-route">
                      {t.fromWarehouse?.warehouseName ?? "—"} → {t.toWarehouse?.warehouseName ?? "—"}
                    </td>
                    <td style={{ fontSize: 13, color: "var(--text-muted)" }}>
                      {new Date(t.createdAt).toLocaleString()}
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