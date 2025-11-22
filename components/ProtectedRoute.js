// components/ProtectedRoute.js
import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/auth';

const ProtectedRoute = ({ children, allowedRoles = ['Admin', 'Manager', 'User'] }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Wait for auth check

    if (!user) {
      // Not logged in: redirect to login
      router.push('/');
    } else if (!allowedRoles.includes(user.role)) {
      // Logged in but unauthorized for this page: redirect to dashboard
      router.push('/dashboard'); 
    }
  }, [user, loading, router, allowedRoles]);

  if (loading || !user || !allowedRoles.includes(user?.role)) {
    // Show a loading state or nothing while the redirect happens
    return <div className="p-10 text-center">Loading or checking permissions...</div>;
  }

  // If authenticated and authorized
  return <>{children}</>;
};

export default ProtectedRoute;