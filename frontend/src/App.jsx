// src/App.jsx
import { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

// Context Providers
import { AuthProvider } from '@/contexts/AuthContext'; // *** IMPORT AuthProvider ***
import { CartProvider } from '@/components/CartContext'; // Path to your CartContext

// UI and Utils
import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from 'lucide-react'; // Keep if used elsewhere, e.g., ProtectedRoute

// Core Components
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Page/Route Components
import Login from "@/components/Login";
import SignupPage from "@/components/Signup";
import BlogPage from "@/components/BlogPage";
import AboutPage from "@/components/AboutPage";
import Cartopia from "@/components/HeroSection"; // Assuming this is your home page component
import OrderHistory from '@/components/OrderHistory';
// Removed AdminLoginPage, AdminDashboard imports if not needed
import Shop from '@/components/Shop';
import ProductDetails from '@/components/ProductDetails';
import CartPage from '@/components/CartPage';

// Route Protection Components
import ProtectedRoute from '@/components/ProtectedRoute'; // Keep your standard user ProtectedRoute

function App() {
  // DarkMode state and effect (Keep as is)
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
    // *** Wrap everything inside Router with AuthProvider ***
    <Router>
      <AuthProvider>
        {/* CartProvider needs to be INSIDE AuthProvider to use useAuth */}
        <CartProvider>
          <div className={`${darkMode ? "dark" : ""} overflow-x-hidden min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100`}>
            <Toaster position="top-right" richColors closeButton />
            {/* Navbar is inside both Providers, can use useAuth() and useCart() */}
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

                {/* --- REMOVED Admin Routes Section --- */}

                {/* Protected User Routes - Ensure ProtectedRoute uses useAuth */}
                <Route element={<ProtectedRoute />}> {/* Layout Route for protection */}
                  <Route path="/product/:id" element={<ProductDetails />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/orders" element={<OrderHistory />} />
                  {/* Add any other routes that require standard user login */}
                  {/* e.g., <Route path="/profile" element={<UserProfile />} /> */}
                </Route>

                {/* Optional Catch-all */}
                {/* <Route path="*" element={<NotFoundPage />} /> */}
              </Routes>
            </main>
            <Footer />
          </div>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;