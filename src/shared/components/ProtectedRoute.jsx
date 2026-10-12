import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext';

const ProtectedRoute = ({ requiredPermission }) => {
  const { user, hasPermission } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    // Yetkisi yoksa izinsiz sayfasına veya anasayfaya atabiliriz
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
