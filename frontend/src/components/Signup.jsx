// signup.jsx
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Eye, EyeOff, CheckCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

// Reusable PasswordInput component (Keep as is)
const PasswordInput = ({ label, name, value, onChange, error }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <div className="relative">
        <Input
          id={name}
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          className={error ? "border-red-500" : ""}
          autoComplete="new-password" // Help browsers distinguish
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
          onClick={() => setVisible(!visible)}
        >
          {visible ? (
            <EyeOff className="h-4 w-4 text-gray-500" />
          ) : (
            <Eye className="h-4 w-4 text-gray-500" />
          )}
        </button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};


export default function SignupPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Add loading state
  // Removed successMessage state as toast handles feedback
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    if (name === 'password' && errors.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: null }));
    }
    if (errors.general) { // Clear general error on any input change
       setErrors(prev => ({...prev, general: null}));
    }
  };

  // validateForm function remains the same
  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName || formData.fullName.length < 2)
      newErrors.fullName = "Full name must be at least 2 characters";
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Please enter a valid email address";
    if (!formData.password)
      newErrors.password = "Password is required";
    else if (formData.password.length < 8)
      newErrors.password = "Password must be at least 8 characters";
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password))
      newErrors.password = "Password must include uppercase, lowercase, and numbers";
    if (formData.confirmPassword !== formData.password)
      newErrors.confirmPassword = "Passwords do not match";
    if (!agreeToTerms)
      newErrors.terms = "You must agree to the Terms and Conditions";
    return newErrors;
  };

  // Updated handleSubmit to call the backend API
  const handleSubmit = async (e) => { // Make the function async
    e.preventDefault();
    setErrors({}); // Clear previous errors

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true); // Set loading state

    // Prepare data matching the backend's UserCreate schema
    const userData = {
      email: formData.email,
      password: formData.password,
      full_name: formData.fullName, // Use 'full_name' as expected by the backend
    };

    try {
      // Make API call to the backend signup endpoint
      const response = await fetch("http://localhost:8000/auth/signup", { // Ensure this URL is correct
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      // Always try to parse the response, even for errors
      const data = await response.json();

      if (!response.ok) {
        // Handle API errors (e.g., validation, email exists)
        const errorMessage = data.detail || `Signup failed (Status: ${response.status})`;
        // Try to set specific field errors if possible (like email exists)
        if (response.status === 400 && typeof data.detail === 'string' && data.detail.toLowerCase().includes("email already registered")) {
          setErrors({ email: "Email address already registered." });
        } else {
          // Set a general error message for other issues
          setErrors({ general: errorMessage });
        }
        toast.error(errorMessage); // Show error toast
        return; // Stop execution
      }

      // --- Signup Successful ---
      toast.success("Account created successfully! Please log in.");

      // Clear form state (optional, as we are redirecting)
      setFormData({ fullName: "", email: "", password: "", confirmPassword: "" });
      setAgreeToTerms(false);

      // Redirect to login page after a short delay
      setTimeout(() => {
        navigate("/login"); // Redirect to login after successful signup
      }, 1500); // 1.5 second delay

    } catch (error) {
      // Handle network errors or other fetch-related issues
      console.error("Signup fetch error:", error);
      const message = error instanceof Error ? error.message : "An unexpected network error occurred.";
      setErrors({ general: `Signup failed: ${message}` });
      toast.error(`Signup failed: ${message}`);
    } finally {
      setIsLoading(false); // Reset loading state regardless of success/failure
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4 py-8">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-center">Create an account</h2>

          {errors.general && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.general}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name Input */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className={errors.fullName ? "border-red-500" : ""}
                disabled={isLoading} // Disable when loading
                autoComplete="name"
              />
              {errors.fullName && <p className="text-sm text-red-500">{errors.fullName}</p>}
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? "border-red-500" : ""}
                disabled={isLoading} // Disable when loading
                autoComplete="email"
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>

            {/* Password Input */}
            <PasswordInput
              label="Password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              // disabled={isLoading} // PasswordInput doesn't support disabled, handle inside if needed
            />

            {/* Confirm Password Input */}
            <PasswordInput
              label="Confirm Password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              // disabled={isLoading}
            />

            {/* Terms Checkbox */}
            <div className="flex items-start space-x-2 pt-2">
               <Checkbox
                 id="terms"
                 checked={agreeToTerms}
                 onCheckedChange={() => {
                     setAgreeToTerms(!agreeToTerms)
                     if (errors.terms) {
                        setErrors(prev => ({...prev, terms: null}));
                     }
                 }}
                 className={`mt-1 ${errors.terms ? 'border-red-500' : ''}`}
                 disabled={isLoading} // Disable when loading
               />
               <div className="grid gap-1.5 leading-none">
                 <label htmlFor="terms" className={`text-sm font-medium leading-none ${isLoading ? 'text-gray-500' : 'text-gray-700'}`}>
                   I agree to the <a href="#" className={` ${isLoading ? 'text-blue-400 cursor-not-allowed' : 'text-blue-600 hover:underline'}`}>Terms and Conditions</a>
                 </label>
                  {errors.terms && <p className="text-sm text-red-500">{errors.terms}</p>}
               </div>
             </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full mt-4" disabled={isLoading}>
              {isLoading ? 'Signing Up...' : 'Sign Up'}
            </Button>

            <p className="text-center text-sm mt-4">
              Already have an account?{" "}
              <Link to="/login" className={` ${isLoading ? 'text-blue-400 cursor-not-allowed pointer-events-none' : 'text-blue-600 hover:underline'}`}>
                Log in
               </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}