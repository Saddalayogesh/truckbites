import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import LoadingSpinner from '../components/LoadingSpinner';

const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const Home = lazy(() => import('../pages/Home'));
const TruckDiscovery = lazy(() => import('../pages/TruckDiscovery'));
const TruckMenu = lazy(() => import('../pages/TruckMenu'));
const Cart = lazy(() => import('../pages/Cart'));
const Checkout = lazy(() => import('../pages/Checkout'));
const OrderTracking = lazy(() => import('../pages/OrderTracking'));
const OrderHistory = lazy(() => import('../pages/OrderHistory'));
const VendorDashboard = lazy(() => import('../pages/VendorDashboard'));
const VendorAnalytics = lazy(() => import('../pages/VendorAnalytics'));
const AdminDashboard = lazy(() => import('../pages/AdminDashboard'));
const FavoritesPage = lazy(() => import('../pages/FavoritesPage'));
const Profile = lazy(() => import('../pages/Profile'));
const ForgotPassword = lazy(() => import('../pages/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/ResetPassword'));
const Pricing = lazy(() => import('../pages/Pricing'));
const NotFound = lazy(() => import('../pages/NotFound'));

function SuspenseWrapper({ children }) {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><LoadingSpinner size="lg" text="Loading..." /></div>}>
      {children}
    </Suspense>
  );
}

export default function AppRoutes() {
  return (
    <SuspenseWrapper>
    <Routes>
      {/* Public routes — anyone can browse trucks */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/discover" element={<TruckDiscovery />} />
      <Route path="/" element={<Home />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/pricing" element={<Pricing />} />

      {/* Customer-only routes (require auth) */}
      <Route path="/trucks/:id/menu" element={<TruckMenu />} />
      <Route
        path="/favorites"
        element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <FavoritesPage />
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
      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={['CUSTOMER', 'VENDOR', 'ADMIN']}>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* Vendor routes */}
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

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
    </SuspenseWrapper>
  );
}
