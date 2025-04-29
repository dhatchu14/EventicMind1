import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Removed RadioGroup and RadioGroupItem imports
import { Label } from "@/components/ui/label";
// Removed CreditCard, using Truck instead for COD visual cue
import { AlertCircle, Truck } from "lucide-react";
import { useCart } from '@/components/CartContext'; // Ensure this path is correct

const Payment = () => {
  const navigate = useNavigate();
  const { cartTotal } = useCart(); // Only need cartTotal here
  const shippingFee = cartTotal > 0 ? 10.00 : 0; // Apply shipping only if cart is not empty
  const total = cartTotal + shippingFee;

  // Removed paymentMethod state as it's fixed to Cash on Delivery
  // const [paymentMethod, setPaymentMethod] = useState("cash"); // No longer needed

  const [isFormValid, setIsFormValid] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  });

  // Load stored delivery info if available
  useEffect(() => {
    const savedInfo = localStorage.getItem('deliveryInfo');
    if (savedInfo) {
      try {
        setFormData(JSON.parse(savedInfo));
      } catch (error) {
        console.error("Error parsing delivery info from localStorage:", error);
        localStorage.removeItem('deliveryInfo'); // Clear invalid data
      }
    }
  }, []);

  // Validate form whenever form data changes
  useEffect(() => {
    const { firstName, lastName, email, phone, street, city, state, zipCode, country } = formData;

    // Basic validation: check if all required fields are non-empty strings after trimming
    const isValid =
      firstName.trim() !== "" &&
      lastName.trim() !== "" &&
      email.trim() !== "" && /\S+@\S+\.\S+/.test(email) && // Simple email format check
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
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isFormValid) {
      // Optionally, add feedback like shaking the form or highlighting errors
      console.log("Form is invalid, cannot proceed.");
      return;
    }

    // Store valid form data in localStorage
    localStorage.setItem('deliveryInfo', JSON.stringify(formData));

    // Always navigate to cash-on-delivery confirmation page
    navigate("/cash-on-delivery"); // Ensure this route exists
  };

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
              {/* Added id="deliveryForm" to link the button */}
              <form id="deliveryForm" className="space-y-4" onSubmit={handleSubmit} noValidate>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-sm font-medium mb-1 block">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      aria-required="true"
                      className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:border-black dark:focus:border-white focus:ring-black dark:focus:ring-white"
                    />
                  </div>
                   <div>
                    <Label htmlFor="lastName" className="text-sm font-medium mb-1 block">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Doe"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      aria-required="true"
                      className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:border-black dark:focus:border-white focus:ring-black dark:focus:ring-white"
                    />
                  </div>
                </div>
                 <div>
                    <Label htmlFor="email" className="text-sm font-medium mb-1 block">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      aria-required="true"
                       className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:border-black dark:focus:border-white focus:ring-black dark:focus:ring-white"
                    />
                  </div>
                 <div>
                    <Label htmlFor="phone" className="text-sm font-medium mb-1 block">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 234 567 890"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      aria-required="true"
                       className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:border-black dark:focus:border-white focus:ring-black dark:focus:ring-white"
                    />
                  </div>
                 <div>
                    <Label htmlFor="street" className="text-sm font-medium mb-1 block">Street Address</Label>
                    <Input
                      id="street"
                      type="text"
                      placeholder="123 Main St"
                      name="street"
                      value={formData.street}
                      onChange={handleChange}
                      required
                      aria-required="true"
                       className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:border-black dark:focus:border-white focus:ring-black dark:focus:ring-white"
                    />
                  </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                    <Label htmlFor="city" className="text-sm font-medium mb-1 block">City</Label>
                    <Input
                      id="city"
                      type="text"
                      placeholder="Anytown"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      aria-required="true"
                       className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:border-black dark:focus:border-white focus:ring-black dark:focus:ring-white"
                    />
                  </div>
                   <div>
                    <Label htmlFor="state" className="text-sm font-medium mb-1 block">State / Province</Label>
                    <Input
                      id="state"
                      type="text"
                      placeholder="CA"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      required
                      aria-required="true"
                       className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:border-black dark:focus:border-white focus:ring-black dark:focus:ring-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                    <Label htmlFor="zipCode" className="text-sm font-medium mb-1 block">Zip / Postal Code</Label>
                    <Input
                      id="zipCode"
                      type="text"
                      placeholder="90210"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleChange}
                      required
                      aria-required="true"
                       className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:border-black dark:focus:border-white focus:ring-black dark:focus:ring-white"
                    />
                  </div>
                   <div>
                    <Label htmlFor="country" className="text-sm font-medium mb-1 block">Country</Label>
                    <Input
                      id="country"
                      type="text"
                      placeholder="United States"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      required
                      aria-required="true"
                       className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:border-black dark:focus:border-white focus:ring-black dark:focus:ring-white"
                    />
                  </div>
                </div>

                {/* Form Validation Message */}
                {!isFormValid && (
                  <div className="flex items-center text-red-600 dark:text-red-400 text-sm mt-4 p-3 bg-red-50 dark:bg-red-900/30 rounded-md border border-red-200 dark:border-red-800/50">
                    <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                    Please fill in all required delivery fields accurately.
                  </div>
                )}
                {/* Submit button moved to the other card */}
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
              {/* Order Totals */}
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

              {/* Payment Method Section - Simplified to only show COD */}
              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Truck className="mr-2 h-5 w-5 text-green-600 dark:text-green-400" /> {/* COD Icon */}
                  Payment Method
                </h3>
                {/* Display that only COD is available */}
                <div className={`flex items-center space-x-3 border border-green-300 dark:border-green-700 p-3 rounded-md bg-green-50 dark:bg-green-900/30`}>
                   <Truck className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                   <p className="flex-1 text-green-800 dark:text-green-200 font-medium">
                     Cash on Delivery
                   </p>
                </div>
                 <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 pl-8">
                   You can pay in cash when your order is delivered.
                 </p>

                {/* Removed RadioGroup and other payment options */}
              </div>

              {/* Submit Button */}
              <Button
                type="submit" // Triggers form submission
                form="deliveryForm" // Links this button to the form in the other card
                className={`w-full mt-6 bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black ${!isFormValid ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                disabled={!isFormValid}
                // onClick is not needed here as type="submit" and form="deliveryForm" handle it via the form's onSubmit
              >
                Place Order (Pay on Delivery)
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Payment;