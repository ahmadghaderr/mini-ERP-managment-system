import { useState } from 'react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import './Dashboard.css';

// pull the chart accent from the sidebar navy. If your theme exposes it as a
// CSS var you can read it, but recharts needs a real color string, so we set it here.
const NAVY = '#1e293b';
const LINE = '#edf2f7';
const SUB = '#718096';

type Range = 'Day' | 'Week' | 'Month';

// TODO: replace with real data from the backend once connected
const revenueByRange: Record<Range, { label: string; revenue: number; spend: number }[]> = {
  Day: [
    { label: '9a', revenue: 120, spend: 90 },
    { label: '11a', revenue: 180, spend: 130 },
    { label: '1p', revenue: 240, spend: 150 },
    { label: '3p', revenue: 200, spend: 170 },
    { label: '5p', revenue: 290, spend: 190 },
    { label: '7p', revenue: 320, spend: 210 },
  ],
  Week: [
    { label: 'Mon', revenue: 640, spend: 420 },
    { label: 'Tue', revenue: 720, spend: 500 },
    { label: 'Wed', revenue: 810, spend: 540 },
    { label: 'Thu', revenue: 690, spend: 520 },
    { label: 'Fri', revenue: 940, spend: 610 },
    { label: 'Sat', revenue: 1010, spend: 700 },
    { label: 'Sun', revenue: 880, spend: 640 },
  ],
  Month: [
    { label: 'Mar', revenue: 820, spend: 610 },
    { label: 'Apr', revenue: 940, spend: 680 },
    { label: 'May', revenue: 1010, spend: 720 },
    { label: 'Jun', revenue: 890, spend: 700 },
    { label: 'Jul', revenue: 1120, spend: 810 },
    { label: 'Aug', revenue: 1177, spend: 867 },
  ],
};

const orderStatus = [
  { name: 'Delivered', value: 42 },
  { name: 'Confirmed', value: 18 },
  { name: 'Pending', value: 9 },
];
const PIE_COLORS = ['#1e293b', '#64748b', '#cbd5e0'];

// TODO: replace with real upcoming shipments from the backend
const allShipments: [string, string, string][] = [
  ['Global Foods Co.', 'Main Warehouse', 'Aug 16'],
  ['AquaPure Supplies', 'North Branch', 'Aug 18'],
  ['Harvest Distributors', 'South Hub', 'Aug 22'],
  ['Cedar Imports', 'Main Warehouse', 'Aug 23'],
  ['BlueWave Foods', 'North Branch', 'Aug 24'],
  ['Sunrise Produce', 'South Hub', 'Aug 25'],
  ['MetroPack Ltd.', 'Main Warehouse', 'Aug 27'],
  ['GreenLeaf Co.', 'North Branch', 'Aug 28'],
  ['Orient Traders', 'South Hub', 'Aug 30'],
  ['Delta Supplies', 'Main Warehouse', 'Sep 1'],
];
const PAGE_SIZE = 4;

export default function Dashboard() {
  const userJson = localStorage.getItem('currentUser');
  const user = userJson ? JSON.parse(userJson) : null;

  const [range, setRange] = useState<Range>('Month');
  const [page, setPage] = useState(0);

  const data = revenueByRange[range];
  const pageCount = Math.ceil(allShipments.length / PAGE_SIZE);
  const shipments = allShipments.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="dash-pg">
      <div className="dash-pg-head">
        <div>
          <div className="dash-pg-title">Dashboard</div>
          <p className="dash-pg-subtitle">Welcome back, {user?.fullName ?? 'there'}.</p>
        </div>
      </div>

      {/* stat cards */}
      <div className="dash-stat-grid">
        <div className="dash-stat-card">
          <span className="dash-stat-label">Total Revenue</span>
          <span className="dash-stat-value">$1,177.00</span>
        </div>
        <div className="dash-stat-card">
          <span className="dash-stat-label">Total Spend</span>
          <span className="dash-stat-value">$867.00</span>
        </div>
        <div className="dash-stat-card">
          <span className="dash-stat-label">Net Value</span>
          <span className="dash-stat-value">$310.00</span>
        </div>
        <div className="dash-stat-card">
          <span className="dash-stat-label">Inventory Value</span>
          <span className="dash-stat-value">$2,287.00</span>
        </div>
      </div>

      {/* charts */}
      <div className="dash-charts">
        <div className="dash-card">
          <div className="dash-card-header">
            <div>
              <h2 className="dash-card-title">Revenue vs Spend</h2>
            </div>
            <div className="dash-toggle">
              {(['Day', 'Week', 'Month'] as Range[]).map((o) => (
                <button
                  key={o}
                  className={range === o ? 'is-active' : ''}
                  onClick={() => setRange(o)}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
          <div className="dash-card-body">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={data} margin={{ left: -18, right: 8, top: 4 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={NAVY} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={NAVY} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={LINE} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: SUB }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: SUB }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke={NAVY} strokeWidth={2.5} fill="url(#rev)" />
                <Area type="monotone" dataKey="spend" stroke="#cbd5e0" strokeWidth={2} fill="none" strokeDasharray="4 3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card-header">
            <h2 className="dash-card-title">Orders by status</h2>
          </div>
          <div className="dash-card-body">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={orderStatus} dataKey="value" nameKey="name" innerRadius={58} outerRadius={90} paddingAngle={3}>
                  {orderStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
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

      {/* shipments with pagination */}
      <div className="dash-card">
        <div className="dash-card-header">
          <h2 className="dash-card-title">Upcoming shipments</h2>
          <div className="dash-pager">
            <span className="dash-pager-info">Page {page + 1} of {pageCount}</span>
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>‹</button>
            <button onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))} disabled={page >= pageCount - 1}>›</button>
          </div>
        </div>
        <table className="dash-tbl">
          <thead>
            <tr>
              <th>Supplier</th>
              <th>Warehouse</th>
              <th className="dash-td-right">Expected</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map((r, i) => (
              <tr key={i}>
                <td>{r[0]}</td>
                <td>{r[1]}</td>
                <td className="dash-td-right">{r[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}