import { useState } from 'react';
import '../shared/pages.css';

// TODO: fetch from backend
const warehouses = ['Main', 'North', 'South'];
const products = ['Bottled Water 500ml', 'Canned Beans', 'First Aid Kit'];

interface TransferRow {
  id: string; date: string; product: string;
  from: string; to: string; quantity: number;
}

const pastTransfers: TransferRow[] = [
  { id: 't-1', date: '2026-08-08', product: 'Bottled Water 500ml', from: 'North', to: 'Main', quantity: 30 },
];

export default function StockTransfer() {
  const [product, setProduct] = useState(products[0]);
  const [from, setFrom] = useState(warehouses[0]);
  const [to, setTo] = useState(warehouses[1]);
  const [quantity, setQuantity] = useState(0);
  const [error, setError] = useState('');

  function submit() {
    if (from === to) { setError('Source and destination must differ.'); return; }
    if (quantity <= 0) { setError('Quantity must be greater than 0.'); return; }
    setError('');
    // TODO: POST /warehouse-transfers → creates 1 warehouse_transfer row +
    // 2 stock_movement rows (transfer_out from `from`, transfer_in to `to`).
    console.log({ product, from, to, quantity });
  }

  return (
    <div className="pg">
      <div className="pg-head">
        <div>
          <div className="pg-title">Transfer stock</div>
          <div className="pg-sub">Move one product between warehouses. Logged as two ledger entries.</div>
        </div>
      </div>

      {error && <div className="banner" style={{ background: '#fde8e8', borderColor: '#feb2b2', color: '#a32d2d' }}>{error}</div>}

      <div className="filters" style={{ maxWidth: 460, flexDirection: 'column' }}>
        <div className="field"><label>Product</label>
          <select className="select" value={product} onChange={(e) => setProduct(e.target.value)}>
            {products.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div className="field"><label>From warehouse</label>
          <select className="select" value={from} onChange={(e) => setFrom(e.target.value)}>
            {warehouses.map((w) => <option key={w}>{w}</option>)}
          </select>
        </div>
        <div className="field"><label>To warehouse</label>
          <select className="select" value={to} onChange={(e) => setTo(e.target.value)}>
            {warehouses.map((w) => <option key={w}>{w}</option>)}
          </select>
        </div>
        <div className="field"><label>Quantity</label>
          <input className="input" type="number" value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))} />
        </div>
        <button className="btn btn--primary" onClick={submit}>Transfer</button>
      </div>

      <div className="pg-sub" style={{ margin: '24px 0 8px', fontWeight: 600 }}>Recent transfers</div>
      <div className="card">
        <table className="tbl">
          <thead><tr><th>Date</th><th>Product</th><th>From</th><th>To</th><th>Qty</th></tr></thead>
          <tbody>
            {pastTransfers.map((t) => (
              <tr key={t.id}>
                <td>{t.date}</td><td>{t.product}</td><td>{t.from}</td><td>{t.to}</td><td>{t.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}