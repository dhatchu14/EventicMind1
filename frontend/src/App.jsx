import { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, useLocation, useNavigate } from "react-router-dom";

// UI and Utils
import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from 'lucide-react';

// Core Components
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Page/Route Components
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
import CartPage from '@/components/CartPage'; // <--- IMPORT CartPage

// Context Provider
import { CartProvider } from '@/components/CartContext'; // Make sure path is correct

// --- Protected Route Component for Admin (Keep as is) ---
const AdminProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const checkAdminAuth = () => {
      setIsChecking(true);
      const userString = localStorage.getItem('currentUser');
      let isAdmin = false;
      if (userString) {
        try {
          const user = JSON.parse(userString);
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
          if (!isAdmin) {
            navigate('/admin/login', { replace: true, state: { from: location } });
          }
      }
    };
    checkAdminAuth();
    const handleAuthChange = () => checkAdminAuth();
    window.addEventListener('userLogin', handleAuthChange);
    window.addEventListener('userLogout', handleAuthChange);
    return () => {
        isMounted = false;
        window.removeEventListener('userLogin', handleAuthChange);
        window.removeEventListener('userLogout', handleAuthChange);
    };
  }, [navigate, location]);

  if (isChecking) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-theme(space.16)-theme(space.16))]">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }
  return isAdminAuthenticated ? children : null;
};


function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      try { return JSON.parse(savedDarkMode); } catch { return false; }
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) { document.documentElement.classList.add('dark'); }
    else { document.documentElement.classList.remove('dark'); }
  }, [darkMode]);


  return (
    <CartProvider> {/* CartProvider wraps the entire routing structure */}
      <Router>
        <div className={`${darkMode ? "dark" : ""} overflow-x-hidden min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100`}>
          <Toaster position="top-right" richColors closeButton />
          <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
          <main className="flex-grow pt-16">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Cartopia />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/blogs" element={<BlogPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/cart" element={<CartPage />} /> {/* <--- ADDED CART ROUTE */}

              {/* Regular User Auth Routes (Should be protected) */}
              {/* Example: <Route path="/orders" element={<UserProtectedRoute><OrderHistory /></UserProtectedRoute>} /> */}
              <Route path="/orders" element={<OrderHistory />} />

              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route
                path="/admin/dashboard/*"
                element={
                  <AdminProtectedRoute>
                    <AdminDashboard />
                  </AdminProtectedRoute>
                }
              />

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