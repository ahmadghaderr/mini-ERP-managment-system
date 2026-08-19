import { useState } from "react";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
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
  {
    id: "ship-4",
    supplierName: "Cedar Imports",
    warehouseName: "Main Warehouse",
    expectedDeliveryDate: "2026-08-23",
  },
  {
    id: "ship-5",
    supplierName: "BlueWave Foods",
    warehouseName: "North Branch",
    expectedDeliveryDate: "2026-08-24",
  },
  {
    id: "ship-6",
    supplierName: "Sunrise Produce",
    warehouseName: "South Hub",
    expectedDeliveryDate: "2026-08-25",
  },
  {
    id: "ship-7",
    supplierName: "MetroPack Ltd.",
    warehouseName: "Main Warehouse",
    expectedDeliveryDate: "2026-08-27",
  },
  {
    id: "ship-8",
    supplierName: "GreenLeaf Co.",
    warehouseName: "North Branch",
    expectedDeliveryDate: "2026-08-28",
  },
  {
    id: "ship-9",
    supplierName: "Orient Traders",
    warehouseName: "South Hub",
    expectedDeliveryDate: "2026-08-30",
  },
  {
    id: "ship-10",
    supplierName: "Delta Supplies",
    warehouseName: "Main Warehouse",
    expectedDeliveryDate: "2026-09-01",
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

const TEAL = "#3ab5cc";
const TEAL_DARK = "#2a94a8";
const TEAL_LIGHT = "#b2dde8";
const GRID_LINE = "#edf2f7";
const AXIS_SUB = "#718096";

type Range = "Day" | "Week" | "Month";

const revenueByRange: Record<Range, { label: string; revenue: number; spend: number }[]> = {
  Day: [
    { label: "9a", revenue: 120, spend: 90 },
    { label: "11a", revenue: 180, spend: 130 },
    { label: "1p", revenue: 240, spend: 150 },
    { label: "3p", revenue: 200, spend: 170 },
    { label: "5p", revenue: 290, spend: 190 },
    { label: "7p", revenue: 320, spend: 210 },
  ],
  Week: [
    { label: "Mon", revenue: 640, spend: 420 },
    { label: "Tue", revenue: 720, spend: 500 },
    { label: "Wed", revenue: 810, spend: 540 },
    { label: "Thu", revenue: 690, spend: 520 },
    { label: "Fri", revenue: 940, spend: 610 },
    { label: "Sat", revenue: 1010, spend: 700 },
    { label: "Sun", revenue: 880, spend: 640 },
  ],
  Month: [
    { label: "Mar", revenue: 820, spend: 610 },
    { label: "Apr", revenue: 940, spend: 680 },
    { label: "May", revenue: 1010, spend: 720 },
    { label: "Jun", revenue: 890, spend: 700 },
    { label: "Jul", revenue: 1120, spend: 810 },
    { label: "Aug", revenue: 1177, spend: 867 },
  ],
};

const orderStatus = [
  { name: "Delivered", value: 42 },
  { name: "Confirmed", value: 18 },
  { name: "Pending", value: 9 },
];
const PIE_COLORS = [TEAL, TEAL_DARK, TEAL_LIGHT];

const SHIPMENTS_PAGE_SIZE = 3;

export default function Dashboard() {
  const userJson = localStorage.getItem("currentUser");
  const user = userJson ? JSON.parse(userJson) : null;

  const totalRevenue = getTotalRevenue();
  const totalSpend = getTotalSpend();
  const netValue = totalRevenue - totalSpend;
  const totalInventoryValue = getTotalInventoryValue();

  const [range, setRange] = useState<Range>("Month");
  const [shipmentPage, setShipmentPage] = useState(0);

  const chartData = revenueByRange[range];
  const shipmentPageCount = Math.ceil(mockUpcomingShipments.length / SHIPMENTS_PAGE_SIZE);
  const visibleShipments = mockUpcomingShipments.slice(
    shipmentPage * SHIPMENTS_PAGE_SIZE,
    shipmentPage * SHIPMENTS_PAGE_SIZE + SHIPMENTS_PAGE_SIZE,
  );

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
          <div className="dash-pager">
            <span className="dash-pager-info">
              Page {shipmentPage + 1} of {shipmentPageCount}
            </span>
            <button
              type="button"
              onClick={() => setShipmentPage((p) => Math.max(0, p - 1))}
              disabled={shipmentPage === 0}
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setShipmentPage((p) => Math.min(shipmentPageCount - 1, p + 1))}
              disabled={shipmentPage >= shipmentPageCount - 1}
            >
              ›
            </button>
          </div>
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
            {visibleShipments.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ textAlign: "center", padding: 20 }}>
                  No upcoming shipments.
                </td>
              </tr>
            ) : (
              visibleShipments.map((shipment) => (
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

      <div className="dash-charts">
        <div className="dash-card">
          <div className="dash-card-header">
            <div className="dash-card-title">Revenue vs Spend</div>
            <div className="dash-toggle">
              {(["Day", "Week", "Month"] as Range[]).map((o) => (
                <button
                  key={o}
                  className={range === o ? "is-active" : ""}
                  onClick={() => setRange(o)}
                  type="button"
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
          <div className="dash-card-body">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartData} margin={{ left: -18, right: 8, top: 4 }}>
                <defs>
                  <linearGradient id="dashRevFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={TEAL} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={TEAL} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="dashSpendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={TEAL_DARK} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={TEAL_DARK} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_LINE} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: AXIS_SUB }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: AXIS_SUB }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke={TEAL} strokeWidth={2.5} fill="url(#dashRevFill)" />
                <Area type="monotone" dataKey="spend" stroke={TEAL_DARK} strokeWidth={2} fill="url(#dashSpendFill)" strokeDasharray="4 3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card-header">
            <div className="dash-card-title">Orders by status</div>
          </div>
          <div className="dash-card-body">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={orderStatus} dataKey="value" nameKey="name" innerRadius={56} outerRadius={86} paddingAngle={3}>
                  {orderStatus.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="dash-legend">
              {orderStatus.map((e, i) => (
                <div key={i} className="dash-legend-item">
                  <span className="dash-legend-dot" style={{ background: PIE_COLORS[i] }} />
                  {e.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
