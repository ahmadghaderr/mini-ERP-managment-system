import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./invoices.css";
import type { InvoiceItem } from "../../types/invoice";

const mockItems: InvoiceItem[] = [
  {
    id: "item-1",
    extractedName: "Bottled Water 500ml",
    quantity: 24,
    unitPrice: 0.5,
  },
  {
    id: "item-2",
    extractedName: "Canned Beans 400g",
    quantity: 12,
    unitPrice: 1.2,
  },
  {
    id: "item-3",
    extractedName: "Organic Rice 1kg",
    quantity: 10,
    unitPrice: 2.5,
  },
];

interface ReviewProps {
  initialItems?: InvoiceItem[];
  pdfUrl?: string;
  onConfirm?: (items: InvoiceItem[]) => void;
  onReject?: () => void;
  onBack?: () => void;
}

export default function Review({
  initialItems = mockItems,
  pdfUrl = "https://www.w3.org/W3C/DesignIssues/diagrams/overview.pdf",
  onConfirm,
  onReject,
  onBack,
}: ReviewProps) {
  const navigate = useNavigate();
  const [items, setItems] = useState<InvoiceItem[]>(initialItems);

  const handleBack = onBack ?? (() => navigate(-1));
  const handleReject = onReject ?? (() => navigate("/invoices"));
  const handleConfirm =
    onConfirm ??
    ((confirmedItems) => {
      console.log("Confirmed Invoice Items:", confirmedItems);
      navigate("/invoices");
    });

  function setQty(id: string, qty: number) {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, quantity: Math.max(1, qty) } : it,
      ),
    );
  }

  return (
    <div className="inv-pg">
      <div className="inv-pg-head">
        <div>
          <div className="inv-pg-title">Review invoice</div>
        </div>
        <button className="inv-btn inv-btn--ghost" onClick={handleBack}>
          Back
        </button>
      </div>

      <div className="inv-banner">
        Confirming accepts the extracted data only. Stock is added later, when
        the shipment arrives (delivered).
      </div>

      <div
        style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 16 }}
      >
        <div
          className="inv-preview"
          style={{
            flex: "1 1 450px",
            minHeight: "480px",
            padding: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              title="Invoice PDF Preview"
              style={{
                width: "100%",
                height: "100%",
                minHeight: "480px",
                border: "none",
              }}
            />
          ) : (
            <div style={{ padding: 24, textAlign: "center" }}>
              No PDF preview available.
            </div>
          )}
        </div>

        <div
          className="inv-card"
          style={{ flex: "1 1 380px", height: "fit-content" }}
        >
          <table className="inv-tbl">
            <thead>
              <tr>
                <th>Extracted product</th>
                <th>Qty</th>
                <th>Unit price</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td>{it.extractedName}</td>
                  <td>
                    <input
                      className="inv-input"
                      type="number"
                      min="1"
                      style={{ width: 80 }}
                      value={it.quantity}
                      onChange={(e) =>
                        setQty(it.id, Number(e.target.value) || 1)
                      }
                    />
                  </td>
                  <td>${it.unitPrice.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button
          className="inv-btn inv-btn--primary"
          onClick={() => handleConfirm(items)}
        >
          Confirm
        </button>
        <button className="inv-btn inv-btn--danger" onClick={handleReject}>
          Reject
        </button>
      </div>
    </div>
  );
}
