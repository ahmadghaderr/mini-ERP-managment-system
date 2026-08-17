import type { LedgerEntry, OpeningStockRow, StockLevel } from "../../types/stock";

export const openingStock: OpeningStockRow[] = [
  { productName: "Bottled Water 500ml", warehouseName: "Main Warehouse", quantity: 800 },
  { productName: "Canned Beans", warehouseName: "Main Warehouse", quantity: 400 },
  { productName: "Rice 1kg", warehouseName: "Main Warehouse", quantity: 250 },
  { productName: "Bottled Water 500ml", warehouseName: "North Branch", quantity: 120 },
  { productName: "Canned Beans", warehouseName: "North Branch", quantity: 80 },
  { productName: "Rice 1kg", warehouseName: "North Branch", quantity: 150 },
  { productName: "Bottled Water 500ml", warehouseName: "South Hub", quantity: 200 },
  { productName: "water", warehouseName: "South Hub", quantity: 100 },
  { productName: "Canned Beans", warehouseName: "South Hub", quantity: 60 },
  { productName: "Rice 1kg", warehouseName: "South Hub", quantity: 90 },
];

export function rowKey(productName: string, warehouseName: string) {
  return `${productName}__${warehouseName}`;
}

export function computeStockLevels(entries: LedgerEntry[]): StockLevel[] {
  const totals = new Map<string, number>();

  openingStock.forEach((row) => {
    totals.set(rowKey(row.productName, row.warehouseName), row.quantity);
  });

  entries.forEach((entry) => {
    if (entry.toWarehouse) {
      const k = rowKey(entry.productName, entry.toWarehouse);
      totals.set(k, (totals.get(k) ?? 0) + entry.quantity);
    }
    if (entry.fromWarehouse) {
      const k = rowKey(entry.productName, entry.fromWarehouse);
      totals.set(k, (totals.get(k) ?? 0) - entry.quantity);
    }
  });

  return Array.from(totals.entries()).map(([key, quantity]) => {
    const [productName, warehouseName] = key.split("__");
    return { productName, warehouseName, quantity };
  });
}