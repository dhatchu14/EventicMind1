import { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, useLocation, useNavigate } from "react-router-dom";

// UI and Utils
import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from 'lucide-react'; // For loading state in protected route

// Core Components
import Navbar from "@/components/Navbar"; // Updated Navbar component name
import Footer from "@/components/Footer";

// Page/Route Components
import Login from "@/components/Login"; // Regular User Login
import SignupPage from "@/components/Signup";
import BlogPage from "@/components/BlogPage";
import AboutPage from "@/components/AboutPage";
import Cartopia from "@/components/HeroSection"; // Homepage (HeroSection)
import OrderHistory from '@/components/OrderHistory';
import AdminLoginPage from '@/components/AdminLogin'; // Renamed Admin Login Component
import AdminDashboard from '@/components/AdminDashboard';

// --- Protected Route Component for Admin ---
const AdminProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(null); // null = checking, false = no, true = yes
  const [isChecking, setIsChecking] = useState(true); // Explicit checking state

  useEffect(() => {
    let isMounted = true; // Prevent state update on unmounted component

    const checkAdminAuth = () => {
      setIsChecking(true); // Start check
      const userString = localStorage.getItem('currentUser'); // Check the key used by AdminLogin
      let isAdmin = false;
      if (userString) {
        try {
          const user = JSON.parse(userString);
          // ** Crucial Validation **
          if (user && user.role === 'admin' && user.email === 'admin@steer.com') {
            isAdmin = true;
          } else {
             console.warn("Invalid admin data found in localStorage.");
             localStorage.removeItem('currentUser'); // Clean up invalid data
          }
        } catch (e) {
          console.error("Failed to parse admin user from localStorage", e);
          localStorage.removeItem('currentUser'); // Clean up corrupted data
        }
      }

      if (isMounted) {
          setIsAdminAuthenticated(isAdmin);
          setIsChecking(false); // Finish check

          if (!isAdmin) {
            // Redirect them to the admin login page, saving the location they were trying to access
            navigate('/admin/login', { replace: true, state: { from: location } });
          }
      }
    };

    checkAdminAuth();

    // Re-check if the user logs in/out while the app is open
    const handleAuthChange = () => checkAdminAuth();
    window.addEventListener('userLogin', handleAuthChange);
    window.addEventListener('userLogout', handleAuthChange); // Listen for logout too

    return () => {
        isMounted = false; // Cleanup listener flag
        window.removeEventListener('userLogin', handleAuthChange);
        window.removeEventListener('userLogout', handleAuthChange);
    };

  }, [navigate, location]); // Rerun if navigation or location changes

  // Show a loader while checking authentication
  if (isChecking) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-theme(space.16)-theme(space.16))]">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  // If authenticated, render the child components (the dashboard)
  // If not authenticated, the redirect happens in useEffect, so returning null is fine
  return isAdminAuthenticated ? children : null;
};


function App() {
  const [darkMode, setDarkMode] = useState(false);

  // Load dark mode preference from localStorage on initial load
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    // Check for null/undefined explicitly
    if (savedDarkMode !== null) {
      try {
          setDarkMode(JSON.parse(savedDarkMode));
      } catch (error) {
          console.error("Failed to parse dark mode from localStorage", error);
          setDarkMode(false); // Default to false on error
      }
    } else {
        // Optional: Check system preference if no setting saved
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        setDarkMode(prefersDark);
    }
  }, []);

  // Save dark mode preference and apply class to HTML element
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);


  return (
    <Router>
      {/* Apply dark mode class to the root div for component-level styling */}
      <div className={`${darkMode ? "dark" : ""} overflow-x-hidden min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100`}>
        <Toaster position="top-right" richColors closeButton /> {/* Add Sonner Toaster */}
        <Navbar darkMode={darkMode} setDarkMode={setDarkMode} /> {/* Pass props to Navbar */}
        <main className="flex-grow pt-16"> {/* Adjust pt-16 if navbar height changes */}
          <Routes>
            {/* --- Public Routes --- */}
            <Route path="/" element={<Cartopia />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/blogs" element={<BlogPage />} />
            <Route path="/about" element={<AboutPage />} />
            {/* Example: <Route path="/shop" element={<ShopPage />} /> */}

            {/* --- Regular User Authenticated Routes --- */}
            {/* TODO: Add protection for these routes if needed */}
                        <Route path="/orders" element={<OrderHistory />} />

            {/* --- Admin Routes --- */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route
              path="/admin/dashboard"
              element={
                <AdminProtectedRoute>
                  <AdminDashboard />
                </AdminProtectedRoute>
              }
            />
             {/* Optional: Add more admin routes inside the protection structure if needed */}
             {/* Example:
             <Route
              path="/admin/users"
              element={
                <AdminProtectedRoute>
                  <AdminUserManagement />
                </AdminProtectedRoute>
              }
            /> */}

            {/* --- Optional: Catch-all 404 Route --- */}
            {/* <Route path="*" element={<NotFoundPage />} /> */}

          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;