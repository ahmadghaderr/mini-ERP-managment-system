import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./invoices.css";
import type { SupplierInvoice, InvoiceStatus } from "../../types/invoice";

const mockInvoices: SupplierInvoice[] = [
  {
    id: "si-01",
    supplier: "AquaSupply Co.",
    type: "Purchase Order",
    invoiceDate: "2026-08-02",
    deliveryDate: "2026-08-15",
    warehouse: "Main Warehouse",
    status: "confirmed",
  },
  {
    id: "si-02",
    supplier: "FreshFoods Ltd.",
    type: "Tax Invoice",
    invoiceDate: "2026-08-04",
    deliveryDate: "2026-08-12",
    warehouse: "North Branch",
    status: "extracted",
  },
  {
    id: "si-03",
    supplier: "MediCare Inc.",
    type: "Credit Note",
    invoiceDate: "2026-08-05",
    deliveryDate: "—",
    warehouse: "Main Warehouse",
    status: "pending_extraction",
  },
];

const STATUSES: (InvoiceStatus | "all")[] = [
  "all",
  "pending_extraction",
  "extracted",
  "confirmed",
  "delivered",
  "rejected",
];

interface ListProps {
  invoices?: SupplierInvoice[];
  onUploadClick?: () => void;
  onReviewClick?: (id: string) => void;
}

export default function List({
  invoices = mockInvoices,
  onUploadClick,
  onReviewClick,
}: ListProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<InvoiceStatus | "all">("all");

  const handleUpload = onUploadClick ?? (() => navigate("/invoices/upload"));
  const handleReview =
    onReviewClick ?? ((id: string) => navigate(`/invoices/review/${id}`));

  const rows = invoices.filter(
    (inv) =>
      (status === "all" || inv.status === status) &&
      inv.supplier.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="inv-pg">
      <div className="inv-pg-head">
        <div>
          <h1 className="inv-pg-title">Supplier Invoices</h1>
        </div>
        <button className="inv-btn inv-btn--primary" onClick={handleUpload}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Upload invoice
        </button>
      </div>

      <div className="pg-toolbar">
        <div className="search-wrap">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by supplier"
          />
        </div>
        <select
          className="filter-select"
          value={status}
          onChange={(e) =>
            setStatus(e.target.value as InvoiceStatus | "all")
          }
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All statuses" : s.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </div>

      <div className="inv-card">
        <table className="inv-tbl">
          <thead>
            <tr>
              <th>Supplier</th>
              <th>Type</th>
              <th>Invoice date</th>
              <th>Delivery date</th>
              <th>Warehouse</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: 24 }}>
                  No invoices found.
                </td>
              </tr>
            ) : (
              rows.map((inv) => (
                <tr key={inv.id}>
                  <td>{inv.supplier}</td>
                  <td>{inv.type}</td>
                  <td>{inv.invoiceDate}</td>
                  <td>{inv.deliveryDate}</td>
                  <td>{inv.warehouse}</td>
                  <td>
                    <span
                      className={`inv-badge inv-badge--${inv.status.replaceAll(
                        "_",
                        "-"
                      )}`}
                    >
                      {inv.status.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td>
                    <button
                      className="inv-link-btn"
                      onClick={() => handleReview(inv.id)}
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}