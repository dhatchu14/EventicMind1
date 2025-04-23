import React, { createContext, useState, useEffect, useContext } from 'react';
import { toast } from 'sonner'; // Import toast for feedback

// Define a key for localStorage
const CART_STORAGE_KEY = 'shoppingCartItems';

// Create a context
const CartContext = createContext();

// Helper function to load cart from localStorage
const loadCartFromStorage = () => {
  try {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (storedCart) {
      // Basic validation: Ensure it's an array
      const parsedCart = JSON.parse(storedCart);
      if (Array.isArray(parsedCart)) {
         // Further validation could be added here (e.g., check item structure)
         console.log("Cart loaded from localStorage:", parsedCart);
         return parsedCart;
      } else {
         console.warn("Invalid cart data found in localStorage (not an array). Clearing.");
         localStorage.removeItem(CART_STORAGE_KEY);
      }
    }
  } catch (error) {
    console.error("Failed to parse cart from localStorage:", error);
    // Clear corrupted data
    localStorage.removeItem(CART_STORAGE_KEY);
  }
  return []; // Return empty array if nothing stored, or on error
};

// Create a provider component
export const CartProvider = ({ children }) => {
  // Initialize state from localStorage
  const [cartItems, setCartItems] = useState(loadCartFromStorage);

  // --- Persist cart to localStorage whenever it changes ---
  useEffect(() => {
    try {
        // console.log("Saving cart to localStorage:", cartItems); // Optional: log saving
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {
        console.error("Failed to save cart to localStorage:", error);
        toast.error("Could not save cart state. Please try again."); // Inform user
    }
  }, [cartItems]); // Dependency array ensures this runs when cartItems changes

  // Add item to cart
  const addToCart = (product, quantity = 1) => {
    // Basic validation on the product object
    if (!product || typeof product !== 'object' || !product.id || !product.price || !product.name) {
        console.error("addToCart called with invalid product data:", product);
        toast.error("Cannot add item: Invalid product data.");
        return;
    }
    // Ensure quantity is a positive number
    const validQuantity = Math.max(1, Number(quantity) || 1);

    setCartItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.id === product.id);

      if (existingItemIndex >= 0) {
        // Item exists, update quantity
        const updatedItems = [...prevItems];
        const newQuantity = updatedItems[existingItemIndex].quantity + validQuantity;
        // Optional: Add check against available stock if stock info is passed or available here
        // if (newQuantity > product.availableStock) {
        //   toast.warn(`Cannot add more. Only ${product.availableStock} of ${product.name} available.`);
        //   updatedItems[existingItemIndex].quantity = product.availableStock;
        // } else {
           updatedItems[existingItemIndex].quantity = newQuantity;
        // }
        toast.info(`${validQuantity} more "${product.name}" added to cart.`);
        return updatedItems;
      } else {
        // Item doesn't exist, add new item
        // Make sure to only add necessary product info to the cart
        const newItem = {
            id: product.id,
            name: product.name,
            price: product.price,
            image_url: product.image_url || product.image, // Handle both possible image keys
            // Add other relevant fields like category if needed for cart display
            category: product.category,
            quantity: validQuantity
        };
        toast.success(`"${newItem.name}" added to cart.`);
        return [...prevItems, newItem];
      }
    });
  };

  // Remove single item entirely from cart
  const removeFromCart = (productId) => {
    setCartItems(prevItems => {
        const itemToRemove = prevItems.find(item => item.id === productId);
        if (itemToRemove) {
             toast.success(`"${itemToRemove.name}" removed from cart.`);
        }
        return prevItems.filter(item => item.id !== productId);
    });
  };

  // Clear entire cart
  const clearCart = () => {
    if (cartItems.length > 0) { // Only show toast if cart wasn't already empty
      setCartItems([]);
      toast.success("Cart cleared successfully.");
    }
  };

  // Remove multiple items from cart (e.g., after successful checkout)
  const removePaidItems = (productIds) => {
    if (!Array.isArray(productIds) || productIds.length === 0) return;
    setCartItems(prevItems =>
      prevItems.filter(item => !productIds.includes(item.id))
    );
    // Toast feedback might be better handled by the calling component (e.g., checkout success page)
    // toast.info("Purchased items removed from cart.");
  };

  // Update item quantity (increase or decrease by 1)
  const updateQuantity = (productId, action) => {
    setCartItems(prevItems => {
      const itemIndex = prevItems.findIndex(item => item.id === productId);
      if (itemIndex < 0) return prevItems; // Item not found

      const updatedItems = [...prevItems];
      const currentItem = updatedItems[itemIndex];

      if (action === 'increase') {
         // Optional: Add stock check here if possible
         updatedItems[itemIndex] = { ...currentItem, quantity: currentItem.quantity + 1 };
      } else if (action === 'decrease') {
         if (currentItem.quantity > 1) {
           updatedItems[itemIndex] = { ...currentItem, quantity: currentItem.quantity - 1 };
         } else {
           // If quantity is 1 and decrease is pressed, remove the item
           // Alternatively, keep quantity at 1: return prevItems;
           updatedItems.splice(itemIndex, 1); // Remove the item
           toast.info(`"${currentItem.name}" removed from cart.`);
         }
      }
      return updatedItems;
    });
  };

  // Calculate total price (Memoization could be added for performance if cart gets huge)
  const cartTotal = cartItems.reduce((sum, item) => {
      // Ensure price and quantity are valid numbers
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 0;
      return sum + (price * quantity);
  }, 0);

  // Calculate total item count
  const itemCount = cartItems.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      return sum + quantity;
  }, 0);

  // --- Context Value ---
  const contextValue = {
      cartItems,
      addToCart,
      removeFromCart,
      clearCart,
      removePaidItems,
      updateQuantity,
      cartTotal,
      itemCount
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use the cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) { // Check for undefined, as null/empty object could be valid initial states
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};