import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/login/Login';
import Dashboard from './components/dashboard/dashboard';
import AppLayout from './components/layouts/AppLayout';

import InvoicesList from './components/invoices/list';
import InvoiceUpload from './components/invoices/upload';
import InvoiceReview from './components/invoices/review';
import StockLedger from './components/stock/ledger';
import Inventory from './components/stock/inventory';
import CustomerOrder from './components/orders/order';
import StockTransfer from './components/stock/transfer';
import Warehouses from './components/warehouse/warehouse';
import Products from './components/products/products';  
import Users from './components/users/userList';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/warehouses" element={<Warehouses />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/ledger" element={<StockLedger  />} />
          <Route path="/invoices" element={<InvoicesList />} />
          <Route path="/invoices/upload" element={<InvoiceUpload />} />
          <Route path="/invoices/review/{id}  " element={<InvoiceReview />} />
          <Route path="/orders" element={<CustomerOrder />} />
          <Route path="/transfers" element={<StockTransfer />} />
          <Route path="/users" element={<Users />} />
          <Route path="/products" element={<Products />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}