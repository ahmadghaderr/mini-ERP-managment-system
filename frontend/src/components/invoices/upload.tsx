import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./invoices.css";
import type { Warehouse } from "../../types/warehouse";
import { fetchWarehouses } from "../../services/warehouse-service";
import { uploadAndExtractSupplierInvoice } from "../../services/invoice-service";

type ExtractionStep = "idle" | "extracting";

export default function Upload() {
  const navigate = useNavigate();

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [step, setStep] = useState<ExtractionStep>("idle");

  useEffect(() => {
    let cancelled = false;
    fetchWarehouses().then((data) => {
      if (cancelled) return;
      setWarehouses(data);
      setWarehouseId((current) => current || (data[0]?.id ?? ""));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleBack = () => navigate(-1);

  function handleFileSelect(selectedFile: File) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
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

  async function handleStartExtraction() {
    if (!file) return;
    if (!warehouseId) {
      alert("Please select a destination warehouse.");
      return;
    }

    setStep("extracting");
    try {
      const { invoice, lowConfidenceFields } = await uploadAndExtractSupplierInvoice(
        file,
        warehouseId,
      );
      if (lowConfidenceFields.length > 0) {
        alert(
          `Extraction complete, but double-check these fields:\n${lowConfidenceFields.join("\n")}`,
        );
      }
      navigate(`/invoices/review/${invoice.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not extract invoice data.");
      setStep("idle");
    }
  }

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
                <label className="inv-label">Destination Warehouse</label>
                <select
                  className="inv-select"
                  value={warehouseId}
                  disabled={step === "extracting"}
                  onChange={(e) => setWarehouseId(e.target.value)}
                >
                  {warehouses.length === 0 && <option value="">No warehouses available</option>}
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.warehouseName}
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
