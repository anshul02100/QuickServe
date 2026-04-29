import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

import HomePage        from './pages/HomePage';
import LoginPage       from './pages/LoginPage';
import SignupPage      from './pages/SignupPage';
import RestaurantsPage from './pages/RestaurantsPage';
import MenuPage        from './pages/MenuPage';
import CartPage        from './pages/CartPage';
import OrdersPage      from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import ProfilePage     from './pages/ProfilePage';
import GroupOrderPage  from './pages/GroupOrderPage';

import AdminDashboard   from './pages/admin/AdminDashboard';
import AdminRestaurants from './pages/admin/AdminRestaurants';
import AdminMenu        from './pages/admin/AdminMenu';
import AdminOrders      from './pages/admin/AdminOrders';

import DeliveryDashboard from './pages/delivery/DeliveryDashboard';
import Navbar from './components/common/Navbar';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { user, isAdmin } = useAuth();
  if (!user)    return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
};

const DeliveryRoute = ({ children }) => {
  const { user, isDelivery } = useAuth();
  if (!user)      return <Navigate to="/login" replace />;
  if (!isDelivery) return <Navigate to="/" replace />;
  return children;
};

const AppRoutes = () => (
  <>
    <Navbar />
    <Routes>
      <Route path="/"                    element={<HomePage />} />
      <Route path="/login"               element={<LoginPage />} />
      <Route path="/signup"              element={<SignupPage />} />
      <Route path="/restaurants"         element={<RestaurantsPage />} />
      <Route path="/restaurant/:id/menu" element={<MenuPage />} />

      {/* Customer routes */}
      <Route path="/cart"            element={<PrivateRoute><CartPage /></PrivateRoute>} />
      <Route path="/orders"          element={<PrivateRoute><OrdersPage /></PrivateRoute>} />
      <Route path="/orders/:id"      element={<PrivateRoute><OrderDetailPage /></PrivateRoute>} />
      <Route path="/profile"         element={<PrivateRoute><ProfilePage /></PrivateRoute>} />

      {/* Group order — accessible by anyone with the link, but join requires login */}
      <Route path="/group-order/:code" element={<GroupOrderPage />} />

      {/* Admin routes */}
      <Route path="/admin"                    element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/restaurants"        element={<AdminRoute><AdminRestaurants /></AdminRoute>} />
      <Route path="/admin/menu/:restaurantId" element={<AdminRoute><AdminMenu /></AdminRoute>} />
      <Route path="/admin/orders"             element={<AdminRoute><AdminOrders /></AdminRoute>} />

      {/* Delivery routes */}
      <Route path="/delivery" element={<DeliveryRoute><DeliveryDashboard /></DeliveryRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </>
);

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <CartProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { fontSize: '0.875rem', borderRadius: '8px' },
          }}
        />
        <AppRoutes />
      </CartProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
