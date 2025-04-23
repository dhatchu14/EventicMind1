import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from 'lucide-react'; // Import Loader2

// Renamed component
const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Determine where to redirect after successful login
  // Falls back to dashboard if no previous location state was passed
  const from = location.state?.from?.pathname || "/admin/dashboard";

  const handleLogin = (e) => {
    e.preventDefault();
    if (isLoading) return; // Prevent multiple submissions

    setIsLoading(true);

    // Simulate network delay (remove in production)
    setTimeout(() => {
      // --- Hardcoded Admin Credentials Check ---
      if (email === 'admin@steer.com' && password === '@steerAdmin') {
        // Create the specific admin user object structure
        const adminUser = {
          email: email,
          role: 'admin', // This 'role' field is crucial for identification
          name: 'Admin User' // Optional: display name
        };

        // Store in localStorage using the 'currentUser' key
        localStorage.setItem('currentUser', JSON.stringify(adminUser));

        // Dispatch login event - Navbar and potentially ProtectedRoute listen to this
        window.dispatchEvent(new Event('userLogin'));

        toast.success('Login successful! Redirecting...');

        // Redirect to the originally intended destination or the dashboard
        navigate(from, { replace: true }); // Use replace to avoid login page in history

      } else {
        toast.error('Invalid admin credentials.');
        setIsLoading(false); // Only stop loading on error
      }
      // On success, navigation will unmount the component, no need to set loading false
    }, 500); // 0.5 second delay simulation
  };

  return (
    // Center the login card vertically and horizontally
    <div className="flex items-center justify-center min-h-[calc(100vh-theme(space.16)-theme(space.16))] bg-gray-100 dark:bg-gray-900 px-4 py-12">
      <Card className="w-full max-w-md shadow-lg dark:bg-gray-800 border dark:border-gray-700">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Admin Portal Access</CardTitle>
          <CardDescription>
            Enter administrator credentials below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="admin@steer.com" // Hint
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="dark:bg-gray-700 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500"
                aria-describedby="email-hint"
              />
               <p id="email-hint" className="text-xs text-muted-foreground">Use the designated admin email.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Admin Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="dark:bg-gray-700 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:ring-indigo-500"
              disabled={isLoading}
            >
              {isLoading ? (
                  <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                  </>
               ) : (
                   'Sign In as Admin'
               )}
            </Button>
          </form>
        </CardContent>
        {/* Optional Footer */}
         <CardFooter className="pt-4 border-t dark:border-gray-700/50">
             <p className="text-xs text-center w-full text-gray-500 dark:text-gray-400">
                 This login is for authorized administrators only.
             </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminLoginPage; // Export with the new name
