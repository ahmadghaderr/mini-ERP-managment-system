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
          <div className="inv-pg-title">Supplier Invoices</div>
        </div>
        <button className="inv-btn inv-btn--primary" onClick={handleUpload}>
          + Upload invoice
        </button>
      </div>

      <div className="inv-filters">
        <div className="inv-field">
          <label>Search supplier</label>
          <input
            className="inv-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="e.g. AquaSupply"
          />
        </div>
        <div className="inv-field">
          <label>Status</label>
          <select
            className="inv-select"
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as InvoiceStatus | "all")
            }
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>
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
