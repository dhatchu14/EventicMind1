// src/components/ProtectedRoute.jsx (or adjust path as needed)
import React, { useState, useEffect } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom'; // Import Outlet if using layout approach
import { Loader2 } from 'lucide-react'; // Using a consistent loader

// This ProtectedRoute checks for the user's JWT ('accessToken')
const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = checking, true = yes, false = no
  const location = useLocation();

  useEffect(() => {
    // Check for the JWT token stored by your Login component
    const token = localStorage.getItem('accessToken');

    // Basic check: does the token exist?
    // For production: Add token validation (expiry check, maybe quick API verify)
    setIsAuthenticated(!!token);

    // No dependencies needed if checking on every render/location change,
    // or add [location] if you only want to check when the route changes.
  }, [location]); // Re-check when location changes

  // Show loading indicator while checking auth status
  if (isAuthenticated === null) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"> {/* Adjust min-height if needed */}
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  // If not authenticated, redirect to the standard user login page
  if (!isAuthenticated) {
    // Pass the current location the user was trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated, render the child component(s)
  // If using this wrapper directly (<ProtectedRoute><MyPage /></ProtectedRoute>)
  // return children;
  // If using this as a layout route (<Route element={<ProtectedRoute />}>...</Route>)
  return <Outlet />; // Render the nested route defined in App.jsx
};

export default ProtectedRoute;