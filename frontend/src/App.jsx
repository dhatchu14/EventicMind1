import { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, useLocation, useNavigate } from "react-router-dom";

// UI and Utils
import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from 'lucide-react'; // For loading state in protected route

// Core Components
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Page/Route Components
import Login from "@/components/Login";
import SignupPage from "@/components/Signup";
import BlogPage from "@/components/BlogPage";
import AboutPage from "@/components/AboutPage";
import Cartopia from "@/components/HeroSection"; // Homepage (HeroSection)
import OrderHistory from '@/components/OrderHistory';
import AdminLoginPage from '@/components/AdminLogin';
import AdminDashboard from '@/components/AdminDashboard';
import Shop from '@/components/Shop';
import ProductDetails from '@/components/ProductDetails'; // <--- IMPORT ProductDetails

// --- Protected Route Component for Admin ---
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
          if (user && user.role === 'admin' && user.email === 'admin@steer.com') { // Specific admin check
            isAdmin = true;
          } else {
             console.warn("Non-admin or invalid user data found in admin check.");
             // Avoid automatically removing if a regular user might be logged in
             // Consider if 'currentUser' is ONLY for admin or shared
          }
        } catch (e) {
          console.error("Failed to parse user from localStorage for admin check", e);
          // localStorage.removeItem('currentUser'); // Only remove if corrupted and confirmed bad data
        }
      }

      if (isMounted) {
          setIsAdminAuthenticated(isAdmin);
          setIsChecking(false);

          if (!isAdmin) {
            // Redirect non-admins trying to access admin routes
            console.log(`AdminProtectedRoute: User not authenticated as admin. Redirecting from ${location.pathname}`);
            navigate('/admin/login', { replace: true, state: { from: location } });
          } else {
             console.log(`AdminProtectedRoute: Admin user authenticated for ${location.pathname}`);
          }
      }
    };

    checkAdminAuth();

    const handleAuthChange = () => {
        console.log("AdminProtectedRoute: Auth change detected, re-checking admin status.");
        checkAdminAuth();
    };
    // Custom events might be needed if login/logout doesn't refresh the page or trigger standard auth context changes
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

  // Render children only if check is complete AND user is authenticated as admin
  return isAdminAuthenticated ? children : null;
};


function App() {
  const [darkMode, setDarkMode] = useState(() => {
    // Initialize dark mode state directly from localStorage or system preference
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      try {
        return JSON.parse(savedDarkMode);
      } catch {
        return false; // Default to false on parsing error
      }
    }
    // Check system preference if no setting saved
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });

  // Apply dark mode class to HTML element whenever darkMode state changes
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
      <div className={`${darkMode ? "dark" : ""} overflow-x-hidden min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100`}>
        <Toaster position="top-right" richColors closeButton />
        <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
        <main className="flex-grow pt-16"> {/* Adjust pt-16 if navbar height changes */}
          <Routes>
            {/* --- Public Routes --- */}
            <Route path="/" element={<Cartopia />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/blogs" element={<BlogPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/shop" element={<Shop />} />
            {/* --- NEW: Product Details Route --- */}
            {/* Uses ':id' as the parameter, matching ProductDetails component */}
            <Route path="/product/:id" element={<ProductDetails />} />

            {/* --- Regular User Authenticated Routes --- */}
            {/* TODO: Add protection for these routes if needed (similar to AdminProtectedRoute but checking for regular user role) */}
            <Route path="/orders" element={<OrderHistory />} />

            {/* --- Admin Routes --- */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route
              path="/admin/dashboard/*" // Use '/*' to allow nested routes within the dashboard if needed later
              element={
                <AdminProtectedRoute>
                  <AdminDashboard />
                </AdminProtectedRoute>
              }
            />
            {/* Example of a nested admin route (if AdminDashboard handled internal routing) */}
            {/* <Route path="/admin/dashboard/users" element={<AdminProtectedRoute><AdminUserManagement /></AdminProtectedRoute>} /> */}


            {/* --- Catch-all for Not Found (Optional) --- */}
            {/* <Route path="*" element={<NotFoundPage />} /> */}

          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;