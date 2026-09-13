import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, OwnerRoute } from './ProtectedRoute';
import DashboardLayout from '../layouts/DashboardLayout';

import Login      from '../pages/Login';
import Dashboard  from '../pages/Dashboard';
import POS        from '../pages/POS';
import Products   from '../pages/Products';
import Sales      from '../pages/Sales';
import Purchases  from '../pages/Purchases';
import Reports    from '../pages/Reports';
import Users      from '../pages/Users';
import ExportData from '../pages/ExportData';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<Login />} />

      {/* Protected Routes inside Layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          {/* Accessible to both Owner & Staff */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pos"       element={<POS />} />
          <Route path="/products"  element={<Products />} />
          <Route path="/sales"     element={<Sales />} />

          {/* Owner Only Routes (Restricted for Staff) */}
          <Route element={<OwnerRoute />}>
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/reports"   element={<Reports />} />
            <Route path="/users"     element={<Users />} />
            <Route path="/export"    element={<ExportData />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback Catch-All */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
