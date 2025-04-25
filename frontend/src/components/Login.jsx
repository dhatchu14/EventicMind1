// src/pages/Login.jsx (or wherever your Login.jsx is)
import { useState, useEffect } from "react"; // Import useEffect
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
// Import useLocation to get redirect information
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation(); // Get location object

  // --- NEW: Redirect if already logged in ---
  useEffect(() => {
    const token = localStorage.getItem("accessToken"); // Use the correct key
    if (token) {
      // If a token exists, redirect away from login
      console.log("Token found, redirecting from login page...");
      // Where to redirect? Use the 'from' state if available (passed by ProtectedRoute),
      // otherwise redirect to a default protected page like '/shop' or your main dashboard.
      const from = location.state?.from?.pathname || "/shop"; // Default to /shop
      toast.info("Already logged in. Redirecting...");
      navigate(from, { replace: true }); // Use replace to avoid adding login to history
    }
  }, [navigate, location.state]); // Re-run if navigate or location.state changes
  // ------------------------------------------

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("Please enter both email and password.");
      toast.error("Please enter both email and password.");
      return;
    }

    setIsLoading(true);

    const loginData = new URLSearchParams();
    loginData.append('username', formData.email);
    loginData.append('password', formData.password);

    try {
      const response = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        body: loginData,
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.detail || `Login failed (Status: ${response.status})`;
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      const { access_token } = data;

      // --- CORRECT TOKEN KEY ---
      // Ensure you use the *same key* here, in ProtectedRoute, and anywhere else you check the token.
      localStorage.setItem("accessToken", access_token);
      // --------------------------

      // Remove old simulation data if necessary
      localStorage.removeItem("currentUser");
      localStorage.removeItem("users");

      // Optional: Fetch user profile here if needed

      // Notify other parts of the app
      window.dispatchEvent(new Event("userLogin"));

      // --- REDIRECT AFTER LOGIN ---
      toast.success("Login successful! Redirecting...");

      // Determine the redirect destination:
      // 1. If `state.from` exists (user was redirected to login from a protected route), go back there.
      // 2. Otherwise, go to a default logged-in page (e.g., '/shop' or '/productdetails' as you requested).
      //    Let's use '/shop' as a sensible default dashboard/main page. Adjust if needed.
      const from = location.state?.from?.pathname || "/shop"; // Default to /shop

      // Use setTimeout only if you want a slight delay for the toast message
      setTimeout(() => {
          navigate(from, { replace: true }); // Use replace to avoid going back to login page
      }, 500); // Short delay for toast visibility
      // Or redirect immediately:
      // navigate(from, { replace: true });
      // ----------------------------

    } catch (error) {
      console.error("Login fetch error:", error);
      const message = error instanceof Error ? error.message : "An network error occurred during login.";
      setError(`Login failed: ${message}`);
      toast.error(`Login failed: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isLoading}
                autoComplete="username"
              />
            </div>
            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>
            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Logging In...' : 'Login'}
            </Button>
            <p className="text-center text-sm mt-4">
              Don't have an account?{" "}
              <Link to="/signup" className={` ${isLoading ? 'text-blue-400 cursor-not-allowed pointer-events-none' : 'text-blue-600 hover:underline'}`}>
                Sign up
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}