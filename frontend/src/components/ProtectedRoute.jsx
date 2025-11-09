import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, roles }) {
  const { user, role } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  if (roles && roles.length > 0) {
    if (!roles.includes(role || 'guest')) return <Navigate to="/403" replace />;
  }
  return children;
}

export default ProtectedRoute;
