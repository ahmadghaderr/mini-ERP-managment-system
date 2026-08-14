import "./dashboard.css";
import { mockLedgerEntries } from "../stock/ledger";
import { computeStockLevels } from "../stock/stock-utils";

interface ShipmentRow {
  id: string;
  supplierName: string;
  warehouseName: string;
  expectedDeliveryDate: string;
}

const mockUpcomingShipments: ShipmentRow[] = [
  {
    id: "ship-1",
    supplierName: "Global Foods Co.",
    warehouseName: "Main Warehouse",
    expectedDeliveryDate: "2026-08-16",
  },
  {
    id: "ship-2",
    supplierName: "AquaPure Supplies",
    warehouseName: "North Branch",
    expectedDeliveryDate: "2026-08-18",
  },
  {
    id: "ship-3",
    supplierName: "Harvest Distributors",
    warehouseName: "South Hub",
    expectedDeliveryDate: "2026-08-22",
  },
];

const mockProductPrices: Record<string, number> = {
  "Bottled Water 500ml": 0.5,
  "Canned Beans": 1.2,
  "Rice 1kg": 2.1,
  water: 0.5,
};

const mockCompletedSales = [
  { productName: "Bottled Water 500ml", quantity: 500, unitPrice: 0.75 },
  { productName: "Canned Beans", quantity: 220, unitPrice: 1.8 },
  { productName: "Rice 1kg", quantity: 140, unitPrice: 2.9 },
];

const mockApprovedPurchases = [
  { productName: "Bottled Water 500ml", quantity: 600, unitPrice: 0.45 },
  { productName: "Canned Beans", quantity: 260, unitPrice: 1.05 },
  { productName: "Rice 1kg", quantity: 180, unitPrice: 1.8 },
];

function getTotalRevenue(): number {
  return mockCompletedSales.reduce(
    (sum, s) => sum + s.quantity * s.unitPrice,
    0,
  );
}

function getTotalSpend(): number {
  return mockApprovedPurchases.reduce(
    (sum, p) => sum + p.quantity * p.unitPrice,
    0,
  );
}

function getTotalInventoryValue(): number {
  const stockLevels = computeStockLevels(mockLedgerEntries);
  return stockLevels.reduce((sum, row) => {
    const price = mockProductPrices[row.productName] ?? 0;
    return sum + row.quantity * price;
  }, 0);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Dashboard() {
  const userJson = localStorage.getItem("currentUser");
  const user = userJson ? JSON.parse(userJson) : null;

  const totalRevenue = getTotalRevenue();
  const totalSpend = getTotalSpend();
  const netValue = totalRevenue - totalSpend;
  const totalInventoryValue = getTotalInventoryValue();

  return (
    <div className="dash-pg">
      <div className="dash-pg-head">
        <div>
          <div className="dash-pg-title">Dashboard</div>
          <p className="dash-pg-subtitle">Welcome back, {user?.fullName}.</p>
        </div>
      </div>

      <div className="dash-stat-grid">
        <div className="dash-stat-card">
          <span className="dash-stat-label">Total Revenue</span>
          <span className="dash-stat-value">
            {formatCurrency(totalRevenue)}
          </span>
        </div>
        <div className="dash-stat-card">
          <span className="dash-stat-label">Total Spend</span>
          <span className="dash-stat-value">{formatCurrency(totalSpend)}</span>
        </div>
        <div className="dash-stat-card">
          <span className="dash-stat-label">Net Value</span>
          <span
            className={`dash-stat-value ${netValue >= 0 ? "dash-stat-value--positive" : "dash-stat-value--negative"}`}
          >
            {formatCurrency(netValue)}
          </span>
        </div>
        <div className="dash-stat-card">
          <span className="dash-stat-label">Total Inventory Value</span>
          <span className="dash-stat-value">
            {formatCurrency(totalInventoryValue)}
          </span>
        </div>
      </div>

      <div className="dash-card">
        <div className="dash-card-header">
          <div className="dash-card-title">Upcoming Shipments</div>
        </div>
        <table className="dash-tbl">
          <thead>
            <tr>
              <th>Supplier</th>
              <th>Warehouse</th>
              <th style={{ width: 140 }}>Expected Date</th>
            </tr>
          </thead>
          <tbody>
            {mockUpcomingShipments.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ textAlign: "center", padding: 20 }}>
                  No upcoming shipments.
                </td>
              </tr>
            ) : (
              mockUpcomingShipments.map((shipment) => (
                <tr key={shipment.id}>
                  <td>{shipment.supplierName}</td>
                  <td>{shipment.warehouseName}</td>
                  <td>{formatDate(shipment.expectedDeliveryDate)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
