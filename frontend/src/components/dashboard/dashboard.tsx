import { useEffect, useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import "./dashboard.css";
import {
  fetchStockLevels,
  fetchStockMovements,
} from "../../services/stock-service";
import { fetchProducts } from "../../services/product-service";
import { fetchCustomerOrders } from "../../services/customerOrder-service";
import { fetchSupplierInvoices } from "../../services/invoice-service";
import { getApiErrorMessage } from "../../lib/apiError";
import type { WarehouseStock, StockMovement } from "../../types/stock";
import type { Product } from "../../types/product";
import type { CustomerOrder } from "../../types/order";
import type { SupplierInvoice } from "../../types/supplierInvoice";

interface ShipmentRow {
  id: string;
  supplierName: string;
  warehouseName: string;
  expectedDeliveryDate: string;
}

function computeUpcomingShipments(invoices: SupplierInvoice[]): ShipmentRow[] {
  const now = Date.now();
  return invoices
    .filter((inv) => inv.status === "confirmed" && inv.extractedDeliveryDate)
    .filter(
      (inv) => new Date(inv.extractedDeliveryDate as string).getTime() >= now,
    )
    .sort(
      (a, b) =>
        new Date(a.extractedDeliveryDate as string).getTime() -
        new Date(b.extractedDeliveryDate as string).getTime(),
    )
    .map((inv) => ({
      id: inv.id,
      supplierName: inv.extractedSupplierName ?? "Unknown supplier",
      warehouseName: inv.warehouse?.warehouseName ?? "Unknown warehouse",
      expectedDeliveryDate: inv.extractedDeliveryDate as string,
    }));
}

function orderTotal(order: CustomerOrder): number {
  return order.items.reduce(
    (sum, it) => sum + (Number(it.unitPrice) || 0) * it.quantity,
    0,
  );
}

function invoiceTotal(invoice: SupplierInvoice): number {
  return invoice.items.reduce(
    (sum, it) => sum + (Number(it.unitPrice) || 0) * it.quantity,
    0,
  );
}

function computeTotalRevenue(orders: CustomerOrder[]): number {
  return orders
    .filter((o) => o.status === "confirmed" || o.status === "delivered")
    .reduce((sum, o) => sum + orderTotal(o), 0);
}

function computeTotalSpend(invoices: SupplierInvoice[]): number {
  return invoices
    .filter((inv) => inv.status === "confirmed" || inv.status === "delivered")
    .reduce((sum, inv) => sum + invoiceTotal(inv), 0);
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
type BucketUnit = "day" | "week" | "month";

const RANGE_CONFIG: Record<Range, { count: number; unit: BucketUnit }> = {
  Day: { count: 7, unit: "day" },
  Week: { count: 6, unit: "week" },
  Month: { count: 6, unit: "month" },
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfWeek(d: Date): Date {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = day === 0 ? 6 : day - 1;
  x.setDate(x.getDate() - diff);
  return x;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addUnit(d: Date, unit: BucketUnit, n: number): Date {
  const x = new Date(d);
  if (unit === "day") x.setDate(x.getDate() + n);
  if (unit === "week") x.setDate(x.getDate() + 7 * n);
  if (unit === "month") x.setMonth(x.getMonth() + n);
  return x;
}

function bucketLabel(d: Date, unit: BucketUnit): string {
  if (unit === "month")
    return d.toLocaleDateString("en-US", { month: "short" });
  if (unit === "week")
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

interface RevenueSpendPoint {
  label: string;
  revenue: number;
  spend: number;
}

function computeRevenueSpendSeries(
  orders: CustomerOrder[],
  invoices: SupplierInvoice[],
  range: Range,
): RevenueSpendPoint[] {
  const { count, unit } = RANGE_CONFIG[range];
  const startFn =
    unit === "day" ? startOfDay : unit === "week" ? startOfWeek : startOfMonth;
  const anchor = startFn(new Date());

  const buckets: {
    start: Date;
    end: Date;
    label: string;
    revenue: number;
    spend: number;
  }[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const s = addUnit(anchor, unit, -i);
    const e = addUnit(s, unit, 1);
    buckets.push({
      start: s,
      end: e,
      label: bucketLabel(s, unit),
      revenue: 0,
      spend: 0,
    });
  }

  function addToBucket(
    dateStr: string | null,
    amount: number,
    key: "revenue" | "spend",
  ) {
    if (!dateStr) return;
    const d = new Date(dateStr);
    const bucket = buckets.find((b) => d >= b.start && d < b.end);
    if (bucket) bucket[key] += amount;
  }

  orders.forEach((o) => {
    if (o.status !== "confirmed" && o.status !== "delivered") return;
    addToBucket(o.confirmedAt, orderTotal(o), "revenue");
  });

  invoices.forEach((inv) => {
    if (inv.status !== "confirmed" && inv.status !== "delivered") return;
    addToBucket(inv.confirmedAt, invoiceTotal(inv), "spend");
  });

  return buckets.map((b) => ({
    label: b.label,
    revenue: Math.round(b.revenue * 100) / 100,
    spend: Math.round(b.spend * 100) / 100,
  }));
}

interface OrderStatusPoint {
  name: string;
  value: number;
}

function computeOrderStatusBreakdown(
  orders: CustomerOrder[],
): OrderStatusPoint[] {
  const counts = { Delivered: 0, Confirmed: 0, Pending: 0 };
  orders.forEach((o) => {
    if (o.status === "delivered") counts.Delivered += 1;
    else if (o.status === "confirmed") counts.Confirmed += 1;
    else if (o.status === "pending") counts.Pending += 1;
  });
  return [
    { name: "Delivered", value: counts.Delivered },
    { name: "Confirmed", value: counts.Confirmed },
    { name: "Pending", value: counts.Pending },
  ].filter((row) => row.value > 0);
}

const STATUS_COLORS: Record<string, string> = {
  Delivered: TEAL,
  Confirmed: TEAL_DARK,
  Pending: TEAL_LIGHT,
};

const SHIPMENTS_PAGE_SIZE = 3;
const DEAD_STOCK_OPTIONS = [30, 60, 90] as const;
const REPEAT_STOCKOUT_MIN_EVENTS = 2;
const SPIKE_MULTIPLIER = 2;

const CATEGORY_ORDER = [
  "water",
  "food",
  "healthcare",
  "electronics",
  "others",
] as const;
const CATEGORY_LABELS: Record<string, string> = {
  water: "Water",
  food: "Food",
  healthcare: "Healthcare",
  electronics: "Electronics",
  others: "Others",
};
const CATEGORY_COLORS: Record<string, string> = {
  water: "#6cc6d9",
  food: "#3ab5cc",
  healthcare: "#2a94a8",
  electronics: "#b2dde8",
  others: "#e2e8f0",
};

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

function computeRepeatStockouts(
  movements: StockMovement[],
): RepeatStockoutRow[] {
  const sorted = [...movements].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
  const balanceByKey = new Map<string, number>();
  const stockoutCountByProduct = new Map<string, number>();
  const nameByProduct = new Map<string, string>();

  sorted.forEach((m) => {
    const key = `${m.warehouseId}__${m.productId}`;
    const prevBalance = balanceByKey.get(key) ?? 0;
    const newBalance = prevBalance + m.quantityChange;
    balanceByKey.set(key, newBalance);

    if (m.product?.productName)
      nameByProduct.set(m.productId, m.product.productName);

    if (prevBalance > 0 && newBalance <= 0) {
      stockoutCountByProduct.set(
        m.productId,
        (stockoutCountByProduct.get(m.productId) ?? 0) + 1,
      );
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

    if (m.product?.productName)
      nameByProduct.set(m.productId, m.product.productName);

    if (age <= 7 * DAY_MS) {
      recentByProduct.set(
        m.productId,
        (recentByProduct.get(m.productId) ?? 0) + usage,
      );
    } else if (age <= 14 * DAY_MS) {
      previousByProduct.set(
        m.productId,
        (previousByProduct.get(m.productId) ?? 0) + usage,
      );
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

interface CategoryValueRow {
  category: string;
  value: number;
}

function computeCategoryValues(
  stock: WarehouseStock[],
  products: Product[],
): CategoryValueRow[] {
  const priceById = new Map(products.map((p) => [p.id, Number(p.price)]));
  const categoryById = new Map(products.map((p) => [p.id, p.category]));
  const valueByCategory = new Map<string, number>();

  stock.forEach((row) => {
    const price = priceById.get(row.productId) ?? 0;
    const category = categoryById.get(row.productId) ?? "others";
    const value = row.quantityOnHand * price;
    valueByCategory.set(category, (valueByCategory.get(category) ?? 0) + value);
  });

  return CATEGORY_ORDER.map((cat) => ({
    category: cat,
    value: valueByCategory.get(cat) ?? 0,
  })).filter((row) => row.value > 0);
}

interface WarehouseValueRow {
  warehouseName: string;
  value: number;
}

function computeWarehouseValues(
  stock: WarehouseStock[],
  products: Product[],
): WarehouseValueRow[] {
  const priceById = new Map(products.map((p) => [p.id, Number(p.price)]));
  const valueByWarehouse = new Map<string, number>();

  stock.forEach((row) => {
    const price = priceById.get(row.productId) ?? 0;
    const name = row.warehouse?.warehouseName ?? "Unknown";
    const value = row.quantityOnHand * price;
    valueByWarehouse.set(name, (valueByWarehouse.get(name) ?? 0) + value);
  });

  return Array.from(valueByWarehouse.entries())
    .map(([warehouseName, value]) => ({ warehouseName, value }))
    .sort((a, b) => b.value - a.value);
}

type AlertKey = "repeatStockouts" | "spikes";

export default function Dashboard() {
  const [stock, setStock] = useState<WarehouseStock[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showDeadStock, setShowDeadStock] = useState(false);
  const [deadStockDays, setDeadStockDays] = useState<number>(60);
  const [openAlert, setOpenAlert] = useState<AlertKey | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchStockLevels(),
      fetchStockMovements(),
      fetchProducts(),
      fetchCustomerOrders(),
      fetchSupplierInvoices(),
    ])
      .then(
        ([
          stockData,
          movementsData,
          productsData,
          ordersData,
          invoicesData,
        ]) => {
          if (cancelled) return;
          setStock(Array.isArray(stockData) ? stockData : []);
          setMovements(Array.isArray(movementsData) ? movementsData : []);
          setProducts(Array.isArray(productsData) ? productsData : []);
          setOrders(Array.isArray(ordersData) ? ordersData : []);
          setInvoices(Array.isArray(invoicesData) ? invoicesData : []);
        },
      )
      .catch((err) => {
        if (!cancelled) setLoadError(getApiErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoadingData(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const deadStockRows = useMemo(
    () => computeDeadStock(stock, movements, deadStockDays),
    [stock, movements, deadStockDays],
  );

  const repeatStockoutRows = useMemo(
    () => computeRepeatStockouts(movements),
    [movements],
  );
  const spikeRows = useMemo(
    () => computeConsumptionSpikes(movements),
    [movements],
  );

  const categoryValues = useMemo(
    () => computeCategoryValues(stock, products),
    [stock, products],
  );
  const warehouseValues = useMemo(
    () => computeWarehouseValues(stock, products),
    [stock, products],
  );

  const totalRevenue = useMemo(() => computeTotalRevenue(orders), [orders]);
  const totalSpend = useMemo(() => computeTotalSpend(invoices), [invoices]);
  const netValue = totalRevenue - totalSpend;

  const upcomingShipments = useMemo(
    () => computeUpcomingShipments(invoices),
    [invoices],
  );
  const orderStatusBreakdown = useMemo(
    () => computeOrderStatusBreakdown(orders),
    [orders],
  );

  const [range, setRange] = useState<Range>("Month");
  const [shipmentPage, setShipmentPage] = useState(0);

  const chartData = useMemo(
    () => computeRevenueSpendSeries(orders, invoices, range),
    [orders, invoices, range],
  );

  const shipmentPageCount = Math.max(
    1,
    Math.ceil(upcomingShipments.length / SHIPMENTS_PAGE_SIZE),
  );

  useEffect(() => {
    setShipmentPage((p) => Math.min(p, shipmentPageCount - 1));
  }, [shipmentPageCount]);

  const visibleShipments = upcomingShipments.slice(
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
          </div>
          <button
            className="dash-deadstock-btn"
            onClick={() => setShowDeadStock(true)}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 8 12 3 3 8l9 5 9-5Z" />
              <path d="M3 8v8l9 5 9-5V8" />
              <path d="M12 13v8" />
              <line x1="7" y1="10.5" x2="17" y2="10.5" />
            </svg>
            Dead Stock
          </button>
        </div>
      </div>

      {loadError && (
        <div
          style={{
            background: "#fdecea",
            color: "crimson",
            padding: "10px 16px",
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          {loadError}
        </div>
      )}

      <div className="dash-stat-grid">
        <div className="dash-stat-card">
          <span className="dash-stat-label">Total Revenue</span>
          <span className="dash-stat-value">
            {loadingData ? "…" : formatCurrency(totalRevenue)}
          </span>
        </div>
        <div className="dash-stat-card">
          <span className="dash-stat-label">Total Spend</span>
          <span className="dash-stat-value">
            {loadingData ? "…" : formatCurrency(totalSpend)}
          </span>
        </div>
        <div className="dash-stat-card">
          <span className="dash-stat-label">Net Value</span>
          <span
            className={`dash-stat-value ${netValue >= 0 ? "dash-stat-value--positive" : "dash-stat-value--negative"}`}
          >
            {loadingData ? "…" : formatCurrency(netValue)}
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
              onClick={() =>
                setShipmentPage((p) => Math.min(shipmentPageCount - 1, p + 1))
              }
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
                  {loadingData ? "Loading…" : "No upcoming shipments."}
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
              <AreaChart
                data={chartData}
                margin={{ left: -18, right: 8, top: 4 }}
              >
                <defs>
                  <linearGradient id="dashRevFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={TEAL} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={TEAL} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient
                    id="dashSpendFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={TEAL_DARK}
                      stopOpacity={0.15}
                    />
                    <stop offset="100%" stopColor={TEAL_DARK} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={GRID_LINE}
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: AXIS_SUB }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: AXIS_SUB }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={TEAL}
                  strokeWidth={2.5}
                  fill="url(#dashRevFill)"
                />
                <Area
                  type="monotone"
                  dataKey="spend"
                  stroke={TEAL_DARK}
                  strokeWidth={2}
                  fill="url(#dashSpendFill)"
                  strokeDasharray="4 3"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card-header">
            <div className="dash-card-title">Orders by status</div>
          </div>
          <div className="dash-card-body">
            {orderStatusBreakdown.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 0",
                  color: "var(--text-muted)",
                  fontSize: 14,
                }}
              >
                {loadingData ? "Loading…" : "No orders yet."}
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={orderStatusBreakdown}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={56}
                      outerRadius={86}
                      paddingAngle={3}
                    >
                      {orderStatusBreakdown.map((row) => (
                        <Cell key={row.name} fill={STATUS_COLORS[row.name]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="dash-legend">
                  {orderStatusBreakdown.map((e) => (
                    <div key={e.name} className="dash-legend-item">
                      <span
                        className="dash-legend-dot"
                        style={{ background: STATUS_COLORS[e.name] }}
                      />
                      {e.name}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="dash-charts">
        <div className="dash-card">
          <div className="dash-card-header">
            <div className="dash-card-title">Inventory value by warehouse</div>
          </div>
          <div className="dash-card-body">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={warehouseValues}
                layout="vertical"
                margin={{ left: 8, right: 16, top: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={GRID_LINE}
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12, fill: AXIS_SUB }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <YAxis
                  type="category"
                  dataKey="warehouseName"
                  tick={{ fontSize: 12, fill: AXIS_SUB }}
                  axisLine={false}
                  tickLine={false}
                  width={100}
                />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Bar
                  dataKey="value"
                  fill={TEAL}
                  radius={[0, 4, 4, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card-header">
            <div className="dash-card-title">Stock value by category</div>
          </div>
          <div className="dash-card-body">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={categoryValues}
                  dataKey="value"
                  nameKey="category"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {categoryValues.map((row) => (
                    <Cell
                      key={row.category}
                      fill={CATEGORY_COLORS[row.category]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
            <div className="dash-legend">
              {categoryValues.map((row) => (
                <div key={row.category} className="dash-legend-item">
                  <span
                    className="dash-legend-dot"
                    style={{ background: CATEGORY_COLORS[row.category] }}
                  />
                  {CATEGORY_LABELS[row.category]}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="dash-alerts-section">
        <h2 className="dash-alerts-title">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Stock Alerts
        </h2>

        <div
          className={`dash-alert-card ${repeatStockoutRows.length > 0 ? "dash-alert-card--active" : ""}`}
        >
          <div
            className="dash-alert-row"
            onClick={() => toggleAlert("repeatStockouts")}
          >
            <div className="dash-alert-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 3v18h18" />
                <path d="M7 15l4-5 3 3 5-7" />
              </svg>
            </div>
            <div className="dash-alert-body">
              <div className="dash-alert-name">Repeat Stockouts</div>
              <div className="dash-alert-desc">
                Products that keep running out ({REPEAT_STOCKOUT_MIN_EVENTS}+
                times)
              </div>
            </div>
            <span className="dash-alert-count">
              {loadingData ? "…" : repeatStockoutRows.length}
            </span>
            <svg
              className={`dash-alert-chevron ${openAlert === "repeatStockouts" ? "dash-alert-chevron--open" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
          {openAlert === "repeatStockouts" && (
            <div className="dash-alert-detail">
              {repeatStockoutRows.length === 0 ? (
                <div className="dash-alert-detail-empty">
                  No products repeatedly running out.
                </div>
              ) : (
                repeatStockoutRows.slice(0, 5).map((row, i) => (
                  <div key={i} className="dash-alert-detail-row">
                    <span className="dash-alert-detail-name">
                      {row.productName}
                    </span>
                    <span className="dash-alert-detail-meta">
                      {row.stockoutCount} stockouts
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div
          className={`dash-alert-card ${spikeRows.length > 0 ? "dash-alert-card--active" : ""}`}
        >
          <div className="dash-alert-row" onClick={() => toggleAlert("spikes")}>
            <div className="dash-alert-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
            <div className="dash-alert-body">
              <div className="dash-alert-name">Consumption Spikes</div>
              <div className="dash-alert-desc">
                Usage {SPIKE_MULTIPLIER}x+ above last week's pace
              </div>
            </div>
            <span className="dash-alert-count">
              {loadingData ? "…" : spikeRows.length}
            </span>
            <svg
              className={`dash-alert-chevron ${openAlert === "spikes" ? "dash-alert-chevron--open" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
          {openAlert === "spikes" && (
            <div className="dash-alert-detail">
              {spikeRows.length === 0 ? (
                <div className="dash-alert-detail-empty">
                  No unusual consumption spikes detected.
                </div>
              ) : (
                spikeRows.slice(0, 5).map((row, i) => (
                  <div key={i} className="dash-alert-detail-row">
                    <span className="dash-alert-detail-name">
                      {row.productName}
                    </span>
                    <span className="dash-alert-detail-meta">
                      {row.multiplier}x usual pace
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {showDeadStock && (
        <div
          className="dash-modal-overlay"
          onClick={() => setShowDeadStock(false)}
        >
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
              <button
                className="dash-modal-close"
                onClick={() => setShowDeadStock(false)}
                aria-label="Close"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="dash-modal-body">
              {deadStockRows.length === 0 ? (
                <div className="dash-deadstock-empty">
                  No dead stock — everything has moved within the last{" "}
                  {deadStockDays} days.
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
                        <td style={{ fontWeight: 600 }}>
                          {row.quantityOnHand}
                        </td>
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
