import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
// --- CORRECT IMPORT: Use the configured axios instance ---
import axiosInstance from '../api/axiosInstance';
// ------------------------------------------------------
import {
    Star, Truck, ShieldCheck, RefreshCw, Heart, Share2, ArrowLeft,
    MinusCircle, PlusCircle, Loader2, AlertTriangle, Info, Layers3,
    CheckCircle, XCircle, Box, ShoppingCart // Added ShoppingCart
} from "lucide-react";

// Removed useCart import as add action is now handled directly via API


const ProductDetails = () => {
    const { id: productId } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [loadingProduct, setLoadingProduct] = useState(true);
    const [productError, setProductError] = useState(null);
    const [activeTab, setActiveTab] = useState("description");

    // Inventory State
    const [inventoryStock, setInventoryStock] = useState(null);
    const [loadingInventory, setLoadingInventory] = useState(true);
    const [inventoryError, setInventoryError] = useState(null);

    // Loading state specifically for the "Add to Cart" API call
    const [isAddingToCart, setIsAddingToCart] = useState(false);

    // --- Fetch Product and Inventory Data using axiosInstance ---
    useEffect(() => {
        const fetchDetails = async () => {
            if (!productId) {
                setProductError("No product ID provided.");
                setLoadingProduct(false);
                setLoadingInventory(false);
                return;
            }

            setLoadingProduct(true);
            setLoadingInventory(true);
            setProductError(null);
            setInventoryError(null);
            setProduct(null);
            setInventoryStock(null); // Reset inventory on new fetch

            try {
                // Fetch both product and inventory concurrently
                const results = await Promise.allSettled([
                    // Use the configured axiosInstance here
                    axiosInstance.get(`/products/${productId}`),
                    axiosInstance.get(`/inventory/${productId}`)
                ]);

                const productResult = results[0];
                const inventoryResult = results[1];

                // Process Product Result
                if (productResult.status === 'fulfilled' && productResult.value.data) {
                    setProduct(productResult.value.data);
                } else {
                    console.error("Error fetching product details:", productResult.reason || 'No data');
                    const errorMsg = productResult.reason?.response?.data?.detail || 'Failed to load product details.';
                    setProductError(errorMsg);
                    toast.error(`Error loading product: ${errorMsg}`);
                    setProduct(null);
                }

                // Process Inventory Result
                if (inventoryResult.status === 'fulfilled' && inventoryResult.value.data) {
                    setInventoryStock(inventoryResult.value.data.stock);
                } else {
                    console.error("Error fetching inventory details:", inventoryResult.reason || 'No data');
                    if (inventoryResult.reason?.response?.status === 404) {
                        console.warn(`Inventory record not found for product ID ${productId}. Assuming stock is 0.`);
                        setInventoryStock(0); // Treat 404 as 0 stock
                    } else {
                        const errorMsg = inventoryResult.reason?.response?.data?.detail || 'Failed to load stock information.';
                        setInventoryError(errorMsg); // Keep track of specific inventory error
                        setInventoryStock(null); // Explicitly set to null if error other than 404
                        toast.error(`Error loading stock: ${errorMsg}`);
                    }
                }

            } catch (err) {
                // Catch unexpected errors during Promise.allSettled or setup
                console.error("Unexpected error fetching details:", err);
                const generalError = "An unexpected error occurred while loading details.";
                setProductError(prev => prev || generalError);
                setInventoryError(prev => prev || generalError);
                toast.error(generalError);
            } finally {
                setLoadingProduct(false);
                setLoadingInventory(false);
            }
        };

        fetchDetails();
        // Dependency array ensures this runs when the productId changes
    }, [productId]);


    // --- Handle Quantity Changes ---
    const handleQuantityChange = (action) => {
        if (action === 'increase') {
            // Prevent increasing if stock is known and quantity is already at or above stock
            if (typeof inventoryStock === 'number' && quantity >= inventoryStock) {
                 toast.warn(`Cannot add more. Only ${inventoryStock} item(s) in stock.`);
                 return;
            }
            setQuantity(prev => prev + 1);
        } else if (action === 'decrease' && quantity > 1) {
            // Prevent decreasing below 1
            setQuantity(prev => prev - 1);
        }
    };

    // --- Handle "Add to Cart" Button Click ---
    const handleAddToCart = async () => {
        // ** Pre-checks before making API call **
        if (!product || product.id === undefined) {
            toast.error("Product data is missing or invalid.");
            return;
        }
        if (loadingInventory || inventoryStock === null || inventoryError) {
            toast.error("Stock information is still loading or unavailable.");
            return;
        }
        if (inventoryStock <= 0) {
            toast.error("This item is out of stock.");
            return;
        }
        if (quantity <= 0) {
             toast.error("Please select a valid quantity (at least 1).");
             return;
        }
        // Check if desired quantity exceeds available stock *again* right before adding
        if (quantity > inventoryStock) {
            toast.error(`Cannot add ${quantity}. Only ${inventoryStock} available.`);
            setQuantity(inventoryStock); // Optionally reset quantity to max available
            return;
        }

        // Set loading state for the button
        setIsAddingToCart(true);

        try {
            // ** Make the API call to the backend cart endpoint **
            // Ensure the endpoint ('/cart/') matches your FastAPI route
            const response = await axiosInstance.post('/cart/', {
                prod_id: product.id, // Send the actual product ID
                quantity: quantity,   // Send the currently selected quantity
            });

            // Backend should return 200 OK on success (as per our FastAPI code)
            if (response.status === 200 && response.data) {
                toast.success(`${response.data.quantity} x ${product.name} added/updated in cart!`);
                // Navigate to the cart page after successful addition
                navigate('/cart');
            } else {
                 // This case might occur if the backend returns 2xx but not 200, or unexpected data
                 console.warn("Add to cart response not as expected:", response);
                 toast.error("Item added, but received an unexpected response.");
                 navigate('/cart'); // Still navigate likely
            }

        } catch (error) {
            // The response interceptor in axiosInstance handles generic logging
            // Here, we handle specific feedback to the user for this action
            console.error("Error during Add to Cart API call:", error);
            // Extract the specific error message from the backend if available
            const backendErrorMessage = error.response?.data?.detail;
            toast.error(`Failed to add item: ${backendErrorMessage || "Please try again."}`);
            // If error was 401, the response interceptor might handle redirection
            // If it was 400 (e.g., stock changed between load and add), the backend message is shown
        } finally {
            // ** IMPORTANT: Reset the button loading state regardless of success/failure **
            setIsAddingToCart(false);
        }
    };


    // --- Helper Function to Render Stock Status Badge ---
    const renderStockStatusBadge = () => {
        if (loadingInventory) {
            return <Badge variant="outline" className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Checking...</Badge>;
        }
        // Show specific error only if stock isn't determined as 0 due to 404
        if (inventoryError && inventoryStock !== 0) {
            return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Error Loading Stock</Badge>;
        }
        // If stock is null after loading and not 0 (meaning a non-404 error happened)
        if (inventoryStock === null) {
             return <Badge variant="secondary" className="flex items-center gap-1"><Info className="h-3 w-3" /> Status Unknown</Badge>;
        }
        // We have a valid number (including 0)
        if (inventoryStock > 10) {
            return <Badge variant="success" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> In Stock</Badge>;
        }
        if (inventoryStock > 0) { // Covers 1 to 10
            return <Badge variant="warning" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Low Stock ({inventoryStock} left)</Badge>;
        }
         // inventoryStock is 0
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Out of Stock</Badge>;
    };


    // --- Render Loading State ---
    if (loadingProduct) {
       return (
         <div className="container mx-auto px-4 py-16 flex justify-center items-center min-h-[60vh]">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
         </div>
       );
    }

    // --- Render Product Not Found or Critical Error State ---
    if (!loadingProduct && !product) { // Check if loading finished but product is still null
       return (
         <div className="container mx-auto px-4 py-16 text-center min-h-[60vh] flex flex-col justify-center items-center">
           <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
           <h2 className="text-3xl font-bold mb-4 text-gray-800 dark:text-gray-200">Product Not Found</h2>
           <p className="mb-8 text-gray-600 dark:text-gray-400">{productError || "The requested product could not be loaded or does not exist."}</p>
           <Button
             className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black cursor-pointer"
             onClick={() => navigate('/shop')}
           >
             <ArrowLeft className="mr-2 h-4 w-4" />
             Return to Shop
           </Button>
         </div>
       );
    }

    // --- Prepare Variables for the Main Render ---
    // Determine if Add to Cart button should be disabled
    const isAddToCartDisabled =
        isAddingToCart ||          // Disable while API call is in progress
        loadingInventory ||        // Disable while stock is loading
        inventoryStock === null || // Disable if stock couldn't be determined (error)
        inventoryStock <= 0 ||     // Disable if out of stock
        !!inventoryError;          // Disable if there was an inventory loading error (and stock isn't 0)

    // Determine the dynamic text for the Add to Cart button
    let addToCartButtonContent;
    if (isAddingToCart) {
        addToCartButtonContent = <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</>;
    } else if (loadingInventory) {
        addToCartButtonContent = 'Checking Stock...';
    } else if (inventoryStock === null || (inventoryError && inventoryStock !== 0) ) {
         addToCartButtonContent = 'Stock Unavailable';
    } else if (inventoryStock <= 0) {
        addToCartButtonContent = 'Out of Stock';
    } else {
        // Calculate total price for display on button (optional but nice)
        const totalPrice = (product.price * quantity).toFixed(2);
        addToCartButtonContent = <> <ShoppingCart className="mr-2 h-4 w-4" /> Add {quantity} to Cart - ${totalPrice} </>;
    }


    // --- Main Product Details JSX ---
    return (
      <div className="bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 py-8">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <div className="mb-6">
             <Button
              variant="ghost"
              className="flex items-center text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white p-0 h-auto cursor-pointer"
              onClick={() => navigate(-1)} // Go back to previous page
              aria-label="Go back"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
          </div>

          {/* Product Details Layout */}
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            {/* Product Image Column */}
            <div className="lg:w-1/2">
               <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md border border-gray-200 dark:border-gray-700 sticky top-24">
                <img
                  // Use product?.image_url for safety in case product load fails partially
                  src={product?.image_url || 'https://via.placeholder.com/600x600.png?text=No+Image'}
                  alt={product?.name || 'Product Image'}
                  className="w-full h-auto object-contain max-h-[500px]"
                  loading="lazy" // Use lazy loading for images
                />
              </div>
            </div>

            {/* Product Information Column */}
            <div className="lg:w-1/2">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                 {/* Header: Category, Name, Wishlist/Share */}
                <div className="mb-4">
                   <div className="flex justify-between items-start gap-4">
                    <div>
                      {product?.category && (
                        <Badge variant="secondary" className="mb-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600">
                           {/* Handle if category is object or string */}
                           {typeof product.category === 'object' ? product.category.name : product.category}
                        </Badge>
                      )}
                      <h1 className="text-2xl lg:text-3xl font-bold">{product?.name || 'Product Name Unavailable'}</h1>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button variant="outline" size="icon" aria-label="Add to wishlist" className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"><Heart className="h-5 w-5" /></Button>
                      <Button variant="outline" size="icon" aria-label="Share product" className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"><Share2 className="h-5 w-5" /></Button>
                    </div>
                  </div>
                   {/* Rating Placeholder */}
                  <div className="flex items-center mt-2">
                     <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (<Star key={star} className={`h-4 w-4 ${star <= 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}/>))}
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">(Reviews Placeholder)</span>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-6">
                    <span className="text-3xl font-bold text-black dark:text-white">
                        {product?.price ? `$${product.price.toFixed(2)}` : 'Price Unavailable'}
                    </span>
                </div>

                {/* Stock Status */}
                <div className="mb-6 flex items-center gap-2">
                    <Box className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Availability:</span>
                    {renderStockStatusBadge()} {/* Render the dynamic badge */}
                </div>

                {/* Quantity Selector */}
                <div className="mb-6">
                   <p className="font-medium mb-2 text-sm">Quantity</p>
                  <div className="flex items-center">
                    <Button variant="outline" size="icon" onClick={() => handleQuantityChange('decrease')} disabled={quantity <= 1 || isAddingToCart} aria-label="Decrease quantity" className="border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"><MinusCircle className="h-5 w-5" /></Button>
                    <span className="mx-4 w-10 text-center font-medium text-lg">{quantity}</span>
                    <Button variant="outline" size="icon" onClick={() => handleQuantityChange('increase')} aria-label="Increase quantity" className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                       // Disable increase if adding to cart, loading stock, or quantity meets/exceeds stock
                       disabled={isAddingToCart || loadingInventory || (typeof inventoryStock === 'number' && quantity >= inventoryStock)}>
                      <PlusCircle className="h-5 w-5" />
                    </Button>
                  </div>
                   {/* Informational messages based on stock and quantity */}
                  {!loadingInventory && typeof inventoryStock === 'number' && inventoryStock > 0 && inventoryStock <= 10 && (
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">Only {inventoryStock} left in stock!</p>
                  )}
                  {!loadingInventory && typeof inventoryStock === 'number' && quantity > inventoryStock && inventoryStock > 0 && (
                     <p className="text-xs text-red-600 dark:text-red-400 mt-2">Cannot add {quantity}. Only {inventoryStock} available.</p>
                  )}
                </div>

                {/* Add to Cart Button */}
                <div className="mb-6">
                  <Button
                     className="w-full bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center text-base font-medium" // Added font style
                     size="lg"
                     onClick={handleAddToCart}
                     disabled={isAddToCartDisabled} // Use the calculated disabled state
                   >
                    {addToCartButtonContent} {/* Display dynamic button content */}
                  </Button>
                </div>

                {/* Shipping & Returns Info */}
                <div className="mb-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center"><Truck className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400 flex-shrink-0" /><span>Free shipping over $50</span></div>
                    <div className="flex items-center"><ShieldCheck className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400 flex-shrink-0" /><span>Secure payments</span></div>
                    <div className="flex items-center"><RefreshCw className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400 flex-shrink-0" /><span>30-day returns</span></div>
                  </div>
                </div>

                {/* Short Description Preview */}
                <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p>{product?.description ? `${product.description.substring(0, 150)}${product.description.length > 150 ? '...' : ''}` : 'No description available.'}</p>
                </div>

              </div> {/* End product info inner div */}
            </div> {/* End product info column */}
          </div> {/* End flex row */}

          {/* Product Tabs (Description, Specs, Features) */}
          <div className="mt-10 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
             <div className="border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap -mb-px px-4"> {/* Added padding */}
                <button className={`px-4 py-3 font-medium text-sm focus:outline-none transition-colors duration-200 cursor-pointer ${ activeTab === "description" ? "border-b-2 border-black dark:border-white text-black dark:text-white" : "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white border-b-2 border-transparent" }`} onClick={() => setActiveTab("description")}> Description </button>
                <button className={`px-4 py-3 font-medium text-sm focus:outline-none transition-colors duration-200 cursor-pointer ${ activeTab === "specs" ? "border-b-2 border-black dark:border-white text-black dark:text-white" : "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white border-b-2 border-transparent" }`} onClick={() => setActiveTab("specs")}> Specifications </button>
                <button className={`px-4 py-3 font-medium text-sm focus:outline-none transition-colors duration-200 cursor-pointer ${ activeTab === "features" ? "border-b-2 border-black dark:border-white text-black dark:text-white" : "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white border-b-2 border-transparent" }`} onClick={() => setActiveTab("features")}> Features </button>
              </div>
            </div>
            <div className="p-6 prose prose-sm dark:prose-invert max-w-none">
              {/* Tab Content */}
              {activeTab === "description" && (<div><h3 className="text-lg font-semibold mb-4 not-prose">Product Description</h3><p className="whitespace-pre-wrap">{product?.description || 'No description available.'}</p></div>)}
              {activeTab === "specs" && (<div><h3 className="text-lg font-semibold mb-4 not-prose">Technical Specifications</h3>{product?.specifications ? (<div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">{product.specifications.split('\n').map((line, index) => {const parts = line.split(':'); const key = parts[0]?.trim(); const value = parts.slice(1).join(':')?.trim(); if (!key || !value) return null; return (<div key={index} className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2 text-sm"><span className="font-medium text-gray-700 dark:text-gray-300">{key}</span><span className="text-gray-600 dark:text-gray-400">{value}</span></div>);})}</div>) : (<p>No specifications available.</p>)}</div>)}
              {activeTab === "features" && (<div><h3 className="text-lg font-semibold mb-4 not-prose">Key Features</h3>{product?.features ? (<ul className="list-disc pl-5 space-y-2 text-sm">{product.features.split('\n').map((feature, index) => feature.trim() && <li key={index} className="text-gray-700 dark:text-gray-300">{feature.trim()}</li>)}</ul>) : (<p>No features listed.</p>)}</div>)}
            </div>
          </div> {/* End Product Tabs */}

        </div> {/* End Container */}
      </div> /* End Outer Page Div */
    );
};

export default ProductDetails;