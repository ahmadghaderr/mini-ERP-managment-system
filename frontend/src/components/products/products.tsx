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

const FORM_CATEGORIES: Category[] = ["water", "food", "healthcare", "electronics"];

type ProductFormData = {
  name: string;
  category: Category;
  price: number;
};

interface ProductModalProps {
  product: Product | null;
  onSave: (data: ProductFormData) => void;
  onClose: () => void;
}

function ProductModal({ product, onSave, onClose }: ProductModalProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: product?.name ?? "",
    category: product?.category ?? "water",
    price: product?.price ?? 0,
  });

  function handleSubmit() {
    if (!formData.name.trim() || formData.price <= 0) {
      alert("Please fill in a valid name and price");
      return;
    }
    onSave(formData);
  }

  return (
    <div className="prod-modal-overlay" onClick={onClose}>
      <div className="prod-modal" onClick={(e) => e.stopPropagation()}>
        <div className="prod-modal-header">
          <div className="prod-modal-title">
            {product ? "Edit Product" : "Add Product"}
          </div>
          <button className="prod-modal-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="prod-modal-body">
          <div className="field">
            <label>Product Name</label>
            <input
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Bottled Water 500ml"
            />
          </div>
          <div className="field">
            <label>Category</label>
            <select
              className="select"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value as Category })
              }
            >
              {FORM_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Price ($)</label>
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: Number(e.target.value) })
              }
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="prod-modal-footer">
          <button className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn--primary" onClick={handleSubmit}>
            {product ? "Save Changes" : "Create Product"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Products() {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const userJson = localStorage.getItem("currentUser");
  const role = (userJson ? JSON.parse(userJson).role : "staff") as Role;
  const canManage = hasPermission(role, "products:manage");

  const rows = products.filter(
    (p) =>
      (category === "all" || p.category === category) &&
      p.name.toLowerCase().includes(search.toLowerCase()),
  );

  function handleAdd() {
    setEditingProduct(null);
    setShowModal(true);
  }

  function handleEdit(p: Product) {
    setEditingProduct(p);
    setShowModal(true);
  }

  function handleSave(data: ProductFormData) {
    if (editingProduct) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id ? { ...p, ...data } : p,
        ),
      );
    } else {
      const newProduct: Product = {
        id: `p-${Date.now()}`,
        ...data,
      };
      setProducts((prev) => [newProduct, ...prev]);
    }
    setShowModal(false);
    setEditingProduct(null);
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="pg">
      <div className="pg-head">
        <h1 className="pg-title">Products</h1>
        <p className="pg-subtitle">Manage your product catalog and pricing.</p>
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
            placeholder="Search products"
          />
        </div>

        <select
          className="filter-select"
          value={category}
          onChange={(e) => setCategory(e.target.value as Category | "all")}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c === "all" ? "All categories" : c}
            </option>
          ))}
        </select>

        {canManage && (
          <button className="btn btn--primary" onClick={handleAdd}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add product
          </button>
        )}
      </div>

      <div className="card">
        <table className="tbl">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              {canManage && <th className="tbl-actions">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td className="tbl-name">{p.name}</td>
                <td>
                  <span className={`badge badge--cat-${p.category}`}>
                    {p.category}
                  </span>
                </td>
                <td>${p.price.toFixed(2)}</td>
                {canManage && (
                  <td className="tbl-actions">
                    <button className="link-btn" onClick={() => handleEdit(p)}>
                      Edit
                    </button>
                    <button
                      className="link-btn link-btn--danger"
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

      {showModal && (
        <ProductModal
          product={editingProduct}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false);
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
}