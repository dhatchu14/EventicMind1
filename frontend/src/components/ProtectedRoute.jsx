// src/components/ProtectedRoute.jsx (or adjust path as needed)
import React from 'react'; // No longer need useState/useEffect here
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react'; // Using a consistent loader
import { useAuth } from '@/contexts/AuthContext'; // <-- Import useAuth

// This ProtectedRoute now relies on AuthContext for auth status
const ProtectedRoute = () => {
  // Get authentication status and loading state DIRECTLY from the context
  const { isLoggedIn, isLoading } = useAuth();
  const location = useLocation();

  console.log(`ProtectedRoute: isLoading=${isLoading}, isLoggedIn=${isLoggedIn}, location=${location.pathname}`); // Add log for debugging

  // 1. Show loading indicator while the AuthContext is determining the auth status
  // This prevents redirects before the initial check (e.g., validating token) is complete
  if (isLoading) {
    console.log("ProtectedRoute: Auth context is loading, showing loader.");
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"> {/* Adjust min-height if needed */}
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  // 2. If context is done loading and user is NOT logged in, redirect
  if (!isLoggedIn) {
    console.log(`ProtectedRoute: User not logged in, redirecting to /login from ${location.pathname}.`);
    // Pass the current location so the user can be redirected back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. If context is done loading and user IS logged in, render the child route element
  console.log(`ProtectedRoute: User logged in, rendering Outlet for ${location.pathname}.`);
  return <Outlet />; // Render the nested route defined in App.jsx (e.g., OrderHistory)
};

export default ProtectedRoute;