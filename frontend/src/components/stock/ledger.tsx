import { useState } from 'react';
import '../shared/pages.css';

type Reason =
  | 'invoice_delivered' | 'order_delivered' | 'transfer_out' | 'transfer_in' | 'adjustment';

interface Movement {
  id: string;
  date: string;
  product: string;
  warehouse: string;
  quantityChange: number;  // signed
  reason: Reason;
}

// TODO: fetch from GET /stock-movements
const mockMovements: Movement[] = [
  { id: 'm-1', date: '2026-08-06', product: 'First Aid Kit', warehouse: 'Main', quantityChange: 15, reason: 'invoice_delivered' },
  { id: 'm-2', date: '2026-08-07', product: 'Canned Beans', warehouse: 'Main', quantityChange: -40, reason: 'order_delivered' },
  { id: 'm-3', date: '2026-08-08', product: 'Bottled Water 500ml', warehouse: 'North', quantityChange: -30, reason: 'transfer_out' },
  { id: 'm-4', date: '2026-08-08', product: 'Bottled Water 500ml', warehouse: 'Main', quantityChange: 30, reason: 'transfer_in' },
  { id: 'm-5', date: '2026-08-09', product: 'First Aid Kit', warehouse: 'Main', quantityChange: -2, reason: 'adjustment' },
];

const REASONS: (Reason | 'all')[] =
  ['all', 'invoice_delivered', 'order_delivered', 'transfer_out', 'transfer_in', 'adjustment'];

export default function StockLedger() {
  const [warehouse, setWarehouse] = useState('all');
  const [reason, setReason] = useState<Reason | 'all'>('all');

  const rows = mockMovements.filter(
    (m) =>
      (warehouse === 'all' || m.warehouse === warehouse) &&
      (reason === 'all' || m.reason === reason),
  );

  return (
    <div className="pg">
      <div className="pg-head">
        <div>
          <div className="pg-title">Stock movement ledger</div>
        </div>
      </div>

      <div className="filters">
        <div className="field">
          <label>Warehouse</label>
          <select className="select" value={warehouse} onChange={(e) => setWarehouse(e.target.value)}>
            <option value="all">All</option>
            <option>Main</option><option>North</option><option>South</option>
          </select>
        </div>
        <div className="field">
          <label>Reason</label>
          <select className="select" value={reason} onChange={(e) => setReason(e.target.value as Reason | 'all')}>
            {REASONS.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
          </select>
        </div>
      </div>

      <div className="card">
        <table className="tbl">
          <thead>
            <tr><th>Date</th><th>Product</th><th>Warehouse</th><th>Reason</th><th>Change</th></tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id}>
                <td>{m.date}</td>
                <td>{m.product}</td>
                <td>{m.warehouse}</td>
                <td style={{ textTransform: 'capitalize' }}>{m.reason.replace('_', ' ')}</td>
                <td className={m.quantityChange >= 0 ? 'qty-pos' : 'qty-neg'}>
                  {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}