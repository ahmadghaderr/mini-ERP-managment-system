import { useState, type JSX } from "react";
import { createProduct } from "../../services/product-service";
import type { Product, ProductCategory } from "../../types/product";
import { getApiErrorMessage } from "../../lib/apiError";

interface AddProductModalProps {
  initialName: string;
  initialPrice?: number | null;
  onCreate: (product: Product) => void;
  onClose: () => void;
}

interface CategoryOption {
  value: ProductCategory;
  label: string;
  color: string;
  icon: JSX.Element;
}

const CATEGORY_OPTIONS: CategoryOption[] = [
  {
    value: "water",
    label: "Water",
    color: "#6cc6d9",
    icon: (
      <path d="M12 3c-4 5-7 9-7 13a7 7 0 0 0 14 0c0-4-3-8-7-13Z" />
    ),
  },
  {
    value: "food",
    label: "Food",
    color: "#3ab5cc",
    icon: (
      <>
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <path d="M3 6h18" />
        <path d="M9 10a3 3 0 0 0 6 0" />
      </>
    ),
  },
  {
    value: "healthcare",
    label: "Healthcare",
    color: "#2a94a8",
    icon: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="4" />
        <path d="M12 8v8M8 12h8" />
      </>
    ),
  },
  {
    value: "electronics",
    label: "Electronics",
    color: "#2b4464",
    icon: (
      <>
        <rect x="6" y="6" width="12" height="12" rx="2" />
        <path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3" />
      </>
    ),
  },
  {
    value: "others",
    label: "Others",
    color: "#94a3b8",
    icon: (
      <>
        <path d="M21 8 12 3 3 8l9 5 9-5Z" />
        <path d="M3 8v8l9 5 9-5V8" />
        <path d="M12 13v8" />
      </>
    ),
  },
];

export default function AddProductModal({
  initialName,
  initialPrice,
  onCreate,
  onClose,
}: AddProductModalProps) {
  const [productName, setProductName] = useState(initialName);
  const [category, setCategory] = useState<ProductCategory>("others");
  const [price, setPrice] = useState(
    initialPrice != null ? String(initialPrice) : "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCategory =
    CATEGORY_OPTIONS.find((c) => c.value === category) ?? CATEGORY_OPTIONS[4];
  const numericPricePreview = Number(price);
  const hasValidPricePreview = price !== "" && !Number.isNaN(numericPricePreview);

  async function handleSubmit() {
    const trimmedName = productName.trim();
    const numericPrice = Number(price);

    if (!trimmedName) {
      setError("Product name is required.");
      return;
    }
    if (!price || Number.isNaN(numericPrice) || numericPrice < 0) {
      setError("Enter a valid price.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const product = await createProduct({
        productName: trimmedName,
        category,
        price: numericPrice,
      });
      onCreate(product);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="cal-modal-overlay" onClick={onClose}>
      <div
        className="cal-modal apm-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <div className="cal-modal-header">
            <div className="cal-modal-icon cal-modal-icon--primary">
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
            </div>
            <div>
              <div className="cal-modal-title">Add new product</div>
              <p className="apm-subtitle">
                This gets added to your product catalog and can be matched
                against on future invoices and orders.
              </p>
            </div>
          </div>

          {error && <div className="apm-error">{error}</div>}

          <div className="apm-field">
            <label className="inv-label">Product name</label>
            <input
              className="inv-input"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              disabled={saving}
              autoFocus
              placeholder="e.g. Sparkling Water 330ml"
            />
          </div>

          <div className="apm-field">
            <label className="inv-label">Category</label>
            <div className="apm-category-grid">
              {CATEGORY_OPTIONS.map((opt) => {
                const isSelected = opt.value === category;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`apm-category-pill ${isSelected ? "apm-category-pill--active" : ""}`}
                    style={
                      isSelected
                        ? ({
                            "--pill-color": opt.color,
                          } as React.CSSProperties)
                        : undefined
                    }
                    onClick={() => setCategory(opt.value)}
                    disabled={saving}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={isSelected ? opt.color : "currentColor"}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {opt.icon}
                    </svg>
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="apm-field">
            <label className="inv-label">Price</label>
            <div className="apm-price-wrap">
              <span className="apm-price-prefix">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                className="inv-input apm-price-input"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={saving}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="apm-preview">
            <span
              className="apm-preview-dot"
              style={{ background: selectedCategory.color }}
            />
            <span className="apm-preview-name">
              {productName.trim() || "Your product name"}
            </span>
            <span
              className="apm-preview-category"
              style={{
                background: `${selectedCategory.color}1a`,
                color: selectedCategory.color,
              }}
            >
              {selectedCategory.label}
            </span>
            <span className="apm-preview-price">
              {hasValidPricePreview
                ? `$${numericPricePreview.toFixed(2)}`
                : "—"}
            </span>
          </div>

          <div className="apm-actions">
            <button
              type="button"
              className="inv-btn inv-btn--ghost"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inv-btn inv-btn--primary"
              disabled={saving}
            >
              {saving ? "Adding..." : "Add product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}