import { useState } from "react";
import { hasPermission } from "../permissions/permissions";
import type { Role } from "../permissions/permissions";
import type { Warehouse } from "../../types/warehouse";
import "./warehouse.css";

const initialWarehouses: Warehouse[] = [
  {
    id: "wh-1",
    name: "Main Warehouse",
    location: "Tripoli, LB",
    createdAt: "2026-07-01",
  },
  {
    id: "wh-2",
    name: "North Depot",
    location: "Beirut, LB",
    createdAt: "2026-07-10",
  },
  {
    id: "wh-3",
    name: "South Storage",
    location: "Saida, LB",
    createdAt: "2026-07-22",
  },
];

type WarehouseFormData = {
  name: string;
  location: string;
};

interface WarehouseModalProps {
  warehouse: Warehouse | null;
  onSave: (data: WarehouseFormData) => void;
  onClose: () => void;
}

function WarehouseModal({ warehouse, onSave, onClose }: WarehouseModalProps) {
  const [formData, setFormData] = useState<WarehouseFormData>({
    name: warehouse?.name ?? "",
    location: warehouse?.location ?? "",
  });

  function handleSubmit() {
    if (!formData.name.trim() || !formData.location.trim()) {
      alert("Please fill in all fields");
      return;
    }
    onSave(formData);
  }

  return (
    <div className="wh-modal-overlay" onClick={onClose}>
      <div className="wh-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wh-modal-header">
          <div className="wh-modal-title">
            {warehouse ? "Edit Warehouse" : "Add Warehouse"}
          </div>
          <button className="wh-modal-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="wh-modal-body">
          <div className="field">
            <label>Warehouse Name</label>
            <input
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Main Warehouse"
            />
          </div>
          <div className="field">
            <label>Location</label>
            <input
              className="input"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. Tripoli, LB"
            />
          </div>
        </div>

        <div className="wh-modal-footer">
          <button className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn--primary" onClick={handleSubmit}>
            {warehouse ? "Save Changes" : "Create Warehouse"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState(initialWarehouses);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

  const userJson = localStorage.getItem("currentUser");
  const role = (userJson ? JSON.parse(userJson).role : "staff") as Role;
  const canManage = hasPermission(role, "warehouses:manage");

  const rows = warehouses.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.location.toLowerCase().includes(search.toLowerCase()),
  );

  function handleAdd() {
    setEditingWarehouse(null);
    setShowModal(true);
  }

  function handleEdit(w: Warehouse) {
    setEditingWarehouse(w);
    setShowModal(true);
  }

  function handleSave(data: WarehouseFormData) {
    if (editingWarehouse) {
      setWarehouses((prev) =>
        prev.map((w) =>
          w.id === editingWarehouse.id ? { ...w, ...data } : w,
        ),
      );
    } else {
      const newWarehouse: Warehouse = {
        id: `wh-${Date.now()}`,
        ...data,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setWarehouses((prev) => [newWarehouse, ...prev]);
    }
    setShowModal(false);
    setEditingWarehouse(null);
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this warehouse?")) return;

    setWarehouses((prev) => prev.filter((w) => w.id !== id));
  }

  return (
    <div className="pg">
      <div className="pg-head">
        <h1 className="pg-title">Warehouses</h1>
        <p className="pg-subtitle">Manage your storage locations and facilities.</p>
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
            placeholder="Search by name or location"
          />
        </div>

        {canManage && (
          <button className="btn btn--primary" onClick={handleAdd}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add warehouse
          </button>
        )}
      </div>

      <div className="card">
        <table className="tbl">
          <thead>
            <tr>
              <th>Name</th>
              <th>Location</th>
              <th>Created</th>
              {canManage && <th className="tbl-actions">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((w) => (
              <tr key={w.id}>
                <td className="tbl-name">{w.name}</td>
                <td>
                  <span className="loc-badge">{w.location}</span>
                </td>
                <td className="tbl-muted">{w.createdAt}</td>
                {canManage && (
                  <td className="tbl-actions">
                    <button className="link-btn" onClick={() => handleEdit(w)}>
                      Edit
                    </button>
                    <button
                      className="link-btn link-btn--danger"
                      onClick={() => handleDelete(w.id)}
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <WarehouseModal
          warehouse={editingWarehouse}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false);
            setEditingWarehouse(null);
          }}
        />
      )}
    </div>
  );
}