import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/store/authStore';
import { ALLOWED_ADMIN_ROLES, RoleType } from '@/constants/enums';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: RoleType[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRole = user.role as RoleType;

  // General check: user must have an admin-compatible role
  if (!ALLOWED_ADMIN_ROLES.includes(userRole)) {
    return <Navigate to="/login" replace />;
  }

  // Specific route role restrictions (e.g. only SUPER_ADMIN or ADMIN)
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <>{children}</>;
};

