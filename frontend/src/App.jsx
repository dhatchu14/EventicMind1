// src/App.jsx (or your main App file)
import { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, useLocation, useNavigate, Outlet } from "react-router-dom"; // Make sure Outlet is imported

// UI and Utils
import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from 'lucide-react';

// Core Components
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Page/Route Components (ensure paths match your structure, e.g., @/pages/Login if in pages folder)
import Login from "@/components/Login";
import SignupPage from "@/components/Signup";
import BlogPage from "@/components/BlogPage";
import AboutPage from "@/components/AboutPage";
import Cartopia from "@/components/HeroSection";
import OrderHistory from '@/components/OrderHistory';
import AdminLoginPage from '@/components/AdminLogin';
import AdminDashboard from '@/components/AdminDashboard';
import Shop from '@/components/Shop';
import ProductDetails from '@/components/ProductDetails';
import CartPage from '@/components/CartPage';

// Context Provider
import { CartProvider } from '@/components/CartContext';

// --- Import the UPDATED ProtectedRoute for standard users ---
import ProtectedRoute from '@/components/ProtectedRoute'; // Adjust path if needed

// --- Keep the existing AdminProtectedRoute (ensure it works for your admin logic) ---
const AdminProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // This Admin check *still* relies on 'currentUser' and specific logic.
    // If your admin login also sets 'accessToken', you might want to
    // refactor this or enhance ProtectedRoute to handle roles based on the token.
    let isMounted = true;
    const checkAdminAuth = () => {
      setIsChecking(true);
      const userString = localStorage.getItem('currentUser');
      let isAdmin = false;
      if (userString) {
        try {
          const user = JSON.parse(userString);
          // Your specific admin check
          if (user && user.role === 'admin' && user.email === 'admin@steer.com') {
            isAdmin = true;
          }
        } catch (e) {
          console.error("Failed to parse user for admin check", e);
        }
      }
      if (isMounted) {
          setIsAdminAuthenticated(isAdmin);
          setIsChecking(false);
          // Redirect immediately if check fails and component is still mounted
          if (!isAdmin && !isChecking) { // Avoid redirect race condition
              console.warn("AdminProtectedRoute: User is not admin or check failed. Redirecting.");
              navigate('/admin/login', { replace: true, state: { from: location } });
          }
      }
    };

    checkAdminAuth();

    // Consider if these event listeners are necessary or reliable for your flow
    // const handleAuthChange = () => checkAdminAuth();
    // window.addEventListener('userLogin', handleAuthChange);
    // window.addEventListener('userLogout', handleAuthChange);

    return () => {
        isMounted = false;
        // window.removeEventListener('userLogin', handleAuthChange);
        // window.removeEventListener('userLogout', handleAuthChange);
    };
    // Rerun check if location changes (e.g., trying to access different admin sub-pages)
  }, [navigate, location, isChecking]); // Dependency check might need refinement based on behavior

  if (isChecking) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  // Render children only if admin check passed. Redirect handled in useEffect.
  // Returning null prevents rendering content before redirect effect runs.
  return isAdminAuthenticated ? children : null;
};


function App() {
  const [darkMode, setDarkMode] = useState(() => {
    // Keep your existing dark mode logic
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      try { return JSON.parse(savedDarkMode); } catch { return false; }
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });

  useEffect(() => {
    // Keep your existing dark mode effect
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) { document.documentElement.classList.add('dark'); }
    else { document.documentElement.classList.remove('dark'); }
  }, [darkMode]);


  return (
    <CartProvider>
      <Router>
        <div className={`${darkMode ? "dark" : ""} overflow-x-hidden min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100`}>
          <Toaster position="top-right" richColors closeButton />
          <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
          <main className="flex-grow pt-16"> {/* Adjust padding-top if needed */}
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Cartopia />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/blogs" element={<BlogPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/shop" element={<Shop />} />
              {/* Product Details is now moved to protected section below */}

              {/* Admin Routes - Use the specific AdminProtectedRoute */}
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route
                path="/admin/dashboard/*"
                element={
                  <AdminProtectedRoute>
                    <AdminDashboard />
                  </AdminProtectedRoute>
                }
              />

              {/* --- Protected User Routes --- */}
              {/* Use the layout route approach for cleaner code */}
              <Route element={<ProtectedRoute />}>
                {/* Routes nested here require a valid 'accessToken' */}
                <Route path="/product/:id" element={<ProductDetails />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/orders" element={<OrderHistory />} />
                {/* Add any other routes that require standard user login */}
                {/* e.g., <Route path="/profile" element={<UserProfile />} /> */}
              </Route>

              {/* Catch-all (Optional) */}
              {/* <Route path="*" element={<NotFoundPage />} /> */}

            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;