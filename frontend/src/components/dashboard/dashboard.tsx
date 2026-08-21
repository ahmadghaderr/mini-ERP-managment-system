import { useEffect, useMemo, useState } from "react";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import "./dashboard.css";
import { fetchStockLevels, fetchStockMovements } from "../../services/stock-service";
import { fetchProducts } from "../../services/product-service";
import type { WarehouseStock, StockMovement } from "../../types/stock";
import type { Product } from "../../types/product";

interface ShipmentRow {
  id: string;
  supplierName: string;
  warehouseName: string;
  expectedDeliveryDate: string;
}

// TODO: no backend endpoint yet aggregates "upcoming shipments" —
// could be derived from confirmed supplier invoices with a future
// extractedDeliveryDate once that's needed for real.
const mockUpcomingShipments: ShipmentRow[] = [
  { id: "ship-1", supplierName: "Global Foods Co.", warehouseName: "Main Warehouse", expectedDeliveryDate: "2026-08-16" },
  { id: "ship-2", supplierName: "AquaPure Supplies", warehouseName: "North Branch", expectedDeliveryDate: "2026-08-18" },
  { id: "ship-3", supplierName: "Harvest Distributors", warehouseName: "South Hub", expectedDeliveryDate: "2026-08-22" },
  { id: "ship-4", supplierName: "Cedar Imports", warehouseName: "Main Warehouse", expectedDeliveryDate: "2026-08-23" },
  { id: "ship-5", supplierName: "BlueWave Foods", warehouseName: "North Branch", expectedDeliveryDate: "2026-08-24" },
  { id: "ship-6", supplierName: "Sunrise Produce", warehouseName: "South Hub", expectedDeliveryDate: "2026-08-25" },
  { id: "ship-7", supplierName: "MetroPack Ltd.", warehouseName: "Main Warehouse", expectedDeliveryDate: "2026-08-27" },
  { id: "ship-8", supplierName: "GreenLeaf Co.", warehouseName: "North Branch", expectedDeliveryDate: "2026-08-28" },
  { id: "ship-9", supplierName: "Orient Traders", warehouseName: "South Hub", expectedDeliveryDate: "2026-08-30" },
  { id: "ship-10", supplierName: "Delta Supplies", warehouseName: "Main Warehouse", expectedDeliveryDate: "2026-09-01" },
];

// TODO: no backend endpoint aggregates revenue/spend across confirmed
// invoices and orders yet — illustrative mock figures until that
// reporting endpoint exists.
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
  return mockCompletedSales.reduce((sum, s) => sum + s.quantity * s.unitPrice, 0);
}

