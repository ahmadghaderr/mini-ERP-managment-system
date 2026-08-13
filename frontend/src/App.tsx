import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/login/Login';
import Dashboard from './components/Dashboard';
import AppLayout from './components/layouts/AppLayout';

import InvoicesList from './components/invoices/list';
import InvoiceUpload from './components/invoices/upload';
import InvoiceReview from './components/invoices/review';
import StockLedger from './components/stock/ledger';
import StockTransfer from './components/stock/transfer';
import Warehouses from './components/warehouse/warehouse';

function Placeholder({ title }: { title: string }) {
  return <h2>{title} (placeholder)</h2>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/warehouses" element={<Warehouses />} />
          <Route path="/products" element={<Placeholder title="Products" />} />
          <Route path="/inventory" element={<Placeholder title="Inventory" />} />
          <Route path="/ledger" element={<StockLedger />} />
          <Route path="/invoices" element={<InvoicesList />} />
          <Route path="/invoices/upload" element={<InvoiceUpload />} />
          <Route path="/invoices/review" element={<InvoiceReview />} />
          <Route path="/supplier-orders" element={<Placeholder title="Supplier Orders" />} />
          <Route path="/orders" element={<Placeholder title="Customer Orders" />} />
          <Route path="/transfers" element={<StockTransfer />} />
          <Route path="/users" element={<Placeholder title="Users" />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}