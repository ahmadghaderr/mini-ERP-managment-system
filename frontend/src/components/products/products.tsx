import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import PageLoader from "../shared/PageLoader";
import { hasPermission } from "../permissions/permissions";
import { decodeToken } from "../../lib/cognito";
import type { Role } from "../permissions/permissions";
import "./products.css";
import type {
  Product,
  ProductCategory,
  CreateProductPayload,
} from "../../types/product";
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../../services/product-service";

const CATEGORIES: (ProductCategory | "all")[] = [
  "all",
  "water",
  "food",
  "healthcare",
  "electronics",
  "others"
];

const FORM_CATEGORIES: ProductCategory[] = [
  "water",
  "food",
  "healthcare",
  "electronics",
  "others",
];

interface ProductModalProps {
  product: Product | null;
  onSave: (data: CreateProductPayload) => void;
  onClose: () => void;
}

function ProductModal({ product, onSave, onClose }: ProductModalProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<CreateProductPayload>({
    productName: product?.productName ?? "",
    category: product?.category ?? "water",
    price: product?.price ?? 0,
  });

  function handleSubmit() {
    if (!formData.productName.trim() || formData.price <= 0) {
      alert(t("products.fillValidFields"));
      return;
    }
    onSave(formData);
  }

  return (
    <div className="prod-modal-overlay" onClick={onClose}>
      <div className="prod-modal" onClick={(e) => e.stopPropagation()}>
        <div className="prod-modal-header">
          <div className="prod-modal-title">
            {product ? t("products.modalTitleEdit") : t("products.modalTitleAdd")}
          </div>
          <button
            className="prod-modal-close"
            onClick={onClose}
            aria-label={t("common.close")}
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

        <div className="prod-modal-body">
          <div className="field">
            <label>{t("products.fieldName")}</label>
            <input
              className="input"
              value={formData.productName}
              onChange={(e) =>
                setFormData({ ...formData, productName: e.target.value })
              }
              placeholder={t("products.fieldNamePlaceholder")}
            />
          </div>
          <div className="field">
            <label>{t("products.fieldCategory")}</label>
            <select
              className="select"
              value={formData.category}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  category: e.target.value as ProductCategory,
                })
              }
            >
              {FORM_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t(`products.categories.${c}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>{t("products.fieldPrice")}</label>
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
            {t("common.cancel")}
          </button>
          <button className="btn btn--primary" onClick={handleSubmit}>
            {product ? t("products.saveChanges") : t("products.createButton")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Products() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ProductCategory | "all">("all");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const idToken = localStorage.getItem("idToken");
  const payload = idToken ? decodeToken(idToken) : null;
  const groups = (payload?.["cognito:groups"] as string[]) ?? [];
  const role = (groups[0] ?? "staff") as Role;
  const canManage = hasPermission(role, "products:manage");

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    try {
      const data = await fetchProducts();
      setProducts(data.map((p) => ({ ...p, price: Number(p.price) })));
    } finally {
      setLoading(false);
    }
  }

  const rows = products.filter(
    (p) =>
      (category === "all" || p.category === category) &&
      p.productName.toLowerCase().includes(search.toLowerCase()),
  );

  function handleAdd() {
    setEditingProduct(null);
    setShowModal(true);
  }

  function handleEdit(p: Product) {
    setEditingProduct(p);
    setShowModal(true);
  }

  async function handleSave(data: CreateProductPayload) {
    if (editingProduct) {
      await updateProduct(editingProduct.id, data);
    } else {
      await createProduct(data);
    }
    setShowModal(false);
    setEditingProduct(null);
    loadProducts();
  }

  async function handleDelete(id: string) {
    if (!confirm(t("products.deleteConfirm"))) return;
    await deleteProduct(id);
    loadProducts();
  }

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="pg">
      <div className="pg-head">
        <h1 className="pg-title">{t("products.title")}</h1>
      </div>

      <div className="pg-toolbar">
        <div className="search-wrap">
          <svg
            className="search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("products.searchPlaceholder")}
          />
        </div>

        <select
          className="filter-select"
          value={category}
          onChange={(e) =>
            setCategory(e.target.value as ProductCategory | "all")
          }
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c === "all" ? t("products.allCategories") : t(`products.categories.${c}`)}
            </option>
          ))}
        </select>

        {canManage && (
          <button className="btn btn--primary" onClick={handleAdd}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {t("products.addButton")}
          </button>
        )}
      </div>

      <div className="card">
        <table className="tbl">
          <thead>
            <tr>
              <th>{t("products.colName")}</th>
              <th>{t("products.colCategory")}</th>
              <th>{t("products.colPrice")}</th>
              {canManage && <th className="tbl-actions">{t("products.colActions")}</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td className="tbl-name">{p.productName}</td>
                <td>
                  <span className={`badge badge--cat-${p.category}`}>
                    {t(`products.categories.${p.category}`)}
                  </span>
                </td>
                <td>${p.price.toFixed(2)}</td>
                {canManage && (
                  <td className="tbl-actions">
                    <button className="row-btn" onClick={() => handleEdit(p)}>
                      {t("common.edit")}
                    </button>
                    <button
                      className="row-btn row-btn--danger"
                      onClick={() => handleDelete(p.id)}
                    >
                      {t("common.delete")}
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