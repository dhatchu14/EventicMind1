// login.jsx
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Add loading state
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) {
      setError(""); // Clear error on input change
    }
  };

  // Updated handleSubmit to call the backend API
  const handleSubmit = async (e) => { // Make the function async
    e.preventDefault();
    setError(""); // Clear previous errors

    if (!formData.email || !formData.password) {
      setError("Please enter both email and password.");
      toast.error("Please enter both email and password.");
      return;
    }

    setIsLoading(true); // Set loading state

    // Prepare form data for OAuth2PasswordRequestForm (x-www-form-urlencoded)
    // The backend expects 'username' and 'password' fields for this endpoint
    const loginData = new URLSearchParams();
    loginData.append('username', formData.email); // Map email to 'username'
    loginData.append('password', formData.password);

    try {
      // Make API call to the backend login endpoint
      const response = await fetch("http://localhost:8000/auth/login", { // Ensure this URL is correct
        method: "POST",
        headers: {
          // 'Content-Type': 'application/x-www-form-urlencoded' is set automatically by fetch for URLSearchParams
        },
        body: loginData, // Send as form data
      });

      // Always try to parse the response
      const data = await response.json();

      if (!response.ok) {
        // Handle API errors (e.g., incorrect credentials)
        const errorMessage = data.detail || `Login failed (Status: ${response.status})`;
        setError(errorMessage); // Display API error message in the Alert component
        toast.error(errorMessage); // Also show error toast
        return; // Stop on failure
      }

      // --- Login Successful ---
      const { access_token, token_type } = data; // Extract token

      // 1. Store the token securely (localStorage is common, but consider alternatives)
      //    WARNING: localStorage is vulnerable to XSS attacks. For higher security,
      //    consider HttpOnly cookies (requires backend setup) or in-memory storage
      //    managed by a state library. For this example, we'll use localStorage.
      localStorage.setItem("accessToken", access_token);
      // localStorage.setItem("tokenType", token_type); // Optional: Store token type if needed

      // 2. Remove any old user simulation data
      localStorage.removeItem("currentUser");
      localStorage.removeItem("users"); // Remove the old simulated user list

      // 3. Optionally fetch user profile right after login using the new token
      //    (Requires another API call to a protected endpoint like '/users/me')
      //    await fetchUserProfile(access_token); // See example function below

      // 4. Notify other parts of the app (if using event listeners or state management)
      window.dispatchEvent(new Event("userLogin")); // Keep if useful for other components

      // 5. Show feedback and redirect
      toast.success("Login successful! Redirecting...");
      setTimeout(() => {
        navigate("/"); // Redirect to homepage or dashboard
      }, 1000);

    } catch (error) {
      // Handle network errors or other fetch-related issues
      console.error("Login fetch error:", error);
      const message = error instanceof Error ? error.message : "An network error occurred during login.";
      setError(`Login failed: ${message}`);
      toast.error(`Login failed: ${message}`);
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };

  /*
  // Example function to fetch user profile after login (optional)
  async function fetchUserProfile(token) {
    try {
      const profileResponse = await fetch("http://localhost:8000/users/me", { // Your protected endpoint
        headers: {
          'Authorization': `Bearer ${token}` // Send the token
        }
      });
      if (!profileResponse.ok) {
        const errorData = await profileResponse.json();
        throw new Error(errorData.detail || 'Failed to fetch user profile');
      }
      const userData = await profileResponse.json();
      // Store relevant user data (excluding sensitive info like password hash)
      // You might want to store this in React state (Context/Redux/Zustand)
      // instead of or in addition to localStorage.
      localStorage.setItem("currentUserInfo", JSON.stringify({
        id: userData.id,
        email: userData.email,
        name: userData.full_name,
        createdAt: userData.created_at
        // Add other non-sensitive fields as needed
      }));
      console.log("User profile fetched:", userData);
       window.dispatchEvent(new Event("userInfoFetched")); // Notify app

    } catch (err) {
      console.error("Error fetching user profile:", err);
      // Handle error: Maybe clear token, show message, redirect to login
      localStorage.removeItem("accessToken");
      toast.error("Session invalid. Could not fetch user details.");
      // navigate('/login'); // Optionally force re-login
    }
  }
  */


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
                disabled={isLoading} // Disable when loading
                autoComplete="username" // Hint for password managers
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
                disabled={isLoading} // Disable when loading
                autoComplete="current-password" // Hint for password managers
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