// src/components/Login.jsx (or wherever it is)
import { useState } from "react"; // Removed useEffect for redirect check
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext'; // *** IMPORT useAuth ***
import axiosInstance from '../api/axiosInstance'; // *** Use your configured Axios instance ***

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoggedIn } = useAuth(); // *** GET login function and isLoggedIn state from context ***

  // Redirect logic can be simplified or handled by ProtectedRoute,
  // but if you keep it, use the context state:
  /*
  useEffect(() => {
      if (isLoggedIn) {
          const from = location.state?.from?.pathname || "/shop";
          console.log("Already logged in (context), redirecting from login page...");
          toast.info("Already logged in.");
          navigate(from, { replace: true });
      }
  }, [isLoggedIn, navigate, location.state]);
  */
  // It's often better to let ProtectedRoute handle redirecting away from login when logged in.

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
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

    // Use FormData for application/x-www-form-urlencoded if required by backend
    // Otherwise, send JSON using axiosInstance
    const loginPayload = {
        username: formData.email, // FastAPI expects 'username' for OAuth2PasswordRequestForm
        password: formData.password
    };

    try {
        // *** Use Axios instance for the request ***
        const response = await axiosInstance.post(
            "/auth/login", // Your login endpoint
            new URLSearchParams(loginPayload) // Send as form data if backend expects it
            // If backend expects JSON:
            // loginPayload, { headers: { 'Content-Type': 'application/json' } }
        );

        const { access_token, user } = response.data; // Adjust based on your actual API response structure

        if (!access_token) {
            // This case might not happen if axios throws an error on non-2xx status
            throw new Error("Login failed: No access token received.");
        }

        // *** Call the login function from AuthContext ***
        // Pass the token and optionally user data if returned by the API
        await login(access_token, user);

        toast.success("Login successful! Redirecting...");

        // Redirect logic (remains the same)
        const from = location.state?.from?.pathname || "/shop"; // Default redirect location

        // Redirect immediately or with a slight delay
        setTimeout(() => {
             navigate(from, { replace: true });
        }, 300); // Shorter delay

    } catch (error) {
        console.error("Login error:", error);
        // Extract error message from Axios error or default
        const message = error.response?.data?.detail || error.message || "An error occurred during login.";
        setError(`Login failed: ${message}`);
        toast.error(`Login failed: ${message}`);
    } finally {
        setIsLoading(false);
    }
  };

  // --- JSX remains largely the same ---
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
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required disabled={isLoading} autoComplete="username" />
            </div>
            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required disabled={isLoading} autoComplete="current-password" />
            </div>
            {/* Submit */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Logging In...' : 'Login'}
            </Button>
            {/* Link to Signup */}
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