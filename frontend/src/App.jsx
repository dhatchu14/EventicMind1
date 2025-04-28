// src/App.jsx
import { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

// Context Providers
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/components/CartContext';

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
import Shop from '@/components/Shop';
import ProductDetails from '@/components/ProductDetails';
import CartPage from '@/components/CartPage';
import AdminLoginPage from '@/components/AdminLogin';
import Dashboard from '@/components/AdminDashboard';
import Payment from '@/components/Payment'; // <--- 1. IMPORT Payment component

// Route Protection Components
import ProtectedRoute from '@/components/ProtectedRoute';
// import AdminProtectedRoute from '@/components/AdminProtectedRoute';

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
    <Router>
      <AuthProvider>
        <CartProvider>
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
                <Route path="/admin/login" element={<AdminLoginPage />} />

                {/* Admin Routes */}
                {/* <Route element={<AdminProtectedRoute />}> */}
                  <Route path="/admin/dashboard" element={<Dashboard />} />
                {/* </Route> */}


                {/* Protected User Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/product/:id" element={<ProductDetails />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/orders" element={<OrderHistory />} />
                  <Route path="/checkout" element={<Payment />} /> {/* <--- 2. ADD this route */}
                  {/* Add payment processing routes (stripe, cash, razorpay) here if they are separate pages */}
                   {/* <Route path="/stripe" element={<StripePaymentPage />} /> */}
                   {/* <Route path="/cash-on-delivery" element={<CodConfirmationPage />} /> */}
                   {/* <Route path="/razorpay" element={<RazorpayPaymentPage />} /> */}
                   {/* <Route path="/order-success" element={<OrderSuccessPage />} /> */}
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