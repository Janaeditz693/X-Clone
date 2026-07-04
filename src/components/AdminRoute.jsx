import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function AdminRoute({ children }) {
  const { currentUser, userData, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-brand-bg dark:bg-brand-darkBg">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (userData?.role !== 'admin') {
    toast.error("Access denied. Admin privileges required.", { id: 'admin-denied' });
    return <Navigate to="/" replace />;
  }

  return children;
}
