import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./orders.css";
import type { CustomerOrderSummary, CustomerOrderStatus } from "../../types/order";

const mockOrders: CustomerOrderSummary[] = [
  {
    id: "co-01",
    customerName: "Acme Retail Co.",
    orderDate: "2026-08-03",
    deliveryDate: "2026-08-16",
    warehouse: "Main Warehouse",
    status: "confirmed",
  },
  {
    id: "co-02",
    customerName: "Greenfield Market",
    orderDate: "2026-08-06",
    deliveryDate: "2026-08-18",
    warehouse: "North Branch",
    status: "delivered",
  },
  {
    id: "co-03",
    customerName: "Urban Grocers",
    orderDate: "2026-08-09",
    deliveryDate: "—",
    warehouse: "Main Warehouse",
    status: "pending",
  },
];

const STATUSES: (CustomerOrderStatus | "all")[] = [
  "all",
  "pending",
  "confirmed",
  "delivered",
  "rejected",
];

interface ListProps {
  orders?: CustomerOrderSummary[];
  onUploadClick?: () => void;
}

export default function List({ orders = mockOrders, onUploadClick }: ListProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CustomerOrderStatus | "all">("all");

  const handleUpload = onUploadClick ?? (() => navigate("/orders/upload"));

  const rows = orders.filter(
    (order) =>
      (status === "all" || order.status === status) &&
      order.customerName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="ord-pg">
      <div className="ord-pg-head">
        <div>
          <h1 className="ord-pg-title">Customer Orders</h1>
        </div>
        <button className="ord-btn ord-btn--primary" onClick={handleUpload}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Upload order
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
            placeholder="Search by customer"
          />
        </div>
        <select
          className="filter-select"
          value={status}
          onChange={(e) => setStatus(e.target.value as CustomerOrderStatus | "all")}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All statuses" : s}
            </option>
          ))}
        </select>
      </div>

      <div className="ord-card">
        <table className="ord-tbl">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Order date</th>
              <th>Delivery date</th>
              <th>Warehouse</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: 24 }}>
                  No orders found.
                </td>
              </tr>
            ) : (
              rows.map((order) => (
                <tr key={order.id}>
                  <td>{order.customerName}</td>
                  <td>{order.orderDate}</td>
                  <td>{order.deliveryDate}</td>
                  <td>{order.warehouse}</td>
                  <td>
                    <span className={`ord-badge ord-badge--${order.status}`}>
                      {order.status}
                    </span>
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
