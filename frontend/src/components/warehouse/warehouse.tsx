import { useState } from 'react';
import { type WarehouseItem } from '../../types/warehouse';

function StatCard({
  title,
  value,
  variant = 'default',
}: {
  title: string;
  value: number | string;
  variant?: 'default' | 'warning' | 'danger';
}) {
  return (
    <div className={`stat-card ${variant !== 'default' ? variant : ''}`}>
      <h3>{title}</h3>
      <p className="stat-number">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: WarehouseItem['status'] }) {
  const badgeClass = status.toLowerCase().replace(/\s+/g, '-');
  return <span className={`status-badge ${badgeClass}`}>{status}</span>;
}

function InventoryTable({ items }: { items: WarehouseItem[] }) {
  return (
    <div className="table-container">
      <table className="warehouse-table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Item Name</th>
            <th>Category</th>
            <th>Quantity</th>
            <th>Location</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td className="sku-cell">{item.sku}</td>
              <td>{item.name}</td>
              <td>{item.category}</td>
              <td>{item.quantity}</td>
              <td>{item.location}</td>
              <td>
                <StatusBadge status={item.status} />
              </td>
              <td>
                <button className="btn-action">Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const initialItems: WarehouseItem[] = [
  {
    id: '1',
    sku: 'WH-1001',
    name: 'Standard Pallet',
    category: 'Storage',
    quantity: 150,
    minStock: 20,
    location: 'Aisle 1 - A2',
    status: 'In Stock',
  },
  {
    id: '2',
    sku: 'WH-1002',
    name: 'Cardboard Boxes (Large)',
    category: 'Packaging',
    quantity: 15,
    minStock: 50,
    location: 'Aisle 3 - B1',
    status: 'Low Stock',
  },
  {
    id: '3',
    sku: 'WH-1003',
    name: 'Bubble Wrap Roll',
    category: 'Packaging',
    quantity: 0,
    minStock: 10,
    location: 'Aisle 2 - C4',
    status: 'Out of Stock',
  },
];

export function Warehouse() {
  const [items] = useState<WarehouseItem[]>(initialItems);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="warehouse-page">
      <header className="warehouse-header">
        <div>
          <h1>Warehouse Management</h1>
          <p>Track stock levels, inventory status, and item locations.</p>
        </div>
        <button className="btn-primary">+ Add New Item</button>
      </header>

      <section className="stats-grid">
        <StatCard title="Total Items" value={items.reduce((acc, i) => acc + i.quantity, 0)} />
        <StatCard
          title="Low Stock Items"
          value={items.filter((i) => i.status === 'Low Stock').length}
          variant="warning"
        />
        <StatCard
          title="Out of Stock"
          value={items.filter((i) => i.status === 'Out of Stock').length}
          variant="danger"
        />
      </section>

      <div className="toolbar">
        <input
          type="text"
          placeholder="Search by SKU or Name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      <InventoryTable items={filteredItems} />
    </div>
  );
}

export default Warehouse;