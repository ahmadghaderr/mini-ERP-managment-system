import { useState } from "react";
import { hasPermission } from "../permissions/permissions";
import type { Role } from "../permissions/permissions";
import type { Warehouse } from "../../types/warehouse";

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

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState(initialWarehouses);
  const [search, setSearch] = useState("");

  const userJson = localStorage.getItem("currentUser");
  const role = (userJson ? JSON.parse(userJson).role : "staff") as Role;
  const canManage = hasPermission(role, "warehouses:manage");

  const rows = warehouses.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.location.toLowerCase().includes(search.toLowerCase()),
  );

  function handleDelete(id: string) {
    if (!confirm("Delete this warehouse?")) return;

    setWarehouses((prev) => prev.filter((w) => w.id !== id));
  }

  return (
    <div className="pg">
      <div className="pg-head">
        <div>
          <div className="pg-title">Warehouses</div>
        </div>
        {canManage && (
          <button className="btn btn--primary">+ Add warehouse</button>
        )}
      </div>

      <div className="filters">
        <div className="field">
          <label>Search</label>
          <input
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name or location"
          />
        </div>
      </div>

      <div className="card">
        <table className="tbl">
          <thead>
            <tr>
              <th>Name</th>
              <th>Location</th>
              <th>Created</th>
              {canManage && <th></th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((w) => (
              <tr key={w.id}>
                <td>{w.name}</td>
                <td>{w.location}</td>
                <td>{w.createdAt}</td>
                {canManage && (
                  <td>
                    <button className="link-btn">Edit</button>
                    <button
                      className="link-btn"
                      style={{ color: "#c53030", marginLeft: 12 }}
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
    </div>
  );
}
