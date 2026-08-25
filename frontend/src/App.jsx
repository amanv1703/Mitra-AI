import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DateRangeProvider } from './context/DateRangeContext';

import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Payments from './pages/Payments';
import Orders from './pages/Orders';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import Refunds from './pages/Refunds';
import DetectedSignals from './pages/DetectedSignals';
import Simulator from './pages/Simulator';
import AuditLogs from './pages/AuditLogs';
import Actions from './pages/Actions';

export function App() {
  return (
    <BrowserRouter>
      <DateRangeProvider>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="payments" element={<Payments />} />
            <Route path="orders" element={<Orders />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="customers" element={<Customers />} />
            <Route path="refunds" element={<Refunds />} />
            <Route path="insights" element={<DetectedSignals />} />
            <Route path="actions" element={<Actions />} />
            <Route path="simulator" element={<Simulator />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </DateRangeProvider>
    </BrowserRouter>
  );
}

export default App;
