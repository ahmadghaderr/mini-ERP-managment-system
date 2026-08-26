import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import "./orders.css";
import {
  uploadCustomerOrder,
  matchCustomerOrderItem,
  confirmCustomerOrder,
  rejectCustomerOrder,
} from "../../services/customerOrder-service";
import { fetchProducts } from "../../services/product-service";
import { getApiErrorMessage } from "../../lib/apiError";
import type { CustomerOrder, CustomerOrderItem } from "../../types/order";
import type { Product } from "../../types/product";

type UploadStep = "idle" | "uploading" | "extracted";

interface OrderProps {
  onBack?: () => void;
}

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

function findBestProductMatch(
  extractedName: string,
  products: Product[],
): Product | undefined {
  const normalizedExtracted = normalize(extractedName);
  if (!normalizedExtracted) return undefined;

  const exact = products.find(
    (p) => normalize(p.productName) === normalizedExtracted,
  );
  if (exact) return exact;

  const partial = products.find(
    (p) =>
      normalize(p.productName).includes(normalizedExtracted) ||
      normalizedExtracted.includes(normalize(p.productName)),
  );
  return partial;
}

export default function Order({ onBack }: OrderProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const handleBack = onBack ?? (() => navigate(-1));

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);

  const [step, setStep] = useState<UploadStep>("idle");
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [lowConfidenceFields, setLowConfidenceFields] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [autoMatching, setAutoMatching] = useState(false);

  useEffect(() => {
    fetchProducts()
      .then((p) => setProducts(p))
      .catch((err) => {
        setError(getApiErrorMessage(err));
      });
  }, []);

  function handleFileSelect(selectedFile: File) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setStep("idle");
    setOrder(null);
    setError(null);
    setActionError(null);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) handleFileSelect(selected);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) handleFileSelect(dropped);
  }

  async function autoMatchItems(items: CustomerOrderItem[], productList: Product[]) {
    if (productList.length === 0) return;
    setAutoMatching(true);
    let current = items;
    for (const item of items) {
      if (item.matchedProductId) continue;
      const match = findBestProductMatch(item.extractedProductName, productList);
      if (!match) continue;
      try {
        const updatedItem = await matchCustomerOrderItem(
          item.customerOrderId,
          item.id,
          match.id,
        );
        current = current.map((it) => (it.id === item.id ? updatedItem : it));
        setOrder((prev) => (prev ? { ...prev, items: current } : prev));
      } catch {
        // leave unmatched, user can pick manually
      }
    }
    setAutoMatching(false);
  }

  async function handleUpload() {
    if (!file) {
      setError(t("orders.selectFileAlert"));
      return;
    }
    setStep("uploading");
    setError(null);
    setActionError(null);
    try {
      const result = await uploadCustomerOrder(file);
      setOrder(result.order);
      setLowConfidenceFields(result.lowConfidenceFields);
      setStep("extracted");
      autoMatchItems(result.order.items, products);
    } catch (err) {
      setError(getApiErrorMessage(err));
      setStep("idle");
    }
  }

  async function handleMatch(itemId: string, matchedProductId: string) {
    if (!order || !matchedProductId) return;
    setActionError(null);
    try {
      const updatedItem = await matchCustomerOrderItem(order.id, itemId, matchedProductId);
      setOrder({
        ...order,
        items: order.items.map((it) => (it.id === itemId ? updatedItem : it)),
      });
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    }
  }

  async function handleConfirm() {
    if (!order) return;
    setSaving(true);
    setActionError(null);
    try {
      await confirmCustomerOrder(order.id);
      navigate("/orders");
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleReject() {
    if (!order) return;
    if (!confirm(t("orders.rejectConfirmMsg"))) return;
    setSaving(true);
    setActionError(null);
    try {
      await rejectCustomerOrder(order.id);
      navigate("/orders");
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const allMatched = order?.items.every((it) => it.matchedProductId) ?? false;
  const totalPrice =
    order?.items.reduce(
      (sum, item) => sum + (Number(item.unitPrice) || 0) * item.quantity,
      0,
    ) ?? 0;

  return (
    <div className="ord-pg">
      <div className="ord-pg-head">
        <div>
          <h1 className="ord-pg-title">{t("orders.createOrderTitle")}</h1>
        </div>
        <button className="ord-btn ord-btn--ghost" onClick={handleBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          {t("common.back")}
        </button>
      </div>

      {error && <div className="ord-banner">{error}</div>}

      <div className="ord-upload-grid">
        <div className="ord-left-panel">
          <div className="ord-card ord-upload-card">
            {step === "idle" && (
              <div className="ord-field">
                <label className="ord-label">{t("orders.orderDocument")}</label>
                <label
                  className={`ord-dropzone ${isDragging ? "ord-dropzone--active" : ""} ${
                    file ? "ord-dropzone--has-file" : ""
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input type="file" accept=".pdf,image/*" onChange={handleFileInput} hidden />
                  <div className="ord-dropzone-content">
                    {file ? (
                      <div className="ord-file-info">
                        <span className="ord-file-name">{file.name}</span>
                        <span className="ord-file-size">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </div>
                    ) : (
                      <div>
                        <p className="ord-dropzone-text">
                          <strong>{t("orders.clickToBrowse")}</strong> {t("orders.dragDropHere")}
                        </p>
                        <span className="ord-dropzone-hint">{t("orders.supportsFormats")}</span>
                      </div>
                    )}
                  </div>
                </label>

                {file && (
                  <button className="ord-btn ord-btn--primary ord-upload-btn" onClick={handleUpload}>
                    {t("orders.extractOrderData")}
                  </button>
                )}
              </div>
            )}
          </div>

          {step === "uploading" && (
            <div className="ord-card ord-loading-card">
              <div className="ord-spinner" />
              <h3>{t("orders.extractingItemsTitle")}</h3>
              <p>{t("orders.extractingItemsSubtitle")}</p>
            </div>
          )}

          {step === "extracted" && order && (
            <div className="ord-card ord-extracted-card">
              <div className="ord-extracted-header">
                <div>
                  <h3>{t("orders.requestedItems")}</h3>
                  <p className="ord-subtext">
                    {autoMatching
                      ? t("orders.autoMatching")
                      : t("orders.reviewMatched")}
                  </p>
                </div>
                <span className="ord-badge ord-badge--extracted">
                  {order.items.length} {t("orders.itemsFound")}
                </span>
              </div>

              {lowConfidenceFields.length > 0 && (
                <div className="ord-banner">
                  {t("orders.lowConfidenceExtraction")} {lowConfidenceFields.join(", ")}
                </div>
              )}

              {actionError && (
                <div className="ord-banner" style={{ borderColor: "crimson", color: "crimson" }}>
                  {actionError}
                </div>
              )}

              <div className="ord-table-wrapper">
                <table className="ord-tbl">
                  <thead>
                    <tr>
                      <th>{t("orders.colExtractedName")}</th>
                      <th style={{ width: 90 }}>{t("orders.colQty")}</th>
                      <th style={{ width: 90 }}>{t("orders.colUnitPrice")}</th>
                      <th style={{ width: 200 }}>{t("orders.colMatchedProduct")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <td>{item.extractedProductName}</td>
                        <td>{item.quantity}</td>
                        <td>
                          {item.unitPrice != null
                            ? `$${Number(item.unitPrice).toFixed(2)}`
                            : "—"}
                        </td>
                        <td>
                          <select
                            className="ord-input ord-input--sm"
                            value={item.matchedProductId ?? ""}
                            onChange={(e) => handleMatch(item.id, e.target.value)}
                          >
                            <option value="" disabled>
                              {t("orders.selectProduct")}
                            </option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.productName}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px 0", fontWeight: 600 }}>
                {t("orders.total")}: ${totalPrice.toFixed(2)}
              </div>

              <div className="ord-actions-row">
                <button
                  className="ord-btn ord-btn--primary"
                  disabled={!allMatched || saving || autoMatching}
                  onClick={handleConfirm}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {t("orders.confirmOrderButton")}
                </button>

                <button className="ord-btn ord-btn--danger" disabled={saving} onClick={handleReject}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  {t("common.reject")}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="ord-card ord-preview-card">
          <div className="ord-preview-header">
            <h3>{t("orders.documentPreview")}</h3>
            {file && <span className="ord-file-badge">{file.name}</span>}
          </div>
          <div className="ord-preview-body">
            {previewUrl ? (
              file?.type === "application/pdf" ? (
                <iframe src={previewUrl} title="Order PDF Preview" className="ord-preview-iframe" />
              ) : (
                <img src={previewUrl} alt="Order Document Preview" className="ord-preview-img" />
              )
            ) : (
              <div className="ord-preview-placeholder">
                <p>{t("orders.uploadPlaceholder")}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}