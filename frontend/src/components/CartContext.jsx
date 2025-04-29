// CartContext.jsx
import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import axiosInstance from '../api/axiosInstance'; // Your configured axios instance

// Create the context
const CartContext = createContext();

// Create the provider component
export const CartProvider = ({ children }) => {
  // State managed by the context
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // For initial load and full clear
  const [isUpdating, setIsUpdating] = useState(false); // For individual item updates
  const [error, setError] = useState(null);

  // --- API Functions ---
  const fetchCart = useCallback(async (showLoading = true) => {
    console.log("Context: Fetching cart...");
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get('/cart/');
      console.log("Context: fetchCart - Raw GET response data:", JSON.stringify(response.data, null, 2));
      if (response.data && Array.isArray(response.data.items)) {
        console.log("Context: fetchCart - Calling setCartItems with items count:", response.data.items.length);
        setCartItems(response.data.items);
      } else {
        console.warn("Context: fetchCart - Received empty/invalid data:", response.data);
        setCartItems([]);
      }
    } catch (err) {
      console.error("Context: Failed to fetch cart:", err);
      const errorMsg = err.response?.data?.detail || err.message || "Could not load cart data.";
      setError(errorMsg);
      setCartItems([]); // Clear cart on fetch error
    } finally {
       if (showLoading) setIsLoading(false);
    }
  }, []); // fetchCart is stable

  const removeFromCartAPI = useCallback(async (productId) => {
    console.log(`Context: Removing item ${productId}`);
    const itemToRemove = cartItems.find(item => (item.prod_id || item.id) === productId);
    const itemName = itemToRemove?.product?.name || `Product ID ${productId}`;
    const previousCartItems = [...cartItems]; // Store previous state for potential revert
    setCartItems(currentItems => currentItems.filter(item => (item.prod_id || item.id) !== productId)); // Optimistic Update
    setIsUpdating(true);
    setError(null);
    try {
      await axiosInstance.delete(`/cart/${productId}`);
      toast.success(`"${itemName}" removed successfully.`); // Keep success toast for individual remove
    } catch (err) {
      console.error(`Context: Failed to remove item ${productId}:`, err);
      const errMsg = err.response?.data?.detail || err.message || "Could not remove item.";
      toast.error(`Error removing item: ${errMsg}`);
      setError(errMsg);
      setCartItems(previousCartItems); // Revert optimistic update on error
    } finally {
      setIsUpdating(false);
    }
  }, [cartItems]); // Depends on cartItems

  const updateQuantityAPI = useCallback(async (productId, newQuantity) => {
     if (newQuantity < 1) {
         // Delegate to remove function if quantity is less than 1
         await removeFromCartAPI(productId);
         return;
     }
     console.log(`Context: Setting item ${productId} quantity to ${newQuantity}`);
     const itemToUpdate = cartItems.find(item => (item.prod_id || item.id) === productId);
     const itemName = itemToUpdate?.product?.name || `Product ID ${productId}`;
     const previousCartItems = [...cartItems]; // Store previous state for potential revert
     // Optimistic Update: Update quantity immediately in UI
     setCartItems(currentItems =>
        currentItems.map(item =>
          (item.prod_id || item.id) === productId
            ? { ...item, quantity: newQuantity }
            : item
        )
     );
     setIsUpdating(true);
     setError(null);
     try {
       const response = await axiosInstance.put(`/cart/${productId}`, { quantity: newQuantity });
       // Optional: Align state more precisely if PUT response returns the updated item
       if (response.data && typeof response.data.id !== 'undefined') {
          console.log("Context: updateQuantityAPI - PUT Response OK, aligning state");
          setCartItems(currentItems =>
             currentItems.map(item => (item.id === response.data.id ? response.data : item))
           );
       } else {
           console.log("Context: updateQuantityAPI - PUT Response OK (No specific item body)");
       }
       toast.info(`Quantity for "${itemName}" updated to ${newQuantity}.`); // Keep info toast for update
     } catch (err) {
       console.error(`Context: Failed to update quantity for item ${productId}:`, err);
       const errMsg = err.response?.data?.detail || err.message || "Could not update quantity.";
       toast.error(`Error updating quantity: ${errMsg}`);
       setError(errMsg);
       setCartItems(previousCartItems); // Revert optimistic update on error
     } finally {
       setIsUpdating(false);
     }
  }, [cartItems, removeFromCartAPI]); // Depends on cartItems and stable removeFromCartAPI

  const addToCartAPI = useCallback(async (productId, quantity = 1) => {
    console.log(`Context: Adding/Incrementing item ${productId} by ${quantity}`);
    setIsUpdating(true);
    setError(null);
    const previousCartItems = [...cartItems]; // Store for potential revert
    try {
        const response = await axiosInstance.post('/cart/', {
            prod_id: productId,
            quantity: quantity,
        });
        const addedOrUpdatedItem = response.data;
        // Validate response - adjust based on your actual API response structure
        if (!addedOrUpdatedItem || typeof addedOrUpdatedItem.id === 'undefined') {
             console.error("Context: addToCartAPI - POST Response invalid.", addedOrUpdatedItem);
             // If response is invalid, try fetching the whole cart to sync
             await fetchCart(false);
             toast.info(`Item updated/added. Cart refreshed.`);
             return addedOrUpdatedItem; // Return potentially invalid data or handle differently
        }
        console.log("Context: addToCartAPI - POST OK, updating state.");
        // Update state based on the response from the backend
        setCartItems(currentItems => {
            const existingItemIndex = currentItems.findIndex(item => item.id === addedOrUpdatedItem.id);
            if (existingItemIndex > -1) {
                // Item exists, replace it with the updated version from backend
                const updatedItems = [...currentItems];
                updatedItems[existingItemIndex] = addedOrUpdatedItem;
                return updatedItems;
            } else {
                // New item, add it to the cart
                return [...currentItems, addedOrUpdatedItem];
            }
        });
        toast.success(`Item updated/added in cart!`); // Keep success toast for add/update

        // Optional: Background consistency check (could be removed if causing issues)
        // try {
        //      await fetchCart(false);
        // } catch (fetchErr) {
        //      console.error("Context: addToCartAPI - Background consistency fetch failed, maybe revert?", fetchErr);
        //      // Decide if reverting is necessary here
        //      // setError("Failed to sync cart state after update.");
        //      // setCartItems(previousCartItems);
        //      // toast.error("Error syncing cart, please refresh.");
        // }

        return addedOrUpdatedItem;
    } catch (err) {
        console.error("Context: Failed to add/increment item via POST:", err);
        const errMsg = err.response?.data?.detail || err.message || "Could not update cart.";
        toast.error(`Error adding item: ${errMsg}`);
        setError(errMsg);
        setCartItems(previousCartItems); // Revert any optimistic changes if API fails
        throw err; // Re-throw error for component to handle if needed
    } finally {
        setIsUpdating(false);
    }
  }, [cartItems, fetchCart]); // Depends on cartItems and stable fetchCart

  // --- Function to clear cart (Backend + Optimistic UI Update) ---
  const clearCartAPI = useCallback(async () => {
     console.log("Context: Clearing cart via API...");
     const previousCartItems = [...cartItems]; // Store for potential revert
     // Use isLoading as it's a full cart operation
     setIsLoading(true);
     setError(null);
     setCartItems([]); // Optimistic Update: UI clears immediately
     try {
        await axiosInstance.delete('/cart/'); // Call backend endpoint to clear the cart
        console.log("Context: Cart cleared via API successfully (toast skipped).");
        // toast.success("Cart cleared successfully."); // <-- SUCCESS TOAST REMOVED/COMMENTED OUT
     } catch (err) {
        console.error("Context: Failed to clear cart:", err);
        const errMsg = err.response?.data?.detail || err.message || "Could not clear cart.";
        toast.error(`Error clearing cart: ${errMsg}`); // Keep error toast for feedback
        setError(errMsg);
        setCartItems(previousCartItems); // Revert optimistic update if backend fails
     } finally {
        setIsLoading(false); // Stop loading indicator
     }
  }, [cartItems]); // Depends only on cartItems for reverting state


  // --- Derived State Calculations (using useMemo) ---
  const cartTotal = useMemo(() => {
      // console.log("Recalculating cartTotal");
      return cartItems.reduce((sum, item) => {
          const price = Number(item.product?.price) || 0;
          const quantity = Number(item.quantity) || 0;
          return sum + (price * quantity);
      }, 0);
  }, [cartItems]);

  const itemCount = useMemo(() => {
      // console.log("Recalculating itemCount");
      return cartItems.reduce((sum, item) => {
          const quantity = Number(item.quantity) || 0;
          return sum + quantity;
      }, 0);
  }, [cartItems]);


  // --- Context Value (Memoized) ---
  // Memoize the context value object itself to prevent unnecessary re-renders
  const contextValue = useMemo(() => {
      console.log("Creating NEW contextValue object");
      return {
          cartItems,
          isLoading,
          isUpdating,
          error,
          fetchCart,          // Memoized by useCallback
          addToCartAPI,       // Memoized by useCallback (changes if cartItems changes)
          removeFromCartAPI,  // Memoized by useCallback (changes if cartItems changes)
          updateQuantityAPI,  // Memoized by useCallback (changes if cartItems/removeFromCartAPI changes)
          clearCartAPI,       // Memoized by useCallback (changes if cartItems changes)
          cartTotal,          // Memoized by useMemo
          itemCount,          // Memoized by useMemo
      };
  }, [
      cartItems, isLoading, isUpdating, error, // State dependencies
      fetchCart, addToCartAPI, removeFromCartAPI, updateQuantityAPI, clearCartAPI, // Function dependencies
      cartTotal, itemCount // Derived state dependencies
  ]);

  // --- Initial Fetch ---
  useEffect(() => {
      console.log("CartProvider Mount: Fetching initial cart.");
      fetchCart();
      // fetchCart is stable due to useCallback([]) - no need to include in deps array
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // --- Render Log ---
  console.log(`--- CartProvider Rendering --- itemCount: ${itemCount}, isLoading: ${isLoading}, isUpdating: ${isUpdating}`);
  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

// --- Custom hook --- (No changes needed)
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};