function getTotalSpend(): number {
  return mockApprovedPurchases.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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
const DEAD_STOCK_OPTIONS = [30, 60, 90] as const;
const DEAD_STOCK_ALERT_THRESHOLD_DAYS = 60;
const REPEAT_STOCKOUT_MIN_EVENTS = 2;
const SPIKE_MULTIPLIER = 2;

interface DeadStockRow {
  productName: string;
  warehouseName: string;
  quantityOnHand: number;
  lastMovementDate: string | null;
  daysSince: number | null;
}

function computeDeadStock(
  stock: WarehouseStock[],
  movements: StockMovement[],
  cutoffDays: number,
): DeadStockRow[] {
  const latestMovement = new Map<string, string>();
  movements.forEach((m) => {
    const key = `${m.warehouseId}__${m.productId}`;
    const existing = latestMovement.get(key);
    if (!existing || m.createdAt > existing) {
      latestMovement.set(key, m.createdAt);
    }
  });

  const now = Date.now();
  const cutoffMs = cutoffDays * 24 * 60 * 60 * 1000;
  const rows: DeadStockRow[] = [];

  stock.forEach((row) => {
    if (row.quantityOnHand <= 0) return;
    const key = `${row.warehouseId}__${row.productId}`;
    const lastDate = latestMovement.get(key) ?? null;

    let daysSince: number | null = null;
    let isDead = false;

    if (!lastDate) {
      isDead = true;
    } else {
      const diffMs = now - new Date(lastDate).getTime();
      daysSince = Math.floor(diffMs / (24 * 60 * 60 * 1000));
      if (diffMs >= cutoffMs) isDead = true;
    }

    if (isDead) {
      rows.push({
        productName: row.product?.productName ?? "Unknown product",
        warehouseName: row.warehouse?.warehouseName ?? "Unknown warehouse",
        quantityOnHand: row.quantityOnHand,
        lastMovementDate: lastDate,
        daysSince,
      });
    }
  });

  return rows.sort((a, b) => (b.daysSince ?? 999999) - (a.daysSince ?? 999999));
}

interface RepeatStockoutRow {
  productName: string;
  stockoutCount: number;
}

// NOTE: reconstructs a running balance per product from movement history
// starting at 0 (no true "opening stock" snapshot exists). This is an
// approximation good enough to flag repeat-stockout patterns, but the
// exact count may be slightly off if movements predate this table's
// earliest recorded entry.
function computeRepeatStockouts(movements: StockMovement[]): RepeatStockoutRow[] {
  const sorted = [...movements].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const balanceByKey = new Map<string, number>();
  const stockoutCountByProduct = new Map<string, number>();
  const nameByProduct = new Map<string, string>();

  sorted.forEach((m) => {
    const key = `${m.warehouseId}__${m.productId}`;
    const prevBalance = balanceByKey.get(key) ?? 0;
    const newBalance = prevBalance + m.quantityChange;
    balanceByKey.set(key, newBalance);

    if (m.product?.productName) nameByProduct.set(m.productId, m.product.productName);

    if (prevBalance > 0 && newBalance <= 0) {
      stockoutCountByProduct.set(m.productId, (stockoutCountByProduct.get(m.productId) ?? 0) + 1);
    }
  });

  const rows: RepeatStockoutRow[] = [];
  stockoutCountByProduct.forEach((count, productId) => {
    if (count >= REPEAT_STOCKOUT_MIN_EVENTS) {
      rows.push({
        productName: nameByProduct.get(productId) ?? "Unknown product",
        stockoutCount: count,
      });
    }
  });

  return rows.sort((a, b) => b.stockoutCount - a.stockoutCount);
}

interface SpikeRow {
  productName: string;
  recentUsage: number;
  previousUsage: number;
  multiplier: number;
}

function computeConsumptionSpikes(movements: StockMovement[]): SpikeRow[] {
  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;
  const recentByProduct = new Map<string, number>();
  const previousByProduct = new Map<string, number>();
  const nameByProduct = new Map<string, string>();

  movements.forEach((m) => {
    if (m.quantityChange >= 0) return;
    const usage = Math.abs(m.quantityChange);
    const age = now - new Date(m.createdAt).getTime();

    if (m.product?.productName) nameByProduct.set(m.productId, m.product.productName);

    if (age <= 7 * DAY_MS) {
      recentByProduct.set(m.productId, (recentByProduct.get(m.productId) ?? 0) + usage);
    } else if (age <= 14 * DAY_MS) {
      previousByProduct.set(m.productId, (previousByProduct.get(m.productId) ?? 0) + usage);
    }
  });

  const rows: SpikeRow[] = [];
  recentByProduct.forEach((recentUsage, productId) => {
    const previousUsage = previousByProduct.get(productId) ?? 0;
    if (previousUsage > 0 && recentUsage >= previousUsage * SPIKE_MULTIPLIER) {
      rows.push({
        productName: nameByProduct.get(productId) ?? "Unknown product",
        recentUsage,
        previousUsage,
        multiplier: Math.round((recentUsage / previousUsage) * 10) / 10,
      });
    }
  });

  return rows.sort((a, b) => b.multiplier - a.multiplier);
}

type AlertKey = "deadStock" | "repeatStockouts" | "spikes";

export default function Dashboard() {
  const userJson = localStorage.getItem("currentUser");
  const user = userJson ? JSON.parse(userJson) : null;

  const [stock, setStock] = useState<WarehouseStock[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [showDeadStock, setShowDeadStock] = useState(false);
  const [deadStockDays, setDeadStockDays] = useState<number>(60);
  const [openAlert, setOpenAlert] = useState<AlertKey | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchStockLevels(), fetchStockMovements(), fetchProducts()])
      .then(([stockData, movementsData, productsData]) => {
        if (cancelled) return;
        setStock(stockData);
        setMovements(movementsData);
        setProducts(productsData);
      })
      .finally(() => {
        if (!cancelled) setLoadingData(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const totalInventoryValue = useMemo(() => {
    const priceById = new Map(products.map((p) => [p.id, Number(p.price)]));
    return stock.reduce((sum, row) => sum + row.quantityOnHand * (priceById.get(row.productId) ?? 0), 0);
  }, [stock, products]);

  const deadStockRows = useMemo(
    () => computeDeadStock(stock, movements, deadStockDays),
    [stock, movements, deadStockDays],
  );

  const deadStockAlertCount = useMemo(
    () => computeDeadStock(stock, movements, DEAD_STOCK_ALERT_THRESHOLD_DAYS).length,
    [stock, movements],
  );

  const repeatStockoutRows = useMemo(() => computeRepeatStockouts(movements), [movements]);
  const spikeRows = useMemo(() => computeConsumptionSpikes(movements), [movements]);

  const totalRevenue = getTotalRevenue();
  const totalSpend = getTotalSpend();
  const netValue = totalRevenue - totalSpend;

  const [range, setRange] = useState<Range>("Month");
  const [shipmentPage, setShipmentPage] = useState(0);

  const chartData = revenueByRange[range];
  const shipmentPageCount = Math.ceil(mockUpcomingShipments.length / SHIPMENTS_PAGE_SIZE);
  const visibleShipments = mockUpcomingShipments.slice(
    shipmentPage * SHIPMENTS_PAGE_SIZE,
    shipmentPage * SHIPMENTS_PAGE_SIZE + SHIPMENTS_PAGE_SIZE,
  );

  function toggleAlert(key: AlertKey) {
    setOpenAlert((prev) => (prev === key ? null : key));
  }

  return (
    <div className="dash-pg">
      <div className="dash-pg-head">
        <div className="dash-header-row">
          <div>
            <div className="dash-pg-title">Dashboard</div>
            <p className="dash-pg-subtitle">Welcome back, {user?.fullName}.</p>
          </div>
          <button className="dash-deadstock-btn" onClick={() => setShowDeadStock(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 8 12 3 3 8l9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" />
              <line x1="7" y1="10.5" x2="17" y2="10.5" />
            </svg>
            Dead Stock
          </button>
        </div>
      </div>

      <div className="dash-stat-grid">
        <div className="dash-stat-card">
          <span className="dash-stat-label">Total Revenue</span>
          <span className="dash-stat-value">{formatCurrency(totalRevenue)}</span>
        </div>
        <div className="dash-stat-card">
          <span className="dash-stat-label">Total Spend</span>
          <span className="dash-stat-value">{formatCurrency(totalSpend)}</span>
        </div>
        <div className="dash-stat-card">
          <span className="dash-stat-label">Net Value</span>
          <span className={`dash-stat-value ${netValue >= 0 ? "dash-stat-value--positive" : "dash-stat-value--negative"}`}>
            {formatCurrency(netValue)}
          </span>
        </div>
        <div className="dash-stat-card">
          <span className="dash-stat-label">Total Inventory Value</span>
          <span className="dash-stat-value">{loadingData ? "…" : formatCurrency(totalInventoryValue)}</span>
        </div>
      </div>

      <div className="dash-card">
        <div className="dash-card-header">
          <div className="dash-card-title">Upcoming Shipments</div>
          <div className="dash-pager">
            <span className="dash-pager-info">
              Page {shipmentPage + 1} of {shipmentPageCount}
            </span>
            <button type="button" onClick={() => setShipmentPage((p) => Math.max(0, p - 1))} disabled={shipmentPage === 0}>
              ‹
            </button>
            <button type="button" onClick={() => setShipmentPage((p) => Math.min(shipmentPageCount - 1, p + 1))} disabled={shipmentPage >= shipmentPageCount - 1}>
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
                <button key={o} className={range === o ? "is-active" : ""} onClick={() => setRange(o)} type="button">
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

      <div className="dash-alerts-section">
        <h2 className="dash-alerts-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Stock Alerts
        </h2>

        <div className={`dash-alert-card ${deadStockAlertCount > 0 ? "dash-alert-card--active" : ""}`}>
          <div className="dash-alert-row" onClick={() => toggleAlert("deadStock")}>
            <div className="dash-alert-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div className="dash-alert-body">
              <div className="dash-alert-name">Dead Stock</div>
              <div className="dash-alert-desc">Items with no movement in {DEAD_STOCK_ALERT_THRESHOLD_DAYS}+ days</div>
            </div>
            <span className="dash-alert-count">{loadingData ? "…" : deadStockAlertCount}</span>
            <svg className={`dash-alert-chevron ${openAlert === "deadStock" ? "dash-alert-chevron--open" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
          {openAlert === "deadStock" && (
            <div className="dash-alert-detail">
              {deadStockAlertCount === 0 ? (
                <div className="dash-alert-detail-empty">No dead stock right now — nice.</div>
              ) : (
                <>
                  {computeDeadStock(stock, movements, DEAD_STOCK_ALERT_THRESHOLD_DAYS).slice(0, 5).map((row, i) => (
                    <div key={i} className="dash-alert-detail-row">
                      <span className="dash-alert-detail-name">{row.productName} — {row.warehouseName}</span>
                      <span className="dash-alert-detail-meta">
                        {row.daysSince === null ? "Never moved" : `${row.daysSince}d ago`}
                      </span>
                    </div>
                  ))}
                  <div style={{ marginTop: 10 }}>
                    <button
                      className="stk-link-btn"
                      onClick={() => {
                        setDeadStockDays(DEAD_STOCK_ALERT_THRESHOLD_DAYS);
                        setShowDeadStock(true);
                      }}
                    >
                      View all in Dead Stock →
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className={`dash-alert-card ${repeatStockoutRows.length > 0 ? "dash-alert-card--active" : ""}`}>
          <div className="dash-alert-row" onClick={() => toggleAlert("repeatStockouts")}>
            <div className="dash-alert-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" /><path d="M7 15l4-5 3 3 5-7" />
              </svg>
            </div>
            <div className="dash-alert-body">
              <div className="dash-alert-name">Repeat Stockouts</div>
              <div className="dash-alert-desc">Products that keep running out ({REPEAT_STOCKOUT_MIN_EVENTS}+ times)</div>
            </div>
            <span className="dash-alert-count">{loadingData ? "…" : repeatStockoutRows.length}</span>
            <svg className={`dash-alert-chevron ${openAlert === "repeatStockouts" ? "dash-alert-chevron--open" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
          {openAlert === "repeatStockouts" && (
            <div className="dash-alert-detail">
              {repeatStockoutRows.length === 0 ? (
                <div className="dash-alert-detail-empty">No products repeatedly running out.</div>
              ) : (
                repeatStockoutRows.slice(0, 5).map((row, i) => (
                  <div key={i} className="dash-alert-detail-row">
                    <span className="dash-alert-detail-name">{row.productName}</span>
                    <span className="dash-alert-detail-meta">{row.stockoutCount} stockouts</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className={`dash-alert-card ${spikeRows.length > 0 ? "dash-alert-card--active" : ""}`}>
          <div className="dash-alert-row" onClick={() => toggleAlert("spikes")}>
            <div className="dash-alert-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
            <div className="dash-alert-body">
              <div className="dash-alert-name">Consumption Spikes</div>
              <div className="dash-alert-desc">Usage {SPIKE_MULTIPLIER}x+ above last week's pace</div>
            </div>
            <span className="dash-alert-count">{loadingData ? "…" : spikeRows.length}</span>
            <svg className={`dash-alert-chevron ${openAlert === "spikes" ? "dash-alert-chevron--open" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
          {openAlert === "spikes" && (
            <div className="dash-alert-detail">
              {spikeRows.length === 0 ? (
                <div className="dash-alert-detail-empty">No unusual consumption spikes detected.</div>
              ) : (
                spikeRows.slice(0, 5).map((row, i) => (
                  <div key={i} className="dash-alert-detail-row">
                    <span className="dash-alert-detail-name">{row.productName}</span>
                    <span className="dash-alert-detail-meta">{row.multiplier}x usual pace</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {showDeadStock && (
        <div className="dash-modal-overlay" onClick={() => setShowDeadStock(false)}>
          <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dash-modal-header">
              <div className="dash-modal-title">Dead Stock</div>
              <div className="dash-toggle">
                {DEAD_STOCK_OPTIONS.map((d) => (
                  <button
                    key={d}
                    className={deadStockDays === d ? "is-active" : ""}
                    onClick={() => setDeadStockDays(d)}
                    type="button"
                  >
                    {d}d
                  </button>
                ))}
              </div>
              <button className="dash-modal-close" onClick={() => setShowDeadStock(false)} aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="dash-modal-body">
              {deadStockRows.length === 0 ? (
                <div className="dash-deadstock-empty">
                  No dead stock — everything has moved within the last {deadStockDays} days.
                </div>
              ) : (
                <table className="dash-tbl">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Warehouse</th>
                      <th>Qty on Hand</th>
                      <th>Last Movement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deadStockRows.map((row, i) => (
                      <tr key={i}>
                        <td>{row.productName}</td>
                        <td>{row.warehouseName}</td>
                        <td style={{ fontWeight: 600 }}>{row.quantityOnHand}</td>
                        <td>
                          {row.daysSince === null
                            ? "Never moved"
                            : `${row.daysSince} day${row.daysSince === 1 ? "" : "s"} ago`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}