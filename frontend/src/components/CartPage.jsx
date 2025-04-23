import React, { useState, useEffect } from 'react'; // Added useEffect
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, X, Minus, Plus, Loader2, ShoppingCart } from "lucide-react"; // Added Loader2, ShoppingCart
import { useCart } from '@/components/CartContext'; // Import the *refactored* cart hook
import { toast } from 'sonner'; // For feedback

const CartPage = () => {
  const navigate = useNavigate();
  // Assuming useCart() now provides items fetched from API,
  // API-calling functions, and loading/error states.
  const {
    cartItems,        // Should now come from GET /cart/ via context
    removeFromCart,   // Should now call DELETE /cart/{prod_id} via context
    updateQuantity,   // Should now call POST /cart/ via context
    cartTotal,        // Can still be calculated locally or provided by context
    isLoading,        // NEW: Loading state from context (for initial fetch/updates)
    error,            // NEW: Error state from context
    fetchCart,        // NEW: Function in context to explicitly refresh cart data
  } = useCart();

  // Local calculation might still be useful, or use cartTotal from context if pre-calculated
  const localCartTotal = cartItems.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);
  const shippingFee = localCartTotal > 0 ? 10.00 : 0; // Calculate based on items present
  const total = localCartTotal + shippingFee;

  // Fetch cart data when the component mounts or fetchCart function changes
  // This might alternatively live entirely within the CartProvider itself
  useEffect(() => {
    if (fetchCart) { // Ensure the fetch function exists before calling
       console.log("CartPage mounted, fetching cart...");
       fetchCart().catch(err => {
          console.error("Error fetching cart in CartPage:", err);
          // Error might already be handled and set in context state
       });
    }
  }, [fetchCart]); // Dependency on the fetch function from context

  const handleCheckout = () => {
    // Navigate to a Payment or Checkout page
    // This page would likely re-fetch cart items or use the context state
    // before proceeding with payment and order creation.
    navigate('/checkout'); // Example route, adjust as needed
    // navigate('/Payment'); // Or use your existing Payment route
  };

  // Specific handler for quantity updates that calls the context's API function
  const handleUpdateQuantity = async (itemId, currentQuantity, action) => {
      const newQuantity = action === 'increase' ? currentQuantity + 1 : currentQuantity - 1;

      if (newQuantity < 1) {
          // If decreasing quantity to 0, treat it as removal
          await handleRemoveItem(itemId);
          return;
      }

      try {
          // The context's updateQuantity should handle the POST /cart/ API call
          await updateQuantity(itemId, newQuantity); // Send the new target quantity
          // Optional: toast feedback can be handled within the context function
          // toast.info(`Quantity updated for item ${itemId}`);
      } catch (err) {
          console.error(`Failed to update quantity for item ${itemId}:`, err);
          // Error toast might be handled in context or shown here
          // toast.error(err.message || "Failed to update quantity.");
      }
  };

  // Specific handler for removing item that calls the context's API function
  const handleRemoveItem = async (itemId) => {
       try {
          // The context's removeFromCart should handle the DELETE /cart/{prod_id} call
          await removeFromCart(itemId);
          // Optional: toast feedback can be handled within the context function
          // toast.success("Item removed successfully.");
       } catch (err) {
           console.error(`Failed to remove item ${itemId}:`, err);
           // Error toast might be handled in context or shown here
           // toast.error(err.message || "Failed to remove item.");
       }
  };


  return (
    <div className="bg-gray-100 dark:bg-black min-h-screen py-8 text-gray-900 dark:text-gray-100">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <Button
            variant="ghost"
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white p-0 h-auto cursor-pointer"
            onClick={() => navigate('/shop')}
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Continue Shopping
          </Button>
          <h1 className="text-2xl lg:text-3xl font-bold text-center">
            Shopping Cart
          </h1>
          <div className="w-auto invisible"> {/* Spacer */}
            <Button variant="ghost"><ArrowLeft className="mr-1 h-4 w-4" />Continue Shopping</Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
           <div className="text-center py-20">
               <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
               <p className="text-muted-foreground">Loading your cart...</p>
           </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
            <div className="text-center py-20 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-6">
               <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" /> {/* Assumed XCircle import */}
               <p className="text-red-700 dark:text-red-300 font-semibold mb-2">Could not load cart</p>
               <p className="text-red-600 dark:text-red-400 text-sm mb-4">{error.message || "An unknown error occurred."}</p>
               <Button onClick={fetchCart} variant="destructive" size="sm">Try Again</Button>
           </div>
        )}

        {/* Cart Content (only render if not loading and no critical error) */}
        {!isLoading && !error && (
           <div className="flex flex-col lg:flex-row gap-8">
             {/* Cart Items Section */}
             <div className="flex-grow lg:w-2/3">
               <Card className="mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                 <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                   <CardTitle className="text-lg font-semibold">
                     Cart Items ({cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)}) {/* Calculate item count */}
                   </CardTitle>
                 </CardHeader>
                 <CardContent className="p-0"> {/* Remove padding here, add to items */}
                   {cartItems.length === 0 ? (
                     <div className="text-center py-12 px-4">
                       <ShoppingCart className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                       <p className="text-gray-500 dark:text-gray-400 mb-4">Your cart is empty.</p>
                       <Button
                         className="mt-4 bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black cursor-pointer"
                         variant="default"
                         onClick={() => navigate('/shop')}
                       >
                         Start Shopping
                       </Button>
                     </div>
                   ) : (
                     <div className="divide-y divide-gray-200 dark:divide-gray-700">
                       {cartItems.map((item) => (
                         <div
                           key={item.id || item.prod_id} // Use prod_id if id isn't returned from backend cart item
                           className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4"
                         >
                           {/* Item Details */}
                           <div className="flex items-center flex-grow min-w-0">
                             <div className="w-16 h-16 rounded-md overflow-hidden mr-4 flex-shrink-0 border border-gray-200 dark:border-gray-700">
                               <img
                                 // Use image_url if available from context/API item
                                 src={item.image_url || item.image || 'https://via.placeholder.com/150?text=No+Image'}
                                 alt={item.name || 'Product Image'}
                                 className="w-full h-full object-cover"
                                 loading="lazy"
                               />
                             </div>
                             <div className="min-w-0">
                               <h2 className="font-semibold text-base truncate">{item.name || `Product ID: ${item.prod_id}`}</h2>
                               <p className="text-sm text-gray-500 dark:text-gray-400">${(Number(item.price) || 0).toFixed(2)} each</p>
                             </div>
                           </div>

                           {/* Quantity Controls */}
                           <div className="flex items-center space-x-2 flex-shrink-0">
                             <Button
                               variant="outline" size="icon"
                               className="h-8 w-8 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                               onClick={() => handleUpdateQuantity(item.prod_id || item.id, item.quantity, 'decrease')}
                               aria-label={`Decrease quantity of ${item.name}`}
                               // Add disabled state if an update is in progress for this item? (Needs more state)
                             >
                               <Minus className="h-4 w-4" />
                             </Button>
                             <span className="w-8 text-center font-medium">{item.quantity}</span>
                             <Button
                               variant="outline" size="icon"
                               className="h-8 w-8 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                               onClick={() => handleUpdateQuantity(item.prod_id || item.id, item.quantity, 'increase')}
                               aria-label={`Increase quantity of ${item.name}`}
                               // Add disabled state if an update is in progress for this item?
                             >
                               <Plus className="h-4 w-4" />
                             </Button>
                           </div>

                           {/* Item Total */}
                           <div className="text-gray-800 dark:text-gray-100 font-semibold text-base w-24 text-right flex-shrink-0">
                             ${((Number(item.price) || 0) * (Number(item.quantity) || 0)).toFixed(2)}
                           </div>

                           {/* Remove Button */}
                           <Button
                             variant="ghost" size="icon"
                             className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 h-8 w-8 cursor-pointer"
                             onClick={() => handleRemoveItem(item.prod_id || item.id)}
                             aria-label={`Remove ${item.name} from cart`}
                             // Add disabled state if an update is in progress for this item?
                           >
                             <X className="h-4 w-4" />
                           </Button>
                         </div>
                       ))}
                     </div>
                   )}
                 </CardContent>
               </Card>
             </div>

             {/* Cart Summary Section */}
             <div className="lg:w-1/3">
               <Card className="sticky top-24 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                 <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                   <CardTitle className="text-lg font-semibold">Order Summary</CardTitle>
                 </CardHeader>
                 <CardContent className="p-6 space-y-4">
                   <div className="flex justify-between items-center">
                     <span className="text-gray-600 dark:text-gray-400">Subtotal ({cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)} items):</span>
                     <span className="text-gray-800 dark:text-gray-100 font-medium">${localCartTotal.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-gray-600 dark:text-gray-400">Shipping Fee:</span>
                     <span className="text-gray-800 dark:text-gray-100 font-medium">${shippingFee.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 pt-4">
                     <span className="text-gray-800 dark:text-gray-100 font-semibold text-lg">Total:</span>
                     <span className="text-gray-900 dark:text-white font-bold text-lg">${total.toFixed(2)}</span>
                   </div>
                   <Button
                     className={`w-full mt-4 bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black ${cartItems.length === 0 || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                     size="lg"
                     disabled={cartItems.length === 0 || isLoading} // Disable if empty or loading
                     onClick={handleCheckout}
                   >
                     Proceed to Checkout
                   </Button>
                 </CardContent>
               </Card>
             </div>
           </div>
        )}

      </div>
    </div>
  );
};

export default CartPage;