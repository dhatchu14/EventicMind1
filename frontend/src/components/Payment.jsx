import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, AlertCircle, Loader2 } from "lucide-react"; // Added Loader2
import { useCart } from '@/components/CartContext';

// --- Configuration ---
// It's better to put this in a .env file or config file
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
// Assuming you store your JWT token in localStorage under this key
const AUTH_TOKEN_KEY = 'authToken';
// ---------------------

const Payment = () => {
  const navigate = useNavigate();
  const { cartTotal } = useCart();
  const shippingFee = cartTotal > 0 ? 10.00 : 0;
  const total = cartTotal + shippingFee;

  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [isFormValid, setIsFormValid] = useState(false);

  // --- New State Variables ---
  const [isLoading, setIsLoading] = useState(false); // For API call loading state
  const [apiError, setApiError] = useState(null); // To display API errors
  // -------------------------

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "", // Keep email in form state, but don't send to /delivery
    phone: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  });

  // Load stored delivery info if available (remains the same)
  useEffect(() => {
    const savedInfo = localStorage.getItem('deliveryInfo');
    if (savedInfo) {
      try {
        setFormData(JSON.parse(savedInfo));
      } catch (error) {
        console.error("Error parsing delivery info from localStorage:", error);
        localStorage.removeItem('deliveryInfo');
      }
    }
  }, []);

  // Validate form whenever form data changes (remains the same)
  useEffect(() => {
    const { firstName, lastName, email, phone, street, city, state, zipCode, country } = formData;
    const isValid =
      firstName.trim() !== "" &&
      lastName.trim() !== "" &&
      email.trim() !== "" && /\S+@\S+\.\S+/.test(email) &&
      phone.trim() !== "" &&
      street.trim() !== "" &&
      city.trim() !== "" &&
      state.trim() !== "" &&
      zipCode.trim() !== "" &&
      country.trim() !== "";
    setIsFormValid(isValid);
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
     // Clear API error when user starts typing again
    if (apiError) {
        setApiError(null);
    }
  };

  // --- Updated handleSubmit Function ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null); // Clear previous errors

    if (!isFormValid) {
      console.log("Form is invalid, cannot proceed.");
      setApiError("Please fill in all required delivery fields accurately."); // Show error if trying to submit invalid form
      return;
    }

    // 1. Get Auth Token (replace with your actual token retrieval logic)
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      // Handle not logged in case - maybe redirect to login
      setApiError("Authentication token not found. Please log in.");
      console.error("Auth token missing.");
      // Example: navigate('/login');
      return;
    }

    // 2. Prepare Payload for Backend /delivery endpoint
    const deliveryPayload = {
      name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
      address_line1: formData.street.trim(),
      // address_line2: null, // Add if you have a field for it
      city: formData.city.trim(),
      state: formData.state.trim(),
      zip_code: formData.zipCode.trim(),
      country: formData.country.trim(),
      phone_number: formData.phone.trim(),
    };

    setIsLoading(true);

    try {
      // 3. Make API Call to POST /delivery
      const response = await fetch(`${API_BASE_URL}/delivery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Include JWT token
        },
        body: JSON.stringify(deliveryPayload),
      });

      // Check for non-2xx status codes
      if (!response.ok) {
        let errorDetail = "Failed to save delivery information."; // Default error
        try {
          // Try to parse error detail from FastAPI response
          const errorData = await response.json();
          if (errorData && errorData.detail) {
             // Handle detailed validation errors if backend provides them
            if (typeof errorData.detail === 'string') {
               errorDetail = errorData.detail;
            } else if (Array.isArray(errorData.detail)) {
               // Format validation errors nicely
               errorDetail = errorData.detail.map(err => `${err.loc[1]}: ${err.msg}`).join('; ');
            }
          }
        } catch (parseError) {
          // If parsing error fails, stick with the status text
          errorDetail = response.statusText || errorDetail;
          console.error("Could not parse error response:", parseError)
        }
         throw new Error(errorDetail); // Throw error to be caught below
      }

      // 4. Handle Success
      const savedDeliveryData = await response.json();
      const deliveryId = savedDeliveryData.id;

      if (!deliveryId) {
           console.error("Delivery ID missing in response:", savedDeliveryData);
           throw new Error("Failed to retrieve delivery ID from server response.");
      }

      console.log("Delivery Info Saved Successfully, ID:", deliveryId);

      // Store delivery info in localStorage (optional, maybe useful for pre-filling later)
      localStorage.setItem('deliveryInfo', JSON.stringify(formData));
       // Store delivery ID temporarily if needed (sessionStorage might be better)
       // sessionStorage.setItem('pendingDeliveryId', deliveryId);

      // 5. Navigate to Payment Step, passing deliveryId via state
      const navigateTo = `/stripe`; // Default or choose based on paymentMethod
      switch (paymentMethod) {
        case "stripe":
          navigate("/stripe", { state: { deliveryId } });
          break;
        case "cash":
          navigate("/cash-on-delivery", { state: { deliveryId } });
          break;
        case "razorpay":
          navigate("/razorpay", { state: { deliveryId } });
          break;
        default:
          console.warn("Unknown payment method selected:", paymentMethod);
          navigate("/stripe", { state: { deliveryId } }); // Default navigation
      }

    } catch (error) {
      // 6. Handle Errors
      console.error("Error saving delivery information:", error);
      setApiError(error.message || "An unexpected error occurred."); // Show error message to user
    } finally {
      // 7. Reset Loading State
      setIsLoading(false);
    }
  };
  // -----------------------------------

  return (
    <div className="bg-gray-100 dark:bg-black min-h-screen py-8 text-gray-900 dark:text-gray-100">
      <main className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Checkout</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Delivery Information Card */}
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader className="border-b border-gray-200 dark:border-gray-700">
              <CardTitle className="text-xl font-semibold">
                Delivery Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Changed form to NOT use onSubmit directly on form tag, using button's onClick */}
              <form className="space-y-4" noValidate>
                {/* ... (Input fields remain exactly the same as before) ... */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required className="dark:bg-gray-700" />
                  </div>
                   <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required className="dark:bg-gray-700" />
                  </div>
                </div>
                 <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" name="email" value={formData.email} onChange={handleChange} required className="dark:bg-gray-700" />
                  </div>
                 <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="dark:bg-gray-700" />
                  </div>
                 <div>
                    <Label htmlFor="street">Street Address</Label>
                    <Input id="street" name="street" value={formData.street} onChange={handleChange} required className="dark:bg-gray-700" />
                  </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" name="city" value={formData.city} onChange={handleChange} required className="dark:bg-gray-700" />
                  </div>
                   <div>
                    <Label htmlFor="state">State / Province</Label>
                    <Input id="state" name="state" value={formData.state} onChange={handleChange} required className="dark:bg-gray-700" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                    <Label htmlFor="zipCode">Zip / Postal Code</Label>
                    <Input id="zipCode" name="zipCode" value={formData.zipCode} onChange={handleChange} required className="dark:bg-gray-700" />
                  </div>
                   <div>
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" name="country" value={formData.country} onChange={handleChange} required className="dark:bg-gray-700" />
                  </div>
                </div>

                {/* Form Validation Message (Displayed if fields are empty) */}
                {!isFormValid && (
                  <div className="flex items-center text-red-600 dark:text-red-400 text-sm mt-2 p-2 bg-red-50 dark:bg-red-900/30 rounded-md border border-red-200 dark:border-red-800/50">
                    <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                    Please fill in all required delivery fields accurately.
                  </div>
                )}

                {/* Display API Error Message Here */}
                {apiError && (
                  <div className="flex items-center text-red-600 dark:text-red-400 text-sm mt-4 p-3 bg-red-100 dark:bg-red-900/50 rounded-md border border-red-300 dark:border-red-700">
                    <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                    {apiError}
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Order Summary and Payment Method Card */}
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader className="border-b border-gray-200 dark:border-gray-700">
              <CardTitle className="text-xl font-semibold">
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {/* ... (Order Summary div remains the same) ... */}
                <div className="space-y-2 mb-6">
                 <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                  <span className="text-gray-800 dark:text-gray-200">${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                   <span className="text-gray-600 dark:text-gray-400">Shipping Fee:</span>
                   <span className="text-gray-800 dark:text-gray-200">${shippingFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Method Section */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <CreditCard className="mr-2 h-5 w-5" />
                  Select Payment Method
                </h3>

                {/* RadioGroup remains the same, controlled by isFormValid for enabled state */}
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                   // Disable interaction if form is invalid OR if API call is loading
                  className={`space-y-3 mb-6 ${(!isFormValid || isLoading) ? 'opacity-60 pointer-events-none' : ''}`}
                  aria-label="Payment methods"
                >
                   {/* ... (RadioGroupItems for stripe, cash, razorpay remain the same) ... */}
                   <div className={`flex items-center space-x-3 border p-3 rounded-md transition-colors ${isFormValid && !isLoading ? 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
                    <RadioGroupItem value="stripe" id="stripe" disabled={!isFormValid || isLoading} />
                    <Label htmlFor="stripe" className="cursor-pointer flex-1 font-medium">Stripe (Credit/Debit Card)</Label>
                  </div>
                   <div className={`flex items-center space-x-3 border p-3 rounded-md transition-colors ${isFormValid && !isLoading ? 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
                    <RadioGroupItem value="cash" id="cash" disabled={!isFormValid || isLoading}/>
                    <Label htmlFor="cash" className="cursor-pointer flex-1 font-medium">Cash on Delivery</Label>
                  </div>
                   <div className={`flex items-center space-x-3 border p-3 rounded-md transition-colors ${isFormValid && !isLoading ? 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
                    <RadioGroupItem value="razorpay" id="razorpay" disabled={!isFormValid || isLoading}/>
                    <Label htmlFor="razorpay" className="cursor-pointer flex-1 font-medium">Razorpay (UPI, Cards, Netbanking)</Label>
                  </div>
                </RadioGroup>

                {/* Submit Button - Updated */}
                <Button
                  type="button" // Changed type to button, onClick handles submission
                  className={`w-full mt-4 bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black flex items-center justify-center ${(!isFormValid || isLoading) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  onClick={handleSubmit} // Use onClick to trigger our async handler
                  disabled={!isFormValid || isLoading} // Disable if form invalid OR loading
                >
                  {isLoading ? (
                     <>
                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                       Processing...
                     </>
                  ) : (
                     `Proceed to ${paymentMethod === "stripe" ? "Payment" : paymentMethod === "cash" ? "Confirm Order" : "Razorpay"}`
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Payment;