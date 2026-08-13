import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../shared/pages.css';

type InvoiceStatus =
  | 'pending_extraction' | 'extracted' | 'confirmed' | 'delivered' | 'rejected';

interface SupplierInvoice {
  id: string;
  supplier: string;        // extracted_supplier_name
  invoiceDate: string;     // invoice_date_extracted
  deliveryDate: string;    // extracted_delivery_date
  warehouse: string;
  status: InvoiceStatus;
}

// TODO: fetch from GET /supplier-invoices
const mockInvoices: SupplierInvoice[] = [
  { id: 'si-01', supplier: 'AquaSupply Co.', invoiceDate: '2026-08-02', deliveryDate: '2026-08-15', warehouse: 'Main', status: 'confirmed' },
  { id: 'si-02', supplier: 'FreshFoods Ltd.', invoiceDate: '2026-08-04', deliveryDate: '2026-08-12', warehouse: 'North', status: 'extracted' },
  { id: 'si-03', supplier: 'MediCare Inc.', invoiceDate: '2026-08-05', deliveryDate: '—', warehouse: 'Main', status: 'pending_extraction' },
  { id: 'si-04', supplier: 'ElectroParts', invoiceDate: '2026-07-28', deliveryDate: '2026-08-06', warehouse: 'South', status: 'delivered' },
];

const STATUSES: (InvoiceStatus | 'all')[] =
  ['all', 'pending_extraction', 'extracted', 'confirmed', 'delivered', 'rejected'];

export default function InvoicesList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<InvoiceStatus | 'all'>('all');

  const rows = mockInvoices.filter(
    (inv) =>
      (status === 'all' || inv.status === status) &&
      inv.supplier.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="pg">
      <div className="pg-head">
        <div>
          <div className="pg-title">Supplier Invoices</div>
        </div>
        <button className="btn btn--primary" onClick={() => navigate('/invoices/upload')}>
          + Upload invoice
        </button>
      </div>

      <div className="filters">
        <div className="field">
          <label>Search supplier</label>
          <input className="input" value={search}
            onChange={(e) => setSearch(e.target.value)} placeholder="e.g. AquaSupply" />
        </div>
        <div className="field">
          <label>Status</label>
          <select className="select" value={status}
            onChange={(e) => setStatus(e.target.value as InvoiceStatus | 'all')}>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        </div>
      </div>

      <div className="card">
        <table className="tbl">
          <thead>
            <tr>
              <th>Supplier</th><th>Invoice date</th><th>Delivery date</th>
              <th>Warehouse</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((inv) => (
              <tr key={inv.id}>
                <td>{inv.supplier}</td>
                <td>{inv.invoiceDate}</td>
                <td>{inv.deliveryDate}</td>
                <td>{inv.warehouse}</td>
                <td><span className={`badge badge--${inv.status}`}>{inv.status.replace('_', ' ')}</span></td>
                <td>
                  {/* TODO: pass the real invoice id, e.g. /invoices/review?id=inv.id */}
                  <button className="link-btn" onClick={() => navigate('/invoices/review')}>Review</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}