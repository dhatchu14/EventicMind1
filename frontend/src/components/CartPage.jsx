// src/components/CartPage.jsx  (Ensure path matches your structure)
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, X, Minus, Plus, Loader2, ShoppingCart, AlertCircle } from "lucide-react";
// *** Ensure this path is correct for your project structure ***
import { useCart } from '@/components/CartContext';
// ***
import { toast } from 'sonner';

const CartPage = () => {
  const navigate = useNavigate();
  // Get state and API functions from the refactored context
  const {
    cartItems,
    isLoading,          // Global loading state (for initial fetch, clear cart)
    isUpdating,         // Item-level update loading state (for quantity/remove)
    error,              // Potential error object/message
    fetchCart,          // Function to explicitly refresh cart
    removeFromCartAPI,  // API function to remove an item
    updateQuantityAPI,  // API function to update item quantity (handles decrease to 0 by removing)
    cartTotal,          // Calculated subtotal from context
    itemCount           // Total number of items from context
  } = useCart();

  // Optional: Explicit fetch on mount if needed, though context might handle it.
  // useEffect(() => {
  //   fetchCart().catch(err => console.error("CartPage: Initial cart fetch failed.", err));
  // }, [fetchCart]);

  // --- Event Handlers ---

  // Handles +/- button clicks, calls the context's updateQuantityAPI
  const handleUpdateQuantity = async (item, action) => {
      const productId = item.prod_id || item.id; // Use prod_id if available, fallback to id
      if (!productId) {
          console.error("Missing product ID for item:", item);
          toast.error("Cannot update item: Missing ID.");
          return;
      }
      const currentQuantity = item.quantity;
      const newQuantity = action === 'increase' ? currentQuantity + 1 : currentQuantity - 1;

      // Context's updateQuantityAPI should handle the logic for quantity < 1
      try {
         await updateQuantityAPI(productId, newQuantity);
         // Optional: toast success if needed, but context might handle it
      } catch (err) {
         // Error is likely already logged/toasted within context function
         console.error("CartPage: Error during quantity update:", err);
         // You could add a specific toast here if the context doesn't
         // toast.error("Failed to update quantity.");
      }
  };

  // Handles 'X' button click, calls the context's removeFromCartAPI
  const handleRemoveItem = async (item) => {
       const productId = item.prod_id || item.id; // Use prod_id if available, fallback to id
       if (!productId) {
           console.error("Missing product ID for item:", item);
           toast.error("Cannot remove item: Missing ID.");
           return;
       }
       try {
          await removeFromCartAPI(productId);
          // Optional: toast success if needed, but context might handle it
       } catch (err) {
          // Error is likely already logged/toasted within context function
          console.error("CartPage: Error during item removal:", err);
          // toast.error("Failed to remove item.");
       }
  };

  // Navigate to checkout page
  const handleCheckout = () => {
    // Prevent checkout if cart is empty
    if (!cartItems || cartItems.length === 0) {
        toast.warn("Your cart is empty. Add items before proceeding to checkout.");
        return;
    }
    // Navigate to the route defined in App.jsx for the Payment component
    navigate('/checkout');
  };


  // --- Calculate local display values ---
  const shippingFee = cartTotal > 0 ? 10.00 : 0; // Example shipping logic, adjust as needed
  const totalWithShipping = cartTotal + shippingFee;


  // --- RENDER LOGIC ---

  // 1. Global Loading State (for initial load / clear cart actions)
  // Show a full-page loader if the initial fetch is happening
  if (isLoading && !cartItems.length && !error) { // Be more specific: only show full loader on initial load
     return (
        <div className="bg-gray-100 dark:bg-black min-h-screen py-8 text-gray-900 dark:text-gray-100 flex justify-center items-center">
           <div className="text-center">
             <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
             <p className="text-muted-foreground">Loading your cart...</p>
           </div>
        </div>
     );
  }

  // 2. Error State (Show if fetch failed and cart is definitely empty)
  // Only show full error page if there was an error *and* we have no items to display
  if (error && (!cartItems || cartItems.length === 0)) {
      return (
        <div className="bg-gray-100 dark:bg-black min-h-screen py-8 text-gray-900 dark:text-gray-100">
          <div className="container mx-auto px-4 max-w-4xl">
             {/* Header */}
             <div className="mb-6 flex justify-between items-center">
                <Button variant="ghost" className="flex items-center text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white p-0 h-auto cursor-pointer" onClick={() => navigate('/shop')}> <ArrowLeft className="mr-1 h-4 w-4" /> Continue Shopping </Button>
                <h1 className="text-2xl lg:text-3xl font-bold text-center"> Shopping Cart </h1>
                <div className="w-auto invisible"> <Button variant="ghost"><ArrowLeft className="mr-1 h-4 w-4" />Continue Shopping</Button> </div>
             </div>
             {/* Error Display */}
             <div className="text-center py-20 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-6">
               <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
               <p className="text-red-700 dark:text-red-300 font-semibold mb-2">Could not load cart</p>
               <p className="text-red-600 dark:text-red-400 text-sm mb-4">{typeof error === 'string' ? error : "An unknown error occurred retrieving your cart."}</p>
               {/* Disable button if a load is already in progress */}
               <Button onClick={() => fetchCart()} variant="destructive" size="sm" disabled={isLoading}>Try Again</Button>
           </div>
         </div>
       </div>
      );
  }

  // 3. Main Content (Cart Items or Empty State)
  return (
    <div className="bg-gray-100 dark:bg-black min-h-screen py-8 text-gray-900 dark:text-gray-100">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
           <Button variant="ghost" className="flex items-center text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white p-0 h-auto cursor-pointer" onClick={() => navigate('/shop')}> <ArrowLeft className="mr-1 h-4 w-4" /> Continue Shopping </Button>
           <h1 className="text-2xl lg:text-3xl font-bold text-center"> Shopping Cart </h1>
           {/* Placeholder to balance the header */}
           <div className="w-auto invisible"> <Button variant="ghost"><ArrowLeft className="mr-1 h-4 w-4" />Continue Shopping</Button> </div>
        </div>

        {/* Cart Grid */}
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Cart Items Section */}
          <div className="flex-grow lg:w-2/3">
             {/* General loading/updating indicator overlay (optional, can be subtle) */}
             {/* We'll use opacity on the card instead */}
             {isUpdating && (
                 <div className="flex items-center justify-center text-sm text-muted-foreground mb-2">
                     <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Updating cart...
                 </div>
             )}
            <Card className={`mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm transition-opacity duration-300 ${isUpdating ? 'opacity-75 pointer-events-none' : 'opacity-100'}`}>
              <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                {/* Display item count from context */}
                <CardTitle className="text-lg font-semibold"> Cart Items ({itemCount}) </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* Check cartItems from context */}
                {!cartItems || cartItems.length === 0 ? (
                  // Empty Cart State
                  <div className="text-center py-16 px-4">
                     <ShoppingCart className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-6" />
                     <p className="text-gray-500 dark:text-gray-400 mb-6">Your shopping cart is currently empty.</p>
                     <Button className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black cursor-pointer" onClick={() => navigate('/shop')}> Start Shopping </Button>
                  </div>
                ) : (
                  // List of Cart Items
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {cartItems.map((item) => {
                      // --- Data Extraction from Item ---
                      // Safely access potentially nested product data provided by your API/Context
                      const productId = item.prod_id || item.id; // Backend uses prod_id?
                      const product = item.product || {}; // Ensure product object exists
                      const productName = product.name || `Product ID: ${productId}`;
                      const productPrice = Number(product.price) || 0; // Ensure price is a number
                      const imageUrl = product.image_url || 'https://via.placeholder.com/150?text=No+Image'; // Default image
                      const itemSubtotal = (productPrice * item.quantity).toFixed(2);
                      // ---

                      // Ensure item has a valid key
                      if (!productId) {
                          console.warn("Cart item missing valid ID:", item);
                          return null; // Skip rendering this item if it has no ID
                      }

                      return (
                        <div key={productId} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors duration-150">
                          {/* Item Details */}
                          <div className="flex items-center flex-grow min-w-0 mr-4">
                            <div className="w-16 h-16 rounded-md overflow-hidden mr-4 flex-shrink-0 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                              <img src={imageUrl} alt={productName} className="w-full h-full object-cover" loading="lazy" />
                            </div>
                            <div className="min-w-0">
                              <h2 className="font-semibold text-base truncate" title={productName}>{productName}</h2>
                              <p className="text-sm text-gray-500 dark:text-gray-400">${productPrice.toFixed(2)} each</p>
                            </div>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center space-x-2 flex-shrink-0 my-2 sm:my-0">
                            <Button variant="outline" size="icon" className="h-8 w-8 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => handleUpdateQuantity(item, 'decrease')}
                              aria-label={`Decrease quantity of ${productName}`}
                              disabled={isUpdating} // Disable during any item update
                            > <Minus className="h-4 w-4" /> </Button>
                            <span className="w-8 text-center font-medium tabular-nums">{item.quantity}</span>
                            <Button variant="outline" size="icon" className="h-8 w-8 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => handleUpdateQuantity(item, 'increase')}
                              aria-label={`Increase quantity of ${productName}`}
                              disabled={isUpdating} // Disable during any item update
                            > <Plus className="h-4 w-4" /> </Button>
                          </div>

                          {/* Item Total Price */}
                          <div className="font-semibold text-base w-24 text-right flex-shrink-0"> ${itemSubtotal} </div>

                          {/* Remove Button */}
                          <Button variant="ghost" size="icon" className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 h-8 w-8 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => handleRemoveItem(item)}
                            aria-label={`Remove ${productName} from cart`}
                            disabled={isUpdating} // Disable during any item update
                          > <X className="h-4 w-4" /> </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Cart Summary Section (Only show if items exist and context is not in initial load) */}
          {cartItems && cartItems.length > 0 && (
            <div className="lg:w-1/3">
              {/* Sticky positioning for summary card on larger screens */}
              <Card className={`sticky top-24 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm transition-opacity duration-300 ${isUpdating ? 'opacity-75' : 'opacity-100'}`}>
                <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                  <CardTitle className="text-lg font-semibold">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal ({itemCount} items):</span>
                    <span className="text-gray-800 dark:text-gray-100 font-medium">${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Shipping Fee:</span>
                    <span className="text-gray-800 dark:text-gray-100 font-medium">${shippingFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 pt-4">
                    <span className="text-gray-800 dark:text-gray-100 font-semibold text-lg">Total:</span>
                    <span className="text-gray-900 dark:text-white font-bold text-lg">${totalWithShipping.toFixed(2)}</span>
                  </div>
                  {/* Disable checkout button if any API call is in progress */}
                  <Button
                    className={`w-full mt-4 bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black ${isLoading || isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    size="lg"
                    disabled={isLoading || isUpdating} // Disable if globally loading OR if an item update is happening
                    onClick={handleCheckout}
                  >
                    {isLoading || isUpdating ? (
                         <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null }
                    Proceed to Checkout
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div> {/* End Cart Grid */}

      </div> {/* End Container */}
    </div> /* End Page Wrapper */
  );
};

export default CartPage;