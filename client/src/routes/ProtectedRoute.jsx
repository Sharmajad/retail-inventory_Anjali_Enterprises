import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = () => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center text-[#14324B]">
        <div className="flex items-center gap-3">
          <span className="w-5 h-5 border-2 border-[#14324B] border-t-transparent rounded-full animate-spin"></span>
          <span className="font-semibold text-sm">Verifying session...</span>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export const OwnerRoute = () => {
  const { isOwner, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center text-[#14324B]">
        <div className="flex items-center gap-3">
          <span className="w-5 h-5 border-2 border-[#14324B] border-t-transparent rounded-full animate-spin"></span>
          <span className="font-semibold text-sm">Verifying permissions...</span>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return <Navigate to="/pos" replace />;
  }

  return <Outlet />;
};
