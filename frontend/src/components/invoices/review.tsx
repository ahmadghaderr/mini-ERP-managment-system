import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../shared/pages.css';

interface InvoiceItem {
  id: string;
  extractedName: string;   // extracted_product_name
  quantity: number;
  unitPrice: number;
}

// TODO: fetch the invoice + its supplier_invoice_items by id
const mockItems: InvoiceItem[] = [
  { id: 'it-1', extractedName: 'Bottled Water 500ml', quantity: 200, unitPrice: 0.40 },
  { id: 'it-2', extractedName: 'Canned Beans', quantity: 120, unitPrice: 0.90 },
  { id: 'it-3', extractedName: 'First Aid Kit', quantity: 15, unitPrice: 12.50 },
];

export default function InvoiceReview() {
  const navigate = useNavigate();
  const [items, setItems] = useState(mockItems);

  function setQty(id: string, qty: number) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, quantity: qty } : it)));
  }

  function confirm() {
    // TODO: PATCH invoice → status: 'confirmed', confirmed_at: now.
    // NOTE: this does NOT add stock — stock is added at the 'delivered' step
    // when the shipment physically arrives.
    console.log('confirmed', items);
    navigate('/invoices');
  }

  function reject() {
    // TODO: PATCH invoice → status: 'rejected', rejected_at: now
    navigate('/invoices');
  }

  return (
    <div className="pg">
      <div className="pg-head">
        <div>
          <div className="pg-title">Review invoice</div>
          <div className="pg-sub">Check the extracted items, then confirm or reject.</div>
        </div>
        <button className="btn btn--ghost" onClick={() => navigate('/invoices')}>Back</button>
      </div>

      <div className="banner">
        Confirming accepts the extracted data only. Stock is added later, when the shipment arrives (delivered).
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div className="preview" style={{ flex: '1 1 300px' }}>Invoice file preview</div>

        <div className="card" style={{ flex: '1 1 340px' }}>
          <table className="tbl">
            <thead>
              <tr><th>Extracted product</th><th>Qty</th><th>Unit price</th></tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td>{it.extractedName}</td>
                  <td>
                    <input className="input" type="number" style={{ width: 80 }}
                      value={it.quantity}
                      onChange={(e) => setQty(it.id, Number(e.target.value))} />
                  </td>
                  <td>${it.unitPrice.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button className="btn btn--primary" onClick={confirm}>Confirm</button>
        <button className="btn btn--danger" onClick={reject}>Reject</button>
      </div>
    </div>
  );
}