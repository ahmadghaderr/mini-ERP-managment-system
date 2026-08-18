import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./invoices.css";
import type { InvoiceType, InvoiceItem } from "../../types/invoice";

const mockWarehouses = ["Main Warehouse", "North Branch", "South Hub"];

const mockInvoiceTypes: InvoiceType[] = [
  { id: "type-1", name: "Standard Tax Invoice" },
  { id: "type-2", name: "Purchase Order" },
  { id: "type-3", name: "Credit Note" },
];

const mockExtractedItems: InvoiceItem[] = [
  {
    id: "ext-1",
    extractedName: "Bottled Water 500ml (24-pack)",
    quantity: 15,
    unitPrice: 4.5,
  },
  {
    id: "ext-2",
    extractedName: "Organic Coffee Beans 1kg",
    quantity: 5,
    unitPrice: 18.0,
  },
  {
    id: "ext-3",
    extractedName: "Paper Towel Rolls 12s",
    quantity: 8,
    unitPrice: 9.25,
  },
];

type ExtractionStep = "idle" | "extracting" | "extracted";

interface UploadProps {
  warehouses?: string[];
  invoiceTypes?: InvoiceType[];
  onConfirm?: (payload: {
    warehouse: string;
    typeId: string;
    items: InvoiceItem[];
  }) => void;
  onBack?: () => void;
}

export default function Upload({
  warehouses = mockWarehouses,
  invoiceTypes = mockInvoiceTypes,
  onConfirm,
  onBack,
}: UploadProps) {
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [warehouse, setWarehouse] = useState(warehouses[0] ?? "");
  const [typeId, setTypeId] = useState(invoiceTypes[0]?.id ?? "");
  const [isDragging, setIsDragging] = useState(false);

  const [step, setStep] = useState<ExtractionStep>("idle");
  const [extractedItems, setExtractedItems] = useState<InvoiceItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  const handleBack = onBack ?? (() => navigate(-1));

  function handleFileSelect(selectedFile: File) {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setStep("idle");
    setExtractedItems([]);
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
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) handleFileSelect(droppedFile);
  }

  function handleStartExtraction() {
    if (!file) return;
    setStep("extracting");

    setTimeout(() => {
      setExtractedItems(mockExtractedItems);
      setStep("extracted");
    }, 1500);
  }

  function handleItemChange(
    id: string,
    field: keyof InvoiceItem,
    value: string | number,
  ) {
    setExtractedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  }

  function handleConfirm() {
    if (onConfirm) {
      onConfirm({ warehouse, typeId, items: extractedItems });
    } else {
      console.log("Invoice Confirmed:", {
        file,
        warehouse,
        typeId,
        items: extractedItems,
      });
      navigate("/invoices");
    }
  }

  function handleReject() {
    if (confirm("Are you sure you want to reject and discard this invoice?")) {
      setFile(null);
      setPreviewUrl(null);
      setStep("idle");
      setExtractedItems([]);
      setIsEditing(false);
    }
  }

  function handleCheckManually() {
    setIsEditing(true);
  }

  const calculatedTotal = extractedItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );

  return (
    <div className="inv-pg">
      <div className="inv-pg-head">
        <div>
          <h1 className="inv-pg-title">Upload & extract supplier invoice</h1>
          <p className="inv-pg-subtitle">
            Upload your PDF invoice to extract products, quantities, and
            pricing.
          </p>
        </div>
        <button className="inv-btn inv-btn--ghost" onClick={handleBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back
        </button>
      </div>

      <div className="inv-upload-grid">
        <div className="inv-left-panel">
          <div className="inv-card inv-upload-card">
            <div className="inv-filters-row">
              <div className="inv-field">
                <label className="inv-label">Invoice Type</label>
                <select
                  className="inv-select"
                  value={typeId}
                  disabled={step === "extracting"}
                  onChange={(e) => setTypeId(e.target.value)}
                >
                  {invoiceTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="inv-field">
                <label className="inv-label">Destination Warehouse</label>
                <select
                  className="inv-select"
                  value={warehouse}
                  disabled={step === "extracting"}
                  onChange={(e) => setWarehouse(e.target.value)}
                >
                  {warehouses.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {step === "idle" && (
              <div className="inv-field">
                <label className="inv-label">Invoice Document</label>
                <label
                  className={`inv-dropzone ${isDragging ? "inv-dropzone--active" : ""} ${
                    file ? "inv-dropzone--has-file" : ""
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
                  <div className="inv-dropzone-content">
                    {file ? (
                      <div className="inv-file-info">
                        <span className="inv-file-name">{file.name}</span>
                        <span className="inv-file-size">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </div>
                    ) : (
                      <div>
                        <p className="inv-dropzone-text">
                          <strong>Click to browse</strong> or drag & drop PDF
                          here
                        </p>
                        <span className="inv-dropzone-hint">
                          Supports PDF, PNG, JPG (Max 10MB)
                        </span>
                      </div>
                    )}
                  </div>
                </label>

                {file && (
                  <button
                    className="inv-btn inv-btn--primary inv-upload-btn"
                    onClick={handleStartExtraction}
                  >
                    Extract PDF Data
                  </button>
                )}
              </div>
            )}
          </div>

          {step === "extracting" && (
            <div className="inv-card inv-loading-card">
              <div className="inv-spinner" />
              <h3>Extracting line items...</h3>
              <p>Analyzing document structure, tables, and product details.</p>
            </div>
          )}

          {step === "extracted" && (
            <div className="inv-card inv-extracted-card">
              <div className="inv-extracted-header">
                <div>
                  <h3>Extracted Line Items</h3>
                  <p className="inv-subtext">
                    {isEditing
                      ? "Manual editing mode active — edit values below"
                      : "Review extracted items before confirming"}
                  </p>
                </div>
                <span className="inv-badge inv-badge--extracted">
                  {extractedItems.length} items found
                </span>
              </div>

              <div className="inv-table-wrapper">
                <table className="inv-tbl">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th style={{ width: 80 }}>Qty</th>
                      <th style={{ width: 100 }}>Unit Price</th>
                      <th style={{ width: 90 }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extractedItems.map((item) => (
                      <tr key={item.id}>
                        <td>
                          {isEditing ? (
                            <input
                              className="inv-input inv-input--sm"
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
                              className="inv-input inv-input--sm"
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
                        <td>
                          {isEditing ? (
                            <input
                              className="inv-input inv-input--sm"
                              type="number"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) =>
                                handleItemChange(
                                  item.id,
                                  "unitPrice",
                                  Number(e.target.value),
                                )
                              }
                            />
                          ) : (
                            `$${item.unitPrice.toFixed(2)}`
                          )}
                        </td>
                        <td style={{ fontWeight: 700 }}>
                          ${(item.quantity * item.unitPrice).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td
                        colSpan={3}
                        style={{ textAlign: "right", fontWeight: 700 }}
                      >
                        Total:
                      </td>
                      <td style={{ fontWeight: 800, color: "#0f172a" }}>
                        ${calculatedTotal.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="inv-actions-row">
                <button className="inv-btn inv-btn--primary" onClick={handleConfirm}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Confirm
                </button>

                {!isEditing && (
                  <button
                    className="inv-btn inv-btn--ghost"
                    onClick={handleCheckManually}
                  >
                    Check manually
                  </button>
                )}

                <button className="inv-btn inv-btn--danger" onClick={handleReject}>
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

        <div className="inv-card inv-preview-card">
          <div className="inv-preview-header">
            <h3>Document Preview</h3>
            {file && <span className="inv-file-badge">{file.name}</span>}
          </div>

          <div className="inv-preview-body">
            {previewUrl ? (
              file?.type === "application/pdf" ? (
                <iframe
                  src={previewUrl}
                  title="PDF Upload Preview"
                  className="inv-preview-iframe"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Document Preview"
                  className="inv-preview-img"
                />
              )
            ) : (
              <div className="inv-preview-placeholder">
                <p>Upload a PDF to view preview here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}