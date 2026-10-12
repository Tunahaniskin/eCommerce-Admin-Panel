import { createBrowserRouter, Navigate } from 'react-router-dom';
import AdminLayout from '../shared/components/Layout/AdminLayout';
import ProtectedRoute from '../shared/components/ProtectedRoute';

import ProductsPage from '../features/products/pages/ProductsPage';
import CategoriesPage from '../features/products/pages/CategoriesPage';
import UsersPage from '../features/users/pages/UsersPage';
import RolesPage from '../features/roles/pages/RolesPage';
import LogsPage from '../features/logs/pages/LogsPage';
import LoginPage from '../features/auth/pages/LoginPage';
import DepositTicketsPage from '../features/finance/pages/DepositTicketsPage';
import ProfilePage from '../features/profile/pages/ProfilePage';
import OrdersPage from '../features/orders/pages/OrdersPage';
import DashboardPage from '../features/dashboard/pages/DashboardPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <AdminLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/dashboard" replace />
          },
          {
            path: 'dashboard',
            element: <DashboardPage />
          },
          {
            path: 'products',
            element: <ProductsPage />
          },
          {
            path: 'categories',
            element: <CategoriesPage />
          },
          {
            path: 'users',
            element: <UsersPage />
          },
          {
            path: 'roles',
            element: <RolesPage />
          },
          {
            path: 'logs',
            element: <LogsPage />
          },
          {
            path: 'finance/tickets',
            element: <DepositTicketsPage />
          },
          {
            path: 'orders',
            element: <OrdersPage />
          },
          {
            path: 'profile',
            element: <ProfilePage />
          }
        ]
      }
    ]
  }
]);
