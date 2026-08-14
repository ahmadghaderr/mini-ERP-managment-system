import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./orders.css";
import { mockLedgerEntries } from "../stock/ledger";
import { computeStockLevels } from "../stock/stock-utils";
import type { OrderItem, ItemAvailability, OrderStep } from "../../types/order";

const mockExtractedItems: OrderItem[] = [
  { id: "ord-item-1", extractedName: "Bottled Water 500ml", quantity: 300 },
  { id: "ord-item-2", extractedName: "Canned Beans", quantity: 150 },
  { id: "ord-item-3", extractedName: "Rice 1kg", quantity: 50 },
];

const AVAILABILITY_LABEL: Record<ItemAvailability, string> = {
  available: "In Stock",
  partial: "Partial Stock",
  unavailable: "Out of Stock",
};

const AVAILABILITY_BADGE: Record<ItemAvailability, string> = {
  available: "ord-badge--success",
  partial: "ord-badge--warning",
  unavailable: "ord-badge--rejected",
};

function getTotalStockByProduct(): Map<string, number> {
  const totals = new Map<string, number>();
  computeStockLevels(mockLedgerEntries).forEach((row: { productName: string; quantity: number; }) => {
    totals.set(
      row.productName,
      (totals.get(row.productName) ?? 0) + row.quantity,
    );
  });
  return totals;
}

function getAvailability(
  requested: number,
  available: number,
): ItemAvailability {
  if (available <= 0) return "unavailable";
  if (available >= requested) return "available";
  return "partial";
}

interface OrderProps {
  onConfirm?: (payload: { customerName: string; items: OrderItem[] }) => void;
  onBack?: () => void;
}

export default function Order({ onConfirm, onBack }: OrderProps) {
  const navigate = useNavigate();
  const handleBack = onBack ?? (() => navigate(-1));

  const [customerName, setCustomerName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [step, setStep] = useState<OrderStep>("idle");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  function handleFileSelect(selectedFile: File) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setStep("idle");
    setItems([]);
    setIsEditing(false);
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

  function handleStartExtraction() {
    if (!file) return;
    setStep("extracting");

    setTimeout(() => {
      setItems(mockExtractedItems);
      setStep("extracted");
    }, 1500);
  }

  function handleItemChange(
    id: string,
    field: keyof OrderItem,
    value: string | number,
  ) {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)),
    );
  }

  function resetOrder() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setCustomerName("");
    setFile(null);
    setPreviewUrl(null);
    setStep("idle");
    setItems([]);
    setIsEditing(false);
  }

  function handleConfirm() {
    if (!customerName.trim()) {
      alert("Please enter a customer name.");
      return;
    }

    const payload = { customerName, items };
    if (onConfirm) {
      onConfirm(payload);
    } else {
      console.log("Customer order confirmed:", payload);
      alert("Order confirmed.");
      resetOrder();
    }
  }

  function handleReject() {
    if (confirm("Are you sure you want to discard this order?")) {
      resetOrder();
    }
  }

  const stockTotals = getTotalStockByProduct();
  const availabilityRows = items.map((item) => {
    const availableQty = stockTotals.get(item.extractedName) ?? 0;
    return {
      ...item,
      availableQty,
      status: getAvailability(item.quantity, availableQty),
    };
  });

  const allAvailable = availabilityRows.every((r) => r.status === "available");
  const anyUnavailable = availabilityRows.some(
    (r) => r.status === "unavailable",
  );

  return (
    <div className="ord-pg">
      <div className="ord-pg-head">
        <div>
          <div className="ord-pg-title">Create Customer Order</div>
          <p className="ord-pg-subtitle">
            Upload the customer's order PDF to extract requested items and check
            stock availability across all warehouses.
          </p>
        </div>
        <button className="ord-btn ord-btn--ghost" onClick={handleBack}>
          ← Back
        </button>
      </div>

      <div className="ord-upload-grid">
        <div className="ord-left-panel">
          <div className="ord-card ord-upload-card">
            <div className="ord-field">
              <label className="ord-label">Customer Name</label>
              <input
                className="ord-input"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Acme Retail Co."
                disabled={step === "extracting"}
              />
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
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={handleFileInput}
                    hidden
                  />
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
                          <strong>Click to browse</strong> or drag & drop PDF
                          here
                        </p>
                        <span className="ord-dropzone-hint">
                          Supports PDF, PNG, JPG (Max 10MB)
                        </span>
                      </div>
                    )}
                  </div>
                </label>

                {file && (
                  <button
                    className="ord-btn ord-btn--primary ord-upload-btn"
                    onClick={handleStartExtraction}
                  >
                    Extract Order Data
                  </button>
                )}
              </div>
            )}
          </div>

          {step === "extracting" && (
            <div className="ord-card ord-loading-card">
              <div className="ord-spinner" />
              <h3>Extracting requested items...</h3>
              <p>Analyzing document for products and quantities.</p>
            </div>
          )}

          {step === "extracted" && (
            <div className="ord-card ord-extracted-card">
              <div className="ord-extracted-header">
                <div>
                  <h3>Requested Items</h3>
                  <p className="ord-subtext">
                    {isEditing
                      ? "Manual editing mode active — edit values below"
                      : "Review requested items and stock availability"}
                  </p>
                </div>
                <span className="ord-badge ord-badge--extracted">
                  {items.length} items found
                </span>
              </div>

              {!allAvailable && (
                <div className="ord-banner">
                  {anyUnavailable
                    ? "One or more items are out of stock across all warehouses."
                    : "One or more items only have partial stock available."}
                </div>
              )}

              <div className="ord-table-wrapper">
                <table className="ord-tbl">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th style={{ width: 90 }}>Requested</th>
                      <th style={{ width: 90 }}>In Stock</th>
                      <th style={{ width: 130 }}>Availability</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availabilityRows.map((item) => (
                      <tr key={item.id}>
                        <td>
                          {isEditing ? (
                            <input
                              className="ord-input ord-input--sm"
                              value={item.extractedName}
                              onChange={(e) =>
                                handleItemChange(
                                  item.id,
                                  "extractedName",
                                  e.target.value,
                                )
                              }
                            />
                          ) : (
                            item.extractedName
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <input
                              className="ord-input ord-input--sm"
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleItemChange(
                                  item.id,
                                  "quantity",
                                  Math.max(1, Number(e.target.value)),
                                )
                              }
                            />
                          ) : (
                            item.quantity
                          )}
                        </td>
                        <td>{item.availableQty}</td>
                        <td>
                          <span
                            className={`ord-badge ${AVAILABILITY_BADGE[item.status]}`}
                          >
                            {AVAILABILITY_LABEL[item.status]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="ord-actions-row">
                <button className="ord-btn ord-btn--primary" onClick={handleConfirm}>
                  Confirm Order
                </button>

                {!isEditing && (
                  <button
                    className="ord-btn ord-btn--ghost"
                    onClick={() => setIsEditing(true)}
                  >
                    Check manually
                  </button>
                )}

                <button className="ord-btn ord-btn--danger" onClick={handleReject}>
                  ✕ Reject
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
                <iframe
                  src={previewUrl}
                  title="Order PDF Preview"
                  className="ord-preview-iframe"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Order Document Preview"
                  className="ord-preview-img"
                />
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
