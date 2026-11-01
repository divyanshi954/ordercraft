import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Products from './pages/Products';
import Materials from './pages/Materials';
import Suppliers from './pages/Suppliers';
import Bom from './pages/Bom';
import SalesOrders from './pages/SalesOrders';
import SalesOrderDetail from './pages/SalesOrderDetail';
import PurchaseOrders from './pages/PurchaseOrders';
import Production from './pages/Production';
import Invoices from './pages/Invoices';
import Payments from './pages/Payments';

export const App = () => {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<Login />} />

      {/* Protected Master Layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />

          {/* Role: ADMIN, SALES */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SALES']} />}>
            <Route path="/customers" element={<Customers />} />
            <Route path="/sales-orders" element={<SalesOrders />} />
            <Route path="/sales-orders/:id" element={<SalesOrderDetail />} />
          </Route>

          {/* Role: ADMIN, PRODUCTION */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'PRODUCTION']} />}>
            <Route path="/bom" element={<Bom />} />
            <Route path="/production" element={<Production />} />
          </Route>

          {/* Role: ADMIN, PURCHASE */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'PURCHASE']} />}>
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/purchase-orders" element={<PurchaseOrders />} />
          </Route>

          {/* Role: ADMIN, PURCHASE, PRODUCTION */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'PURCHASE', 'PRODUCTION']} />}>
            <Route path="/materials" element={<Materials />} />
          </Route>

          {/* Role: ADMIN, ACCOUNTS */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'ACCOUNTS']} />}>
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/payments" element={<Payments />} />
          </Route>
        </Route>
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
