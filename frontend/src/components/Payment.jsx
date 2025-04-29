import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, AlertCircle } from "lucide-react";
import { useCart } from '@/components/CartContext'; // Ensure this path is correct

const Payment = () => {
  const navigate = useNavigate();
  const { cartTotal } = useCart(); // Only need cartTotal here
  const shippingFee = cartTotal > 0 ? 10.00 : 0; // Apply shipping only if cart is not empty
  const total = cartTotal + shippingFee;

  const [paymentMethod, setPaymentMethod] = useState("stripe");
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

    // Navigate based on selected payment method
    switch(paymentMethod) {
      case "stripe":
        navigate("/stripe"); // Ensure this route exists
        break;
      case "cash":
        navigate("/cash-on-delivery"); // Ensure this route exists
        break;
      case "razorpay":
        navigate("/razorpay"); // Ensure this route exists
        break;
      default:
        console.warn("Unknown payment method selected:", paymentMethod);
        navigate("/stripe"); // Default navigation
    }
  };

  return (
    // Added background and dark mode styles
    <div className="bg-gray-100 dark:bg-black min-h-screen py-8 text-gray-900 dark:text-gray-100">
      <main className="container mx-auto px-4">
         {/* Added a general title for the page */}
        <h1 className="text-3xl font-bold text-center mb-8">Checkout</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Delivery Information Card */}
          {/* Changed background/border */}
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
            {/* Changed border */}
            <CardHeader className="border-b border-gray-200 dark:border-gray-700">
              <CardTitle className="text-xl font-semibold">
                Delivery Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Use form tag for semantic structure */}
              <form className="space-y-4" onSubmit={handleSubmit} noValidate>
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
                   // Changed color
                  <div className="flex items-center text-red-600 dark:text-red-400 text-sm mt-4 p-3 bg-red-50 dark:bg-red-900/30 rounded-md border border-red-200 dark:border-red-800/50">
                    <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                    Please fill in all required delivery fields accurately.
                  </div>
                )}
                {/* Submit button moved below payment method for logical flow */}
              </form>
            </CardContent>
          </Card>

          {/* Order Summary and Payment Method Card */}
          {/* Changed background/border */}
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
             {/* Changed border */}
            <CardHeader className="border-b border-gray-200 dark:border-gray-700">
              <CardTitle className="text-xl font-semibold">
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-2 mb-6">
                 {/* Changed text colors */}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                  <span className="text-gray-800 dark:text-gray-200">${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                   <span className="text-gray-600 dark:text-gray-400">Shipping Fee:</span>
                   <span className="text-gray-800 dark:text-gray-200">${shippingFee.toFixed(2)}</span>
                </div>
                 {/* Changed border color and text styles */}
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

                {/* Pass isFormValid to RadioGroup container to control opacity/pointer-events */}
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  className={`space-y-3 mb-6 ${!isFormValid ? 'opacity-60 pointer-events-none' : ''}`} // Apply opacity and disable pointer events when form is invalid
                  aria-label="Payment methods" // Accessibility
                  // removed disabled={!isFormValid} from here, control wrapper instead
                >
                  {/* Stripe Option */}
                   {/* Added cursor-pointer to the container div */}
                  <div className={`flex items-center space-x-3 border border-gray-300 dark:border-gray-600 p-3 rounded-md transition-colors ${isFormValid ? 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
                    {/* Added cursor-pointer to RadioGroupItem */}
                    <RadioGroupItem value="stripe" id="stripe" className="cursor-pointer focus:ring-black dark:focus:ring-white border-gray-400 dark:border-gray-500 data-[state=checked]:border-black dark:data-[state=checked]:border-white data-[state=checked]:bg-black dark:data-[state=checked]:bg-white data-[state=checked]:text-white dark:data-[state=checked]:text-black" />
                    {/* Added cursor-pointer to Label */}
                    <Label htmlFor="stripe" className="cursor-pointer flex-1 font-medium">Stripe (Credit/Debit Card)</Label>
                  </div>

                  {/* Cash on Delivery Option */}
                   {/* Added cursor-pointer to the container div */}
                  <div className={`flex items-center space-x-3 border border-gray-300 dark:border-gray-600 p-3 rounded-md transition-colors ${isFormValid ? 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
                    {/* Added cursor-pointer to RadioGroupItem */}
                    <RadioGroupItem value="cash" id="cash" className="cursor-pointer focus:ring-black dark:focus:ring-white border-gray-400 dark:border-gray-500 data-[state=checked]:border-black dark:data-[state=checked]:border-white data-[state=checked]:bg-black dark:data-[state=checked]:bg-white data-[state=checked]:text-white dark:data-[state=checked]:text-black" />
                    {/* Added cursor-pointer to Label */}
                    <Label htmlFor="cash" className="cursor-pointer flex-1 font-medium">Cash on Delivery</Label>
                  </div>

                  {/* Razorpay Option */}
                   {/* Added cursor-pointer to the container div */}
                  <div className={`flex items-center space-x-3 border border-gray-300 dark:border-gray-600 p-3 rounded-md transition-colors ${isFormValid ? 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
                    {/* Added cursor-pointer to RadioGroupItem */}
                    <RadioGroupItem value="razorpay" id="razorpay" className="cursor-pointer focus:ring-black dark:focus:ring-white border-gray-400 dark:border-gray-500 data-[state=checked]:border-black dark:data-[state=checked]:border-white data-[state=checked]:bg-black dark:data-[state=checked]:bg-white data-[state=checked]:text-white dark:data-[state=checked]:text-black" />
                     {/* Added cursor-pointer to Label */}
                    <Label htmlFor="razorpay" className="cursor-pointer flex-1 font-medium">Razorpay (UPI, Cards, Netbanking)</Label>
                  </div>
                </RadioGroup>

                {/* Submit Button */}
                <Button
                  type="submit" // Changed to type submit to work with form tag
                  // Added cursor-pointer and updated colors/disabled styles
                  className={`w-full mt-4 bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black ${!isFormValid ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  onClick={handleSubmit} // Still need onClick if not using form's onSubmit directly
                  disabled={!isFormValid}
                >
                  Proceed to {paymentMethod === "stripe" ? "Payment" : paymentMethod === "cash" ? "Confirm Order" : "Razorpay"}
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