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
    isLoading,          // Global loading state
    isUpdating,         // Item-level update loading state
    error,
    fetchCart,          // Function to explicitly refresh
    removeFromCartAPI,  // Use this for removing items
    updateQuantityAPI,  // Use this for +/- quantity buttons
    cartTotal,
    itemCount
  } = useCart();

  // Fetch cart data when the component mounts (or if fetchCart changes)
  // Context provider also calls fetchCart on mount, so this might be redundant
  // depending on exact timing, but ensures data is requested when page is visited.
  // Consider removing if provider's initial fetch is sufficient.
  // useEffect(() => {
  //   console.log("CartPage mounted, calling fetchCart (potentially redundant)...");
  //   fetchCart().catch(err => {
  //       console.error("CartPage: Initial cart fetch failed.", err);
  //   });
  // }, [fetchCart]);

  // --- Event Handlers ---

  // Handles +/- button clicks, calls the context's updateQuantityAPI (which uses PUT)
  const handleUpdateQuantity = async (item, action) => {
      const productId = item.prod_id || item.id;
      if (!productId) {
          console.error("Missing product ID for item:", item);
          toast.error("Cannot update item: Missing ID.");
          return;
      }
      const currentQuantity = item.quantity;
      // Calculate the *target* quantity
      const newQuantity = action === 'increase' ? currentQuantity + 1 : currentQuantity - 1;

      // The API function in context handles quantity < 1 by calling remove
      try {
         await updateQuantityAPI(productId, newQuantity);
      } catch (err) {
         // Error is logged and toasted within context function
         console.error("CartPage: Error during quantity update:", err);
      }
  };

  // Handles 'X' button click, calls the context's removeFromCartAPI
  const handleRemoveItem = async (item) => {
       const productId = item.prod_id || item.id;
       if (!productId) {
           console.error("Missing product ID for item:", item);
           toast.error("Cannot remove item: Missing ID.");
           return;
       }
       try {
          await removeFromCartAPI(productId);
       } catch (err) {
          console.error("CartPage: Error during item removal:", err);
       }
  };

  // Navigate to checkout
  const handleCheckout = () => {
    if (cartItems.length === 0) {
        toast.warn("Your cart is empty.");
        return;
    }
    navigate('/checkout'); // Adjust route if needed
  };


  // --- Calculate local display values ---
  const shippingFee = cartTotal > 0 ? 10.00 : 0; // Example shipping logic
  const totalWithShipping = cartTotal + shippingFee;


  // --- RENDER LOGIC ---

  // 1. Global Loading State (for initial load / clear cart)
  if (isLoading) {
     return ( /* ... Loading spinner ... */
        <div className="bg-gray-100 dark:bg-black min-h-screen py-8 text-gray-900 dark:text-gray-100 flex justify-center items-center">
           <div className="text-center">
             <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
             <p className="text-muted-foreground">Loading your cart...</p>
           </div>
        </div>
     );
  }

  // 2. Error State (Show if fetch failed and cart is empty)
  if (error && cartItems.length === 0) {
      return ( /* ... Error display ... */
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
               <p className="text-red-600 dark:text-red-400 text-sm mb-4">{typeof error === 'string' ? error : "An unknown error occurred."}</p>
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
           <div className="w-auto invisible"> <Button variant="ghost"><ArrowLeft className="mr-1 h-4 w-4" />Continue Shopping</Button> </div>
        </div>

        {/* Cart Grid */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items Section */}
          <div className="flex-grow lg:w-2/3">
            <Card className={`mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm ${isUpdating ? 'opacity-75 pointer-events-none' : ''}`}> {/* Dim section while updating */}
              <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                <CardTitle className="text-lg font-semibold"> Cart Items ({itemCount}) </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {cartItems.length === 0 ? (
                  // Empty Cart State
                  <div className="text-center py-16 px-4">
                     <ShoppingCart className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-6" />
                     <p className="text-gray-500 dark:text-gray-400 mb-6">Your cart is empty.</p>
                     <Button className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black cursor-pointer" onClick={() => navigate('/shop')}> Start Shopping </Button>
                  </div>
                ) : (
                  // List of Cart Items
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {cartItems.map((item) => {
                      // Access nested product details (ensure these fields exist!)
                      const productId = item.prod_id || item.id;
                      const productName = item.product?.name || `Product ${productId}`;
                      const productPrice = Number(item.product?.price) || 0;
                      const imageUrl = item.product?.image_url || 'https://via.placeholder.com/150?text=No+Image';
                      const itemSubtotal = (productPrice * item.quantity).toFixed(2);

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
            {/* Display general update indicator */}
             {isUpdating && (
                 <div className="flex items-center justify-center text-sm text-muted-foreground mt-2">
                     <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Updating cart...
                 </div>
             )}
          </div>

          {/* Cart Summary Section (Only show if items exist) */}
          {cartItems.length > 0 && (
            <div className="lg:w-1/3">
              <Card className={`sticky top-24 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm ${isUpdating ? 'opacity-75' : ''}`}>
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
                  <Button
                    className={`w-full mt-4 bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black ${isLoading || isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    size="lg"
                    disabled={isLoading || isUpdating} // Disable checkout if loading or updating
                    onClick={handleCheckout}
                  >
                    Proceed to Checkout
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartPage;