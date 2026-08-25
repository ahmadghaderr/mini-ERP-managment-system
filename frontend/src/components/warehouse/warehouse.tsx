import { useState, useEffect } from "react";
import { hasPermission } from "../permissions/permissions";
import { decodeToken } from "../../lib/cognito";
import PageLoader from "../shared/PageLoader";
import type { Role } from "../permissions/permissions";
import type { Warehouse, CreateWarehousePayload, WarehouseModalProps } from "../../types/warehouse";
import { fetchWarehouses, createWarehouse, updateWarehouse, deleteWarehouse } from "../../services/warehouse-service";
import "./warehouse.css";

function WarehouseModal({ warehouse, onSave, onClose }: WarehouseModalProps) {
  const [formData, setFormData] = useState<CreateWarehousePayload>({
    warehouseName: warehouse?.warehouseName ?? "",
    warehouseLocation: warehouse?.warehouseLocation ?? "",
  });

  function handleSubmit() {
    if (!formData.warehouseName.trim() || !formData.warehouseLocation.trim()) {
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
              value={formData.warehouseName}
              onChange={(e) => setFormData({ ...formData, warehouseName: e.target.value })}
              placeholder="e.g. Main Warehouse"
            />
          </div>
          <div className="field">
            <label>Location</label>
            <input
              className="input"
              value={formData.warehouseLocation}
              onChange={(e) => setFormData({ ...formData, warehouseLocation: e.target.value })}
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
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

  const idToken = localStorage.getItem("idToken");
  const payload = idToken ? decodeToken(idToken) : null;
  const groups = (payload?.["cognito:groups"] as string[]) ?? [];
  const role = (groups[0] ?? "staff") as Role;
  const canManage = hasPermission(role, "warehouses:manage");

  useEffect(() => {
    loadWarehouses();
  }, []);

  async function loadWarehouses() {
    setLoading(true);
    try {
      const data = await fetchWarehouses();
      setWarehouses(data);
    } finally {
      setLoading(false);
    }
  }

  const rows = warehouses.filter(
    (w) =>
      w.warehouseName.toLowerCase().includes(search.toLowerCase()) ||
      w.warehouseLocation.toLowerCase().includes(search.toLowerCase()),
  );

  function handleAdd() {
    setEditingWarehouse(null);
    setShowModal(true);
  }

  function handleEdit(w: Warehouse) {
    setEditingWarehouse(w);
    setShowModal(true);
  }

  async function handleSave(data: CreateWarehousePayload) {
    if (editingWarehouse) {
      await updateWarehouse(editingWarehouse.id, data);
    } else {
      await createWarehouse(data);
    }
    setShowModal(false);
    setEditingWarehouse(null);
    loadWarehouses();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this warehouse?")) return;
    await deleteWarehouse(id);
    loadWarehouses();
  }

  if (loading) {
        return <PageLoader />;
  }

  return (
    <div className="pg">
      <div className="pg-head">
        <h1 className="pg-title">Warehouses</h1>
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
                <td className="tbl-name">{w.warehouseName}</td>
                <td>
                  <span className="loc-badge">{w.warehouseLocation}</span>
                </td>
                <td className="tbl-muted">{new Date(w.createdAt).toLocaleDateString()}</td>
                                {canManage && (
                  <td className="tbl-actions">
                    <button className="row-btn" onClick={() => handleEdit(w)}>
                      Edit
                    </button>
                    <button
                      className="row-btn row-btn--danger"
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