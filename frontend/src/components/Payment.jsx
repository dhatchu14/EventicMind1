// src/components/Payment.jsx (adjust path as needed)

import React, { useState, useEffect } from "react"; // Import React if not already
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AlertCircle, Truck } from "lucide-react";
import { useCart } from '@/components/CartContext'; // Ensure this path is correct
import { toast } from "sonner";
import axiosInstance from '../api/axiosInstance';

const Payment = () => {
  const navigate = useNavigate();
  // Destructure the API version of the clear cart function
  const { cartTotal, clearCartAPI } = useCart(); // <-- Use clearCartAPI from context
  const shippingFee = cartTotal > 0 ? 10.00 : 0;
  const total = cartTotal + shippingFee;

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
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load stored delivery info useEffect...
  useEffect(() => {
    const savedInfo = localStorage.getItem('deliveryInfo');
    if (savedInfo) {
      try {
        if (typeof savedInfo === 'string' && savedInfo.trim() !== '') {
          setFormData(JSON.parse(savedInfo));
        } else {
           localStorage.removeItem('deliveryInfo');
        }
      } catch (error) {
        console.error("Error parsing delivery info from localStorage:", error);
        localStorage.removeItem('deliveryInfo');
      }
    }
  }, []);

  // Validate form useEffect...
   useEffect(() => {
    const { firstName, lastName, email, phone, street, city, state, zipCode, country } = formData;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid =
      firstName.trim() !== "" &&
      lastName.trim() !== "" &&
      email.trim() !== "" && emailRegex.test(email) &&
      phone.trim() !== "" &&
      street.trim() !== "" &&
      city.trim() !== "" &&
      state.trim() !== "" &&
      zipCode.trim() !== "" &&
      country.trim() !== "";
    setIsFormValid(isValid);
    if (isValid && error === "Please fill in all required delivery fields accurately.") {
        setError(null);
    }
   }, [formData, error]);

  // handleChange...
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
    if (error === "Please fill in all required delivery fields accurately.") {
        setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!isFormValid) {
      setError("Please fill in all required delivery fields accurately.");
      toast.error("Please check the delivery information.");
      return;
    }

    setIsLoading(true);

    const orderData = {
      delivery_info: {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        street: formData.street.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        zip_code: formData.zipCode.trim(),
        country: formData.country.trim(),
      },
      subtotal: parseFloat(cartTotal.toFixed(2)),
      shipping_fee: parseFloat(shippingFee.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
    };

    try {
      // 1. Place the order
      const response = await axiosInstance.post('/orders/', orderData); // Note trailing slash
      const createdOrder = response.data;    

      if (!createdOrder || typeof createdOrder.id === 'undefined') {
        console.error("Order API: Invalid response structure", createdOrder);
        toast.info("Order placed but response was unusual. Please check order history.");
      } else {
        console.log("Order placed successfully:", createdOrder);
        toast.success("Order placed successfully!");
      }

      // 2. Clear the cart via context API call
      // Check if the function exists before calling
      if (clearCartAPI) {
        try {
            console.log("Calling clearCartAPI from Payment component..."); // Add log
            await clearCartAPI(); // <-- CALL THE API version
            // Success/Error toast for clearing is handled within clearCartAPI itself
            console.log("clearCartAPI call completed."); // Add log
        } catch (clearError) {
             console.error("Attempt to clear cart via API failed after successful order:", clearError);
             // Optionally add a specific toast here if needed, but don't block navigation
             // toast.warning("Order placed, but cart couldn't be cleared automatically.");
        }
      } else {
        // Log a warning if the function isn't available from context
        console.warn("clearCartAPI function is not available in CartContext!");
      }
      // ****************************

      // 3. Save delivery info locally
      localStorage.setItem('deliveryInfo', JSON.stringify(formData));

      // 4. Navigate to shop page after a delay
      setTimeout(() => {
        navigate("/shop");
      }, 1500); // Adjust delay as needed

    } catch (err) { // Catch errors from placing the order
      console.error("Error submitting order:", err);
      const errorMessage = err.message || "An unexpected error occurred. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage); // Show order placement error
      setIsLoading(false); // Stop loading ONLY on order placement error
    }
    // No finally block for setIsLoading if navigating away
  };

  // --- Return JSX --- (UI structure remains unchanged from your last version)
  return (
    <div className="bg-gray-100 dark:bg-black min-h-screen py-8  text-gray-900 dark:text-gray-100">
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
              <form id="deliveryForm" className="space-y-4" onSubmit={handleSubmit} noValidate>
                {/* --- All Input fields --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-sm font-medium mb-1 block">First Name</Label>
                    <Input id="firstName" type="text" placeholder="John" name="firstName" value={formData.firstName} onChange={handleChange} required aria-required="true" className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:border-black dark:focus:border-white focus:ring-black dark:focus:ring-white"/>
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-sm font-medium mb-1 block">Last Name</Label>
                    <Input id="lastName" type="text" placeholder="Doe" name="lastName" value={formData.lastName} onChange={handleChange} required aria-required="true" className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:border-black dark:focus:border-white focus:ring-black dark:focus:ring-white"/>
                  </div>
                </div>
                <div>
                  <Label htmlFor="email" className="text-sm font-medium mb-1 block">Email Address</Label>
                  <Input id="email" type="email" placeholder="you@example.com" name="email" value={formData.email} onChange={handleChange} required aria-required="true" className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:border-black dark:focus:border-white focus:ring-black dark:focus:ring-white"/>
                </div>
                <div>
                  <Label htmlFor="phone" className="text-sm font-medium mb-1 block">Phone Number</Label>
                  <Input id="phone" type="tel" placeholder="+1 234 567 890" name="phone" value={formData.phone} onChange={handleChange} required aria-required="true" className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:border-black dark:focus:border-white focus:ring-black dark:focus:ring-white"/>
                </div>
                <div>
                  <Label htmlFor="street" className="text-sm font-medium mb-1 block">Street Address</Label>
                  <Input id="street" type="text" placeholder="123 Main St" name="street" value={formData.street} onChange={handleChange} required aria-required="true" className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:border-black dark:focus:border-white focus:ring-black dark:focus:ring-white"/>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city" className="text-sm font-medium mb-1 block">City</Label>
                    <Input id="city" type="text" placeholder="Anytown" name="city" value={formData.city} onChange={handleChange} required aria-required="true" className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:border-black dark:focus:border-white focus:ring-black dark:focus:ring-white"/>
                  </div>
                  <div>
                    <Label htmlFor="state" className="text-sm font-medium mb-1 block">State / Province</Label>
                    <Input id="state" type="text" placeholder="CA" name="state" value={formData.state} onChange={handleChange} required aria-required="true" className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:border-black dark:focus:border-white focus:ring-black dark:focus:ring-white"/>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="zipCode" className="text-sm font-medium mb-1 block">Zip / Postal Code</Label>
                    <Input id="zipCode" type="text" placeholder="90210" name="zipCode" value={formData.zipCode} onChange={handleChange} required aria-required="true" className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:border-black dark:focus:border-white focus:ring-black dark:focus:ring-white"/>
                  </div>
                  <div>
                    <Label htmlFor="country" className="text-sm font-medium mb-1 block">Country</Label>
                    <Input id="country" type="text" placeholder="United States" name="country" value={formData.country} onChange={handleChange} required aria-required="true" className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:border-black dark:focus:border-white focus:ring-black dark:focus:ring-white"/>
                  </div>
                </div>

                {/* --- Error/Validation Display --- */}
                {error && (
                  <div className="flex items-center text-red-600 dark:text-red-400 text-sm mt-4 p-3 bg-red-50 dark:bg-red-900/30 rounded-md border border-red-200 dark:border-red-800/50">
                    <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                    {error}
                  </div>
                )}
                {!isFormValid && !error && Object.values(formData).some(val => val !== '') && (
                    <div className="flex items-center text-yellow-600 dark:text-yellow-400 text-sm mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-md border border-yellow-200 dark:border-yellow-800/50">
                        <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                        Please fill in all required delivery fields accurately.
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
                {/* Order Totals */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm"><span className="text-gray-600 dark:text-gray-400">Subtotal:</span><span className="text-gray-800 dark:text-gray-200">${cartTotal.toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-600 dark:text-gray-400">Shipping Fee:</span><span className="text-gray-800 dark:text-gray-200">${shippingFee.toFixed(2)}</span></div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200 dark:border-gray-700"><span>Total:</span><span>${total.toFixed(2)}</span></div>
                </div>
                {/* Payment Method Section */}
                <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center"><Truck className="mr-2 h-5 w-5 text-green-600 dark:text-green-400" />Payment Method</h3>
                    <div className="flex items-center space-x-3 border border-green-300 dark:border-green-700 p-3 rounded-md bg-green-50 dark:bg-green-900/30"><Truck className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" /><p className="flex-1 text-green-800 dark:text-green-200 font-medium">Cash on Delivery</p></div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 pl-8">You can pay in cash when your order is delivered.</p>
                </div>

               {/* Submit Button */}
               <Button
                 type="submit"
                 form="deliveryForm"
                 className={`w-full mt-6 bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black ${(!isFormValid || isLoading) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                 disabled={!isFormValid || isLoading}
               >
                 {isLoading ? 'Placing Order...' : 'Place Order (Pay on Delivery)'}
               </Button>
             </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Payment;