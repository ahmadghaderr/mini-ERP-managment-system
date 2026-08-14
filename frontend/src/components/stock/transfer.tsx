import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./stock.css";
import type {
  Warehouse,
  NewTransferPayload,
  TransferItem,
} from "../../types/stock";

interface ProductOption {
  id: string;
  name: string;
}

const mockWarehouses: Warehouse[] = [
  { id: "wh-01", name: "Main Warehouse", code: "WH-MAIN" },
  { id: "wh-02", name: "North Branch", code: "WH-NORTH" },
  { id: "wh-03", name: "South Hub", code: "WH-SOUTH" },
];

const mockProducts: ProductOption[] = [
  { id: "prod-01", name: "Bottled Water 500ml" },
  { id: "prod-02", name: "Canned Beans" },
  { id: "prod-03", name: "Rice 1kg" },
];

interface TransferProps {
  warehouses?: Warehouse[];
  products?: ProductOption[];
  onSave?: (payload: NewTransferPayload) => void;
  onClose?: () => void;
}

export default function Transfer({
  warehouses = mockWarehouses,
  products = mockProducts,
  onSave,
  onClose,
}: TransferProps) {
  const navigate = useNavigate();
  const handleBack = onClose ?? (() => navigate(-1));

  const [sourceId, setSourceId] = useState(warehouses[0]?.id ?? "");
  const [destId, setDestId] = useState(
    warehouses[1]?.id ?? warehouses[0]?.id ?? "",
  );
  const [items, setItems] = useState<TransferItem[]>([
    {
      productId: products[0]?.id ?? "",
      productName: products[0]?.name ?? "",
      quantity: 1,
    },
  ]);
  const [notes, setNotes] = useState("");

  const updateItem = (index: number, fields: Partial<TransferItem>) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...fields } : item)),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sourceId === destId)
      return alert("Source and Destination warehouses must be different.");

    const sourceWh = warehouses.find((w) => w.id === sourceId);
    const destWh = warehouses.find((w) => w.id === destId);

    if (!sourceWh || !destWh) return alert("Select valid warehouses.");

    const payload: NewTransferPayload = {
      sourceWarehouseId: sourceWh.id,
      sourceWarehouseName: sourceWh.name,
      destinationWarehouseId: destWh.id,
      destinationWarehouseName: destWh.name,
      items,
      requestedBy: "Ahmad Ghader",
      notes,
    };

    if (onSave) {
      onSave(payload);
    } else {
      console.log("Transfer created:", payload);
      navigate("/ledger");
    }
    if (onClose) onClose();
  };

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
                    {w.name}
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
                    {w.name}
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
                  setItems([
                    ...items,
                    {
                      productId: products[0]?.id ?? "",
                      productName: products[0]?.name ?? "",
                      quantity: 1,
                    },
                  ])
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
                  onChange={(e) => {
                    const selected = products.find(
                      (p) => p.id === e.target.value,
                    );
                    if (selected)
                      updateItem(idx, {
                        productId: selected.id,
                        productName: selected.name,
                      });
                  }}
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>

                <input
                  className="stk-input"
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(idx, {
                      quantity: Math.max(1, parseInt(e.target.value) || 1),
                    })
                  }
                />

                <button
                  type="button"
                  className="stk-link-btn stk-remove-item-btn"
                  onClick={() =>
                    items.length > 1 &&
                    setItems(items.filter((_, i) => i !== idx))
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
            <button type="submit" className="stk-btn stk-btn--primary">
              Submit Transfer
            </button>
            <button
              type="button"
              className="stk-btn stk-btn--ghost"
              onClick={handleBack}
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
