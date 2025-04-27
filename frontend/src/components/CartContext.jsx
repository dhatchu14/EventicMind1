// CartContext.jsx
import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react'; // Added useMemo
import { toast } from 'sonner';
import axiosInstance from '../api/axiosInstance'; // Your configured axios instance

// Create the context
const CartContext = createContext();

// Create the provider component
export const CartProvider = ({ children }) => {
  // State managed by the context
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);

  // --- API Functions (with useCallback and dependencies as before) ---
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
      setCartItems([]);
    } finally {
       if (showLoading) setIsLoading(false);
    }
  }, []);

  const removeFromCartAPI = useCallback(async (productId) => {
    console.log(`Context: Removing item ${productId}`);
    const itemToRemove = cartItems.find(item => (item.prod_id || item.id) === productId);
    const itemName = itemToRemove?.product?.name || `Product ID ${productId}`;
    const previousCartItems = [...cartItems];
    setCartItems(currentItems => currentItems.filter(item => (item.prod_id || item.id) !== productId));
    setIsUpdating(true);
    setError(null);
    try {
      await axiosInstance.delete(`/cart/${productId}`);
      toast.success(`"${itemName}" removed successfully.`);
    } catch (err) {
      console.error(`Context: Failed to remove item ${productId}:`, err);
      const errMsg = err.response?.data?.detail || err.message || "Could not remove item.";
      toast.error(`Error removing item: ${errMsg}`);
      setError(errMsg);
      setCartItems(previousCartItems);
    } finally {
      setIsUpdating(false);
    }
  }, [cartItems]); // Depends on cartItems

  const updateQuantityAPI = useCallback(async (productId, newQuantity) => {
     if (newQuantity < 1) {
         await removeFromCartAPI(productId);
         return;
     }
     console.log(`Context: Setting item ${productId} quantity to ${newQuantity}`);
     const itemToUpdate = cartItems.find(item => (item.prod_id || item.id) === productId);
     const itemName = itemToUpdate?.product?.name || `Product ID ${productId}`;
     const previousCartItems = [...cartItems];
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
       if (response.data && typeof response.data.id !== 'undefined') {
          console.log("Context: updateQuantityAPI - PUT Response OK, aligning state");
          setCartItems(currentItems =>
             currentItems.map(item => (item.id === response.data.id ? response.data : item))
           );
       } else {
           console.log("Context: updateQuantityAPI - PUT Response OK (No specific item body)");
       }
       toast.info(`Quantity for "${itemName}" updated to ${newQuantity}.`);
     } catch (err) {
       console.error(`Context: Failed to update quantity for item ${productId}:`, err);
       const errMsg = err.response?.data?.detail || err.message || "Could not update quantity.";
       toast.error(`Error updating quantity: ${errMsg}`);
       setError(errMsg);
       setCartItems(previousCartItems);
     } finally {
       setIsUpdating(false);
     }
  }, [cartItems, removeFromCartAPI]); // Depends on cartItems and removeFromCartAPI

  const addToCartAPI = useCallback(async (productId, quantity = 1) => {
    console.log(`Context: Adding/Incrementing item ${productId} by ${quantity}`);
    setIsUpdating(true);
    setError(null);
    const previousCartItems = [...cartItems];
    try {
        const response = await axiosInstance.post('/cart/', {
            prod_id: productId,
            quantity: quantity,
        });
        const addedOrUpdatedItem = response.data;
        if (!addedOrUpdatedItem || typeof addedOrUpdatedItem.id === 'undefined') {
             console.error("Context: addToCartAPI - POST Response invalid.", addedOrUpdatedItem);
             await fetchCart(false);
             toast.info(`Item updated/added. Cart refreshed.`);
             return addedOrUpdatedItem;
        }
        console.log("Context: addToCartAPI - POST OK, optimistic update.");
        // Optimistic Update
        setCartItems(currentItems => {
            const existingItemIndex = currentItems.findIndex(item => item.id === addedOrUpdatedItem.id);
            if (existingItemIndex > -1) {
                const updatedItems = [...currentItems];
                updatedItems[existingItemIndex] = addedOrUpdatedItem;
                return updatedItems;
            } else {
                return [...currentItems, addedOrUpdatedItem];
            }
        });
        toast.success(`Item updated/added in cart!`);
        // Background Consistency Check
        try {
             await fetchCart(false);
        } catch (fetchErr) {
             console.error("Context: addToCartAPI - Background consistency fetch failed, reverting.", fetchErr);
             setError("Failed to sync cart state after update. Reverted.");
             setCartItems(previousCartItems);
             toast.error("Error syncing cart, please refresh.");
        }
        return addedOrUpdatedItem;
    } catch (err) {
        console.error("Context: Failed to add/increment item via POST:", err);
        const errMsg = err.response?.data?.detail || err.message || "Could not update cart.";
        toast.error(`Error adding item: ${errMsg}`);
        setError(errMsg);
        setCartItems(previousCartItems);
        throw err;
    } finally {
        setIsUpdating(false);
    }
  }, [cartItems, fetchCart]); // Depends on cartItems and fetchCart

  const clearCartAPI = useCallback(async () => {
     console.log("Context: Clearing cart via API...");
     const previousCartItems = [...cartItems];
     setIsLoading(true);
     setError(null);
     setCartItems([]); // Optimistic Update
     try {
        await axiosInstance.delete('/cart/');
        toast.success("Cart cleared successfully.");
     } catch (err) {
        console.error("Context: Failed to clear cart:", err);
        const errMsg = err.response?.data?.detail || err.message || "Could not clear cart.";
        toast.error(`Error clearing cart: ${errMsg}`);
        setError(errMsg);
        setCartItems(previousCartItems); // Revert
     } finally {
        setIsLoading(false);
     }
  }, [cartItems]); // Depends on cartItems


  // --- Derived State Calculations (using useMemo as before) ---
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


  // --- Context Value ---
  // *** Memoize the contextValue object itself ***
  // This ensures that the object reference passed down only changes when
  // one of its constituent values actually changes.
  const contextValue = useMemo(() => {
      console.log("Creating NEW contextValue object"); // Log when this happens
      return {
          cartItems,
          isLoading,
          isUpdating,
          error,
          fetchCart, // Stable ref
          addToCartAPI, // Ref changes when cartItems changes
          removeFromCartAPI, // Ref changes when cartItems changes
          updateQuantityAPI, // Ref changes when cartItems changes
          clearCartAPI, // Ref changes when cartItems changes
          cartTotal, // Value changes when cartItems changes
          itemCount, // Value changes when cartItems changes
      };
  }, [
      cartItems, isLoading, isUpdating, error, // State values
      fetchCart, addToCartAPI, removeFromCartAPI, updateQuantityAPI, clearCartAPI, // Memoized functions
      cartTotal, itemCount // Memoized derived values
  ]);

  // Initial Fetch
  useEffect(() => {
      console.log("CartProvider Mount: Fetching initial cart.");
      fetchCart();
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // fetchCart is stable


  console.log(`--- CartProvider Rendering --- itemCount: ${itemCount}, isLoading: ${isLoading}, isUpdating: ${isUpdating}`);
  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook (No changes needed)
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};