import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./orders.css";
import {
  uploadCustomerOrder,
  matchCustomerOrderItem,
  confirmCustomerOrder,
  rejectCustomerOrder,
} from "../../services/customerOrder-service";
import { fetchWarehouses} from "../../services/warehouse-service";
import { fetchProducts } from "../../services/product-service";
import type { CustomerOrder } from "../../types/order";
import type { Product } from "../../types/product";
import type { Warehouse } from "../../types/warehouse";

type UploadStep = "idle" | "uploading" | "extracted";

interface OrderProps {
  onBack?: () => void;
}

export default function Order({ onBack }: OrderProps) {
  const navigate = useNavigate();
  const handleBack = onBack ?? (() => navigate(-1));

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [products, setProducts] = useState<Product[]>([]);

  const [step, setStep] = useState<UploadStep>("idle");
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [lowConfidenceFields, setLowConfidenceFields] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([fetchWarehouses(), fetchProducts()])
      .then(([w, p]) => {
        setWarehouses(w);
        setProducts(p);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Could not load warehouses/products.");
      });
  }, []);

  function handleFileSelect(selectedFile: File) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setStep("idle");
    setOrder(null);
    setError(null);
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

  async function handleUpload() {
    if (!file || !warehouseId) {
      setError("Select a warehouse and a file before uploading.");
      return;
    }
    setStep("uploading");
    setError(null);
    try {
      const result = await uploadCustomerOrder(file, warehouseId);
      setOrder(result.order);
      setLowConfidenceFields(result.lowConfidenceFields);
      setStep("extracted");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setStep("idle");
    }
  }

  async function handleMatch(itemId: string, matchedProductId: string) {
    if (!order || !matchedProductId) return;
    try {
      const updatedItem = await matchCustomerOrderItem(order.id, itemId, matchedProductId);
      setOrder({
        ...order,
        items: order.items.map((it) => (it.id === itemId ? updatedItem : it)),
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not match item.");
    }
  }

  async function handleConfirm() {
    if (!order) return;
    setSaving(true);
    try {
      await confirmCustomerOrder(order.id);
      navigate("/orders");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not confirm order.");
    } finally {
      setSaving(false);
    }
  }

  async function handleReject() {
    if (!order) return;
    if (!confirm("Are you sure you want to reject this order?")) return;
    setSaving(true);
    try {
      await rejectCustomerOrder(order.id);
      navigate("/orders");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not reject order.");
    } finally {
      setSaving(false);
    }
  }

  const allMatched = order?.items.every((it) => it.matchedProductId) ?? false;

  return (
    <div className="ord-pg">
      <div className="ord-pg-head">
        <div>
          <h1 className="ord-pg-title">Create customer order</h1>
        </div>
        <button className="ord-btn ord-btn--ghost" onClick={handleBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back
        </button>
      </div>

      {error && <div className="ord-banner">{error}</div>}

      <div className="ord-upload-grid">
        <div className="ord-left-panel">
          <div className="ord-card ord-upload-card">
            <div className="ord-field">
              <label className="ord-label">Warehouse</label>
              <select
                className="ord-input"
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                disabled={step !== "idle"}
              >
                <option value="" disabled>
                  Select warehouse
                </option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.warehouseName}
                  </option>
                ))}
              </select>
            </div>

            {step === "idle" && (
              <div className="ord-field">
                <label className="ord-label">Order Document</label>
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
                          <strong>Click to browse</strong> or drag & drop PDF here
                        </p>
                        <span className="ord-dropzone-hint">Supports PDF, PNG, JPG (Max 10MB)</span>
                      </div>
                    )}
                  </div>
                </label>

                {file && (
                  <button className="ord-btn ord-btn--primary ord-upload-btn" onClick={handleUpload}>
                    Extract Order Data
                  </button>
                )}
              </div>
            )}
          </div>

          {step === "uploading" && (
            <div className="ord-card ord-loading-card">
              <div className="ord-spinner" />
              <h3>Extracting requested items...</h3>
              <p>Analyzing document for products and quantities.</p>
            </div>
          )}

          {step === "extracted" && order && (
            <div className="ord-card ord-extracted-card">
              <div className="ord-extracted-header">
                <div>
                  <h3>Requested Items</h3>
                  <p className="ord-subtext">
                    Match each item to a product before confirming.
                  </p>
                </div>
                <span className="ord-badge ord-badge--extracted">
                  {order.items.length} items found
                </span>
              </div>

              {lowConfidenceFields.length > 0 && (
                <div className="ord-banner">
                  Low-confidence extraction on: {lowConfidenceFields.join(", ")}
                </div>
              )}

              <div className="ord-table-wrapper">
                <table className="ord-tbl">
                  <thead>
                    <tr>
                      <th>Extracted name</th>
                      <th style={{ width: 90 }}>Qty</th>
                      <th style={{ width: 90 }}>Unit price</th>
                      <th style={{ width: 200 }}>Matched product</th>
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
                              Select product
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

              <div className="ord-actions-row">
                <button
                  className="ord-btn ord-btn--primary"
                  disabled={!allMatched || saving}
                  onClick={handleConfirm}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Confirm Order
                </button>

                <button className="ord-btn ord-btn--danger" disabled={saving} onClick={handleReject}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  Reject
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="ord-card ord-preview-card">
          <div className="ord-preview-header">
            <h3>Document Preview</h3>
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
                <p>Upload a PDF to view preview here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}