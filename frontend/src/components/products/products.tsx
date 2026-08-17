import { useState } from "react";
import { hasPermission } from "../permissions/permissions";
import type { Role } from "../permissions/permissions";
import "./products.css";
import type { Category, Product } from "../../types/product";

const initialProducts: Product[] = [
  { id: "p-1", name: "Bottled Water 500ml", category: "water", price: 0.4 },
  { id: "p-2", name: "Canned Beans", category: "food", price: 0.9 },
  { id: "p-3", name: "First Aid Kit", category: "healthcare", price: 12.5 },
  { id: "p-4", name: "USB Charger", category: "electronics", price: 8.0 },
];

const CATEGORIES: (Category | "all")[] = [
  "all",
  "water",
  "food",
  "healthcare",
  "electronics",
];

export default function Products() {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");

  const userJson = localStorage.getItem("currentUser");
  const role = (userJson ? JSON.parse(userJson).role : "staff") as Role;
  const canManage = hasPermission(role, "products:manage");

  const rows = products.filter(
    (p) =>
      (category === "all" || p.category === category) &&
      p.name.toLowerCase().includes(search.toLowerCase()),
  );

  function handleDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="pg">
      <div className="pg-head">
        <div>
          <div className="pg-title">Products</div>
        </div>
        {canManage && (
          <button className="btn btn--primary">+ Add product</button>
        )}
      </div>

      <div className="filters">
        <div className="field">
          <label>Search</label>
          <input
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Product name"
          />
        </div>
        <div className="field">
          <label>Category</label>
          <select
            className="select"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category | "all")}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        <table className="tbl">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              {canManage && <th></th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>
                  <span className={`badge badge--cat-${p.category}`}>
                    {p.category}
                  </span>
                </td>
                <td>${p.price.toFixed(2)}</td>
                {canManage && (
                  <td>
                    <button className="link-btn">Edit</button>
                    <button
                      className="link-btn"
                      style={{ color: "#c53030", marginLeft: 24 }}
                      onClick={() => handleDelete(p.id)}
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