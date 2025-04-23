import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from '@/components/CartContext'; // Import the cart hook
import { toast } from 'sonner'; // For showing errors
import axiosInstance from '../api/axiosInstance'; // Your configured axios instance

import {
    Star, Truck, ShieldCheck, RefreshCw, Heart, Share2, ArrowLeft,
    MinusCircle, PlusCircle, Loader2, AlertTriangle, Info, Layers3,
    CheckCircle, XCircle, Box // Icons for stock status etc.
} from "lucide-react";

// Remove mock image imports if not needed as fallbacks
// import cameraImg from '../assets/images/product_9.png';
// import smartwatchImg from '../assets/images/smartwatch (2).jpg';

const ProductDetails = () => {
    const { id: productId } = useParams(); // Rename id to productId for clarity
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


    // Use the cart context
    const { addToCart } = useCart();

    // --- Fetch Product and Inventory Data from API ---
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
            setProduct(null); // Reset product state
            setInventoryStock(null); // Reset stock state

            try {
                // Use Promise.allSettled to fetch both even if one fails
                const results = await Promise.allSettled([
                    axiosInstance.get(`/products/${productId}`),
                    axiosInstance.get(`/inventory/${productId}`)
                ]);

                const productResult = results[0];
                const inventoryResult = results[1];

                // Handle Product Result
                if (productResult.status === 'fulfilled') {
                    setProduct(productResult.value.data);
                    console.log("Product data fetched:", productResult.value.data);
                } else {
                    console.error("Error fetching product details:", productResult.reason);
                    const errorMsg = productResult.reason.response?.data?.detail || 'Failed to load product details.';
                    setProductError(errorMsg);
                    toast.error(`Error loading product: ${errorMsg}`);
                }

                // Handle Inventory Result
                if (inventoryResult.status === 'fulfilled') {
                    setInventoryStock(inventoryResult.value.data.stock);
                    console.log("Inventory data fetched:", inventoryResult.value.data);
                } else {
                    console.error("Error fetching inventory details:", inventoryResult.reason);
                    if (inventoryResult.reason.response?.status === 404) {
                        // Product might exist, but no inventory record yet (service should handle this, but double-check)
                        // OR the product itself doesn't exist (productError will be set above)
                        console.warn(`Inventory record not found for product ID ${productId}. Setting stock to 0.`);
                        setInventoryStock(0); // Treat as out of stock
                    } else {
                        const errorMsg = inventoryResult.reason.response?.data?.detail || 'Failed to load stock information.';
                        setInventoryError(errorMsg);
                        setInventoryStock(null); // Indicate stock is unknown due to error
                        toast.error(`Error loading stock: ${errorMsg}`);
                    }
                }

            } catch (err) {
                // Catch any unexpected errors during the Promise.allSettled or setup
                console.error("Unexpected error fetching details:", err);
                const generalError = "An unexpected error occurred.";
                setProductError(productError || generalError); // Keep existing error if already set
                setInventoryError(inventoryError || generalError);
                toast.error(generalError);
            } finally {
                setLoadingProduct(false);
                setLoadingInventory(false);
            }
        };

        fetchDetails();
    }, [productId]); // Re-run effect if productId changes


    const handleQuantityChange = (action) => {
        if (action === 'increase') {
            // Optional: Check against stock if inventoryStock is a number
            if (typeof inventoryStock === 'number' && quantity >= inventoryStock) {
                 toast.warn(`Only ${inventoryStock} item(s) in stock.`);
                 return;
            }
            setQuantity(prev => prev + 1);
        } else if (action === 'decrease' && quantity > 1) {
            setQuantity(prev => prev - 1);
        }
    };

    // Handle adding product to cart
    const handleAddToCart = () => {
        if (product && typeof inventoryStock === 'number' && inventoryStock > 0) {
            if (quantity > inventoryStock) {
                 toast.error(`Cannot add ${quantity} items. Only ${inventoryStock} in stock.`);
                 setQuantity(inventoryStock); // Optionally reset quantity to max available
                 return;
            }
            addToCart(product, quantity); // Pass the fetched product object
            toast.success(`${quantity} x ${product.name} added to cart!`);
            // navigate('/cart'); // Optional: navigate to cart page
        } else {
            toast.error("Cannot add to cart. Product unavailable or stock issue.");
        }
    };

    // --- Helper to Render Stock Status ---
    const renderStockStatusBadge = () => {
        if (loadingInventory) {
            return <Badge variant="outline" className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Checking...</Badge>;
        }
        if (inventoryError) {
            return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Error Loading Stock</Badge>;
        }
        if (inventoryStock === null || typeof inventoryStock !== 'number') {
            return <Badge variant="secondary">Status Unknown</Badge>;
        }
        if (inventoryStock > 10) {
            return <Badge variant="success" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> In Stock ({inventoryStock})</Badge>;
        }
        if (inventoryStock > 0) {
            return <Badge variant="warning" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Low Stock ({inventoryStock})</Badge>;
        }
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Out of Stock</Badge>;
    };

    // --- Loading State UI ---
    if (loadingProduct) { // Base loading state on product fetch
      return (
        <div className="container mx-auto px-4 py-16 flex justify-center items-center min-h-[60vh]">
           <Loader2 className="h-10 w-10 animate-spin text-primary" />
           {/* You can use the more detailed skeleton loader from your original code here if preferred */}
        </div>
      );
    }

    // --- Product Not Found or Critical Error UI ---
    if (productError && !product) {
      return (
        <div className="container mx-auto px-4 py-16 text-center min-h-[60vh] flex flex-col justify-center items-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4 text-gray-800 dark:text-gray-200">Error Loading Product</h2>
          <p className="mb-8 text-gray-600 dark:text-gray-400">{productError}</p>
          <Button
            className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black cursor-pointer"
            onClick={() => navigate('/shop')} // Assuming '/shop' is your main product listing page
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to Shop
          </Button>
        </div>
      );
    }

     // If product is somehow null after loading and no error (edge case)
     if (!product) {
         return <div className="container mx-auto px-4 py-16 text-center">Product data unavailable.</div>;
     }

    // --- Main Product Details UI (Populated with API Data) ---
    const isAddToCartDisabled = loadingInventory || inventoryStock === null || inventoryStock <= 0 || !!inventoryError;
    const addToCartText = loadingInventory ? 'Checking Stock...' : (isAddToCartDisabled ? 'Unavailable' : `Add to Cart - $${(product.price * quantity).toFixed(2)}`);


    return (
      <div className="bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 py-8">
        <div className="container mx-auto px-4">
          {/* Breadcrumb and Back Button */}
          <div className="mb-6">
            <Button
              variant="ghost"
              className="flex items-center text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white p-0 h-auto cursor-pointer"
              onClick={() => navigate('/shop')} // Navigate back to shop list
              aria-label="Back to shop"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Shop
            </Button>
          </div>


          {/* Product Details Layout */}
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            {/* Product Image */}
            <div className="lg:w-1/2">
              <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md border border-gray-200 dark:border-gray-700 sticky top-24">
                <img
                  src={product.image_url || 'https://via.placeholder.com/600x600.png?text=No+Image'} // Use image_url from API
                  alt={product.name}
                  className="w-full h-auto object-contain max-h-[500px]"
                  loading="lazy"
                />
              </div>
            </div>


            {/* Product Information */}
            <div className="lg:w-1/2">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                {/* Product Header */}
                <div className="mb-4">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      {product.category && (
                        <Badge variant="secondary" className="mb-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600">{product.category}</Badge>
                      )}
                      <h1 className="text-2xl lg:text-3xl font-bold">{product.name}</h1>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button variant="outline" size="icon" aria-label="Add to wishlist" className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                        <Heart className="h-5 w-5" />
                      </Button>
                      <Button variant="outline" size="icon" aria-label="Share product" className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                        <Share2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Rating - Placeholder: Adapt if API provides rating/review data */}
                  <div className="flex items-center mt-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${star <= 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} // Static 4 stars for now
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                       {/* (e.g., product.reviewCount ? `${product.reviewCount} reviews` : 'No reviews yet') */}
                       (Reviews Placeholder)
                    </span>
                  </div>
                </div>


                {/* Price */}
                <div className="mb-6">
                  <span className="text-3xl font-bold text-black dark:text-white">${product.price.toFixed(2)}</span>
                  {/* Add originalPrice logic if API provides it */}
                </div>

                {/* --- Stock Status Display --- */}
                <div className="mb-6 flex items-center gap-2">
                    <Box className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Availability:</span>
                    {renderStockStatusBadge()}
                </div>


                {/* Quantity Selector */}
                <div className="mb-6">
                  <p className="font-medium mb-2 text-sm">Quantity</p>
                  <div className="flex items-center">
                    <Button
                      variant="outline" size="icon"
                      onClick={() => handleQuantityChange('decrease')}
                      disabled={quantity <= 1}
                      aria-label="Decrease quantity"
                      className="border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    > <MinusCircle className="h-5 w-5" /> </Button>
                    <span className="mx-4 w-10 text-center font-medium text-lg">{quantity}</span>
                    <Button
                      variant="outline" size="icon"
                      onClick={() => handleQuantityChange('increase')}
                      aria-label="Increase quantity"
                      className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                      disabled={loadingInventory || (typeof inventoryStock === 'number' && quantity >= inventoryStock)} // Disable if loading or at max stock
                    > <PlusCircle className="h-5 w-5" /> </Button>
                  </div>
                  {/* Show available stock if low */}
                  {!loadingInventory && typeof inventoryStock === 'number' && inventoryStock > 0 && inventoryStock <= 10 && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">Only {inventoryStock} left in stock!</p>
                  )}
                </div>


                {/* Add to Cart Button */}
                <div className="mb-6">
                  <Button
                    className="w-full bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    size="lg"
                    onClick={handleAddToCart}
                    disabled={isAddToCartDisabled}
                  >
                    {addToCartText}
                  </Button>
                </div>


                {/* Shipping & Returns (Static content) */}
                <div className="mb-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center"> <Truck className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400 flex-shrink-0" /> <span>Free shipping over $50</span> </div>
                    <div className="flex items-center"> <ShieldCheck className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400 flex-shrink-0" /> <span>Secure payments</span> </div>
                    <div className="flex items-center"> <RefreshCw className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400 flex-shrink-0" /> <span>30-day returns</span> </div>
                  </div>
                </div>


                {/* Product Description Preview */}
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {/* Show truncated description, full in tab */}
                  <p>{product.description ? `${product.description.substring(0, 150)}${product.description.length > 150 ? '...' : ''}` : 'No description available.'}</p>
                </div>
              </div>
            </div>
          </div>


          {/* Product Tabs */}
          <div className="mt-10 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap -mb-px">
                {/* Tab Buttons */}
                <button className={`px-4 py-3 font-medium text-sm focus:outline-none transition-colors duration-200 cursor-pointer ${ activeTab === "description" ? "border-b-2 border-black dark:border-white text-black dark:text-white" : "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white border-b-2 border-transparent" }`} onClick={() => setActiveTab("description")}> Description </button>
                <button className={`px-4 py-3 font-medium text-sm focus:outline-none transition-colors duration-200 cursor-pointer ${ activeTab === "specs" ? "border-b-2 border-black dark:border-white text-black dark:text-white" : "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white border-b-2 border-transparent" }`} onClick={() => setActiveTab("specs")}> Specifications </button>
                <button className={`px-4 py-3 font-medium text-sm focus:outline-none transition-colors duration-200 cursor-pointer ${ activeTab === "features" ? "border-b-2 border-black dark:border-white text-black dark:text-white" : "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white border-b-2 border-transparent" }`} onClick={() => setActiveTab("features")}> Features </button>
                {/* Add reviews tab if API provides review data */}
                {/* <button className={`px-4 py-3 font-medium text-sm ...`} onClick={() => setActiveTab("reviews")}> Reviews </button> */}
              </div>
            </div>

            <div className="p-6 prose prose-sm dark:prose-invert max-w-none">
              {/* Tab Content */}
              {activeTab === "description" && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 not-prose">Product Description</h3>
                  <p className="whitespace-pre-wrap">{product.description || 'No description available.'}</p>
                </div>
              )}

              {activeTab === "specs" && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 not-prose">Technical Specifications</h3>
                    {product.specifications ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                        {/* Attempt to parse specs if they are newline-separated key: value pairs */}
                        {product.specifications.split('\n').map((line, index) => {
                           const parts = line.split(':');
                           const key = parts[0]?.trim();
                           const value = parts.slice(1).join(':')?.trim();
                           if (!key || !value) return null; // Skip empty lines or lines without ':'
                           return (
                              <div key={index} className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2 text-sm">
                                 <span className="font-medium text-gray-700 dark:text-gray-300">{key}</span>
                                 <span className="text-gray-600 dark:text-gray-400">{value}</span>
                              </div>
                           );
                        })}
                      </div>
                    ) : (
                      <p>No specifications available.</p>
                    )}
                  </div>
              )}


              {activeTab === "features" && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 not-prose">Key Features</h3>
                  {product.features ? (
                    <ul className="list-disc pl-5 space-y-2 text-sm">
                      {product.features.split('\n').map((feature, index) => feature.trim() && <li key={index} className="text-gray-700 dark:text-gray-300">{feature.trim()}</li>)}
                    </ul>
                   ) : (
                     <p>No features listed.</p>
                   )}
                </div>
              )}

              {/* Add Reviews Tab Content if needed */}

            </div>
          </div>

          {/* Related Products Section - Removed as it relies on mock data */}
          {/* You would need a separate API endpoint like /products/{id}/related or /products?category={cat}&limit=5&exclude={id} */}

        </div>
      </div>
    );
};

export default ProductDetails;