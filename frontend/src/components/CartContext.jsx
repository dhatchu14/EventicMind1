import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { toast } from 'sonner';
import axiosInstance from '../api/axiosInstance'; // Your configured axios instance

// Create the context
const CartContext = createContext();

// Create the provider component
export const CartProvider = ({ children }) => {
  // State managed by the context
  const [cartItems, setCartItems] = useState([]); // Holds items from API (now with product details)
  const [isLoading, setIsLoading] = useState(true); // Global loading for major cart ops
  const [isUpdating, setIsUpdating] = useState(false); // More granular loading for updates/removals
  const [error, setError] = useState(null); // Holds API error messages/objects

  // --- Function to fetch cart data from the API ---
  const fetchCart = useCallback(async (showLoading = true) => {
    console.log("Context: Fetching cart...");
    if (showLoading) setIsLoading(true); // Use global loading for initial/major fetches
    setError(null);
    try {
      const response = await axiosInstance.get('/cart/'); // GET /cart endpoint
      // Expect response.data to match CartWithDetailsOut schema -> { items: [...] }
      if (response.data && Array.isArray(response.data.items)) {
        console.log("Context: Cart data fetched:", response.data.items);
        setCartItems(response.data.items); // Items now include nested product details
      } else {
        console.warn("Context: Received empty or invalid cart data:", response.data);
        setCartItems([]);
      }
    } catch (err) {
      console.error("Context: Failed to fetch cart:", err);
      const errorMsg = err.response?.data?.detail || err.message || "Could not load cart data.";
      setError(errorMsg); // Set error state
      // Don't toast here, let components decide based on the error state
      setCartItems([]); // Clear cart on fetch error
    } finally {
       if (showLoading) setIsLoading(false);
    }
  }, []); // Stable function identity

  // --- Function to ADD/INCREMENT quantity via API ---
  // This uses the POST /cart/ endpoint which ADDS the quantity sent
  const addToCartAPI = async (productId, quantity = 1) => {
     console.log(`Context: Adding/Incrementing item ${productId} by ${quantity}`);
     setIsUpdating(true); // Use granular loading
     setError(null);
     try {
       // POST /cart/ expects { prod_id, quantity (to add) }
       const response = await axiosInstance.post('/cart/', {
         prod_id: productId,
         quantity: quantity,
       });
       // Response should be the updated/added CartItemWithProductOut
       toast.success(`Item updated/added in cart!`);
       await fetchCart(false); // Refresh cart state without global loading indicator
       return response.data;
     } catch (err) {
       console.error("Context: Failed to add/increment item:", err);
       const errMsg = err.response?.data?.detail || err.message || "Could not update cart.";
       toast.error(`Error: ${errMsg}`);
       setError(errMsg);
       throw err; // Re-throw for component handling
     } finally {
       setIsUpdating(false);
     }
  };

  // --- Function to REMOVE item via API ---
  const removeFromCartAPI = async (productId) => {
    console.log(`Context: Removing item ${productId}`);
    const itemToRemove = cartItems.find(item => (item.prod_id || item.id) === productId);
    const itemName = itemToRemove?.product?.name || `Product ID ${productId}`;

    setIsUpdating(true); // Granular loading
    setError(null);
    try {
      // DELETE /cart/{prod_id}
      await axiosInstance.delete(`/cart/${productId}`);
      toast.success(`"${itemName}" removed successfully.`);
      // Refresh the cart state from backend *without* full page loading indicator
      await fetchCart(false);
    } catch (err) {
      console.error(`Context: Failed to remove item ${productId}:`, err);
      const errMsg = err.response?.data?.detail || err.message || "Could not remove item.";
      toast.error(`Error removing item: ${errMsg}`);
      setError(errMsg);
      // Don't automatically refresh on error, state might be inconsistent
    } finally {
      setIsUpdating(false);
    }
  };

  // --- Function to SET item quantity via API ---
  // This uses the new PUT /cart/{prod_id} endpoint
  const updateQuantityAPI = async (productId, newQuantity) => {
     // Basic validation
     if (newQuantity < 1) {
         // Automatically remove if quantity is set below 1
         console.log(`Context: Quantity for ${productId} set below 1, removing item.`);
         await removeFromCartAPI(productId);
         return; // Exit after removal
     }

     console.log(`Context: Setting item ${productId} quantity to ${newQuantity}`);
     const itemToUpdate = cartItems.find(item => (item.prod_id || item.id) === productId);
     const itemName = itemToUpdate?.product?.name || `Product ID ${productId}`;

     setIsUpdating(true); // Granular loading
     setError(null);
     try {
       // Call the PUT endpoint with the new quantity in the body
       // PUT /cart/{prod_id} expects { "quantity": newQuantity }
       const response = await axiosInstance.put(`/cart/${productId}`, {
         quantity: newQuantity,
       });
       // Response is Optional[CartItemWithProductOut]
       if (response.data) {
          toast.info(`Quantity for "${itemName}" updated to ${newQuantity}.`);
       } else {
          // This case shouldn't happen if newQuantity >= 1, but handle defensively
          console.warn(`Context: Update for ${productId} resulted in null response?`);
       }
       await fetchCart(false); // Refresh cart state
     } catch (err) {
       console.error(`Context: Failed to update quantity for item ${productId}:`, err);
       const errMsg = err.response?.data?.detail || err.message || "Could not update quantity.";
       toast.error(`Error updating quantity: ${errMsg}`);
       setError(errMsg);
     } finally {
       setIsUpdating(false);
     }
  };

  // --- Function to CLEAR entire cart via API ---
  const clearCartAPI = async () => {
     console.log("Context: Clearing cart via API...");
     setIsLoading(true); // Use global loading for this major action
     setError(null);
     try {
        await axiosInstance.delete('/cart/'); // DELETE /cart/ endpoint
        toast.success("Cart cleared successfully.");
        setCartItems([]); // Optimistically update UI
     } catch (err) {
        console.error("Context: Failed to clear cart:", err);
        const errMsg = err.response?.data?.detail || err.message || "Could not clear cart.";
        toast.error(`Error clearing cart: ${errMsg}`);
        setError(errMsg);
        // Optionally fetch cart again to confirm backend state on error
        // await fetchCart(false);
     } finally {
        setIsLoading(false);
     }
  };

  // --- Calculate derived state (using nested product info) ---
  const cartTotal = cartItems.reduce((sum, item) => {
      const price = Number(item.product?.price) || 0; // Access nested price
      const quantity = Number(item.quantity) || 0;
      return sum + (price * quantity);
  }, 0);

  const itemCount = cartItems.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      return sum + quantity;
  }, 0);

  // --- Context Value ---
  const contextValue = {
      cartItems,
      isLoading,    // For initial load / major ops like clear
      isUpdating,   // For item-level updates/removals
      error,
      fetchCart,
      addToCartAPI, // Use if needed from components other than ProductDetails
      removeFromCartAPI,
      updateQuantityAPI, // Use this for +/- buttons on CartPage
      clearCartAPI,
      cartTotal,
      itemCount
  };

  // Fetch cart initially when provider mounts
  useEffect(() => {
      fetchCart();
  }, [fetchCart]); // fetchCart is memoized by useCallback


  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook remains the same
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};