import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../shared/pages.css';

// TODO: fetch from GET /warehouses
const warehouses = ['Main', 'North', 'South'];

export default function InvoiceUpload() {
  const navigate = useNavigate();
  const [fileName, setFileName] = useState<string | null>(null);
  const [warehouse, setWarehouse] = useState(warehouses[0]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setFileName(file.name);
  }

  function handleSubmit() {
    // TODO: upload file to S3 → create supplier_invoice { file_url, warehouse_id,
    // status: 'pending_extraction' } → then trigger AI extraction (deferred)
    console.log({ fileName, warehouse });
    navigate('/invoices');
  }

  return (
    <div className="pg">
      <div className="pg-head">
        <div>
          <div className="pg-title">Upload invoice</div>
          <div className="pg-sub">Upload a supplier PDF. Stock is only added later, when the shipment arrives.</div>
        </div>
        <button className="btn btn--ghost" onClick={() => navigate('/invoices')}>Back</button>
      </div>

      <div className="filters" style={{ maxWidth: 420, flexDirection: 'column' }}>
        <div className="field">
          <label>Destination warehouse</label>
          <select className="select" value={warehouse} onChange={(e) => setWarehouse(e.target.value)}>
            {warehouses.map((w) => <option key={w}>{w}</option>)}
          </select>
        </div>
      </div>

      <label className="preview" style={{ maxWidth: 420, cursor: 'pointer', display: 'flex' }}>
        <input type="file" accept=".pdf,image/*" onChange={handleFile} hidden />
        {fileName ? `Selected: ${fileName}` : 'Click to choose a PDF or image'}
      </label>

      {fileName && (
        <button className="btn btn--primary" style={{ marginTop: 16 }} onClick={handleSubmit}>
          Upload invoice
        </button>
      )}
    </div>
  );
}