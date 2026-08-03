import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';

import Login from '../pages/Login';
import Register from '../pages/Register';
import Home from '../pages/Home';
import TruckDiscovery from '../pages/TruckDiscovery';
import TruckMenu from '../pages/TruckMenu';
import Cart from '../pages/Cart';
import Checkout from '../pages/Checkout';
import OrderTracking from '../pages/OrderTracking';
import OrderHistory from '../pages/OrderHistory';
import VendorDashboard from '../pages/VendorDashboard';
import VendorAnalytics from '../pages/VendorAnalytics';
import AdminDashboard from '../pages/AdminDashboard';
import FavoritesPage from '../pages/FavoritesPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Customer routes */}
      <Route
        path="/discover"
        element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <TruckDiscovery />
          </ProtectedRoute>
        }
      />
      <Route
        path="/trucks"
        element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <TruckDiscovery />
          </ProtectedRoute>
        }
      />
      <Route
        path="/favorites"
        element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <FavoritesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/trucks/:id/menu"
        element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <TruckMenu />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cart"
        element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <Cart />
          </ProtectedRoute>
        }
      />
      <Route
        path="/checkout"
        element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <Checkout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <OrderTracking />
          </ProtectedRoute>
        }
      />
      <Route
        path="/order-history"
        element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <OrderHistory />
          </ProtectedRoute>
        }
      />

      {/* Vendor routes */}
      <Route
        path="/vendor-dashboard"
        element={
          <ProtectedRoute allowedRoles={['VENDOR']}>
            <VendorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/analytics"
        element={
          <ProtectedRoute allowedRoles={['VENDOR']}>
            <VendorAnalytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/*"
        element={
          <ProtectedRoute allowedRoles={['VENDOR']}>
            <VendorDashboard />
          </ProtectedRoute>
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Landing page */}
      <Route path="/" element={<Home />} />

      {/* Default redirect */}
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
