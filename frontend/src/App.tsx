import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/login/Login';
import Dashboard from './components/Dashboard';
import AppLayout from './components/layouts/AppLayout';

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
          <Route path="/warehouses" element={<Placeholder title="Warehouses" />} />
          <Route path="/products" element={<Placeholder title="Products" />} />
          <Route path="/inventory" element={<Placeholder title="Inventory" />} />
          <Route path="/ledger" element={<Placeholder title="Ledger" />} />
          <Route path="/invoices" element={<Placeholder title="Supplier Invoices" />} />
          <Route path="/supplier-orders" element={<Placeholder title="Supplier Orders" />} />
          <Route path="/orders" element={<Placeholder title="Customer Orders" />} />
          <Route path="/transfers" element={<Placeholder title="Transfers" />} />
          <Route path="/users" element={<Placeholder title="Users" />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}