// src/components/Login.jsx (Correct version for your backend)
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import axiosInstance from '../api/axiosInstance'; // Use your configured Axios instance

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

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

    // *** Prepare payload for 'application/x-www-form-urlencoded' ***
    // This matches the backend's expectation using OAuth2PasswordRequestForm
    const formPayload = new URLSearchParams();
    formPayload.append('username', formData.email); // Key MUST be 'username'
    formPayload.append('password', formData.password); // Key MUST be 'password'

    try {
      console.log("Sending login payload (form-urlencoded):", formPayload.toString());

      // *** Use Axios instance to send FORM data ***
      const response = await axiosInstance.post(
        "/auth/login",   // Your login endpoint
        formPayload,     // <-- Send the URLSearchParams object
        {
          // Explicitly set header (Axios might infer it, but better to be clear)
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      console.log("Login response:", response.data);

      // Adjust based on your actual API response structure (Token schema)
      const { access_token, token_type } = response.data;
      // Note: Your current backend doesn't return the user object on login, only the token.

      if (!access_token) {
        throw new Error("Login failed: No access token received.");
      }

      // *** Call the login function from AuthContext ***
      // You might need to fetch user details separately after login if needed elsewhere
      // Or adjust the login function to only store the token
      await login(access_token); // Pass only the token if user details aren't returned

      toast.success("Login successful! Redirecting...");

      // Redirect logic
      const from = location.state?.from?.pathname || "/shop"; // Default redirect
      navigate(from, { replace: true });

    } catch (err) {
        console.error("Login error details:", err);
        let message = "An unknown error occurred during login.";

        if (err.response) {
            console.error("Login Response Error Status:", err.response.status);
            console.error("Login Response Error Data:", err.response.data);
            // Handle specific errors like 401 Unauthorized
            if (err.response.status === 401) {
                 message = err.response.data?.detail || "Incorrect email or password.";
            } else {
                 message = err.response.data?.detail || `Server Error: ${err.response.status}`;
            }
        } else if (err.request) {
            console.error("Login No Response Error:", err.request);
            message = "No response from server. Check network connection.";
        } else {
            console.error("Login Setup Error:", err.message);
            message = err.message;
        }

        setError(`Login failed: ${message}`);
        toast.error(`Login failed: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // --- JSX remains largely the same ---
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 px-4 py-12">
      <Card className="w-full max-w-md shadow-xl dark:bg-gray-800 border dark:border-gray-700">
        <CardContent className="p-6 sm:p-8">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">Login</h2>
          {error && (
            <Alert variant="destructive" className="mb-4 bg-red-100 dark:bg-red-900/30 border-red-500 dark:border-red-700 text-red-800 dark:text-red-300">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email</Label>
              <Input
                 id="email"
                 name="email"
                 type="email"
                 value={formData.email}
                 onChange={handleChange}
                 required
                 disabled={isLoading}
                 autoComplete="username"
                 placeholder="you@example.com"
                 className="dark:bg-gray-700 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={isLoading}
                autoComplete="current-password"
                placeholder="••••••••"
                className="dark:bg-gray-700 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500"
               />
            </div>
            {/* Submit */}
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:ring-indigo-500" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging In...
                </>
               ) : (
                'Login'
               )}
            </Button>
            {/* Link to Signup */}
            <p className="text-center text-sm mt-4 text-gray-600 dark:text-gray-400">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className={`font-medium ${isLoading
                  ? 'text-indigo-400 dark:text-indigo-600 cursor-not-allowed pointer-events-none'
                  : 'text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 hover:underline'}`}
                aria-disabled={isLoading}
              >
                Sign up
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}