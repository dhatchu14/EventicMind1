// src/components/Shop.jsx (or adjust path)

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, LogIn, X, Loader2, ShoppingCart, AlertTriangle } from "lucide-react";
import axiosInstance from '../api/axiosInstance'; // Assuming path is correct relative to Shop.jsx

const Shop = () => {
  const navigate = useNavigate();
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('relevant');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // Removed currentUser state as it wasn't directly used for auth after the update
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check login status based on accessToken
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    setIsLoggedIn(!!token);
  }, []);

  // Fetch products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axiosInstance.get('/products/?limit=100'); // Ensure this endpoint is correct
        setProducts(response.data || []); // Ensure response.data is an array
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setError(err.response?.data?.detail || "Could not load products. Please try again later.");
        setProducts([]); // Set to empty array on error
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // --- Filtering & Sorting Logic ---
  // Ensure this logic is placed *before* the return statement

  const categories = products.length > 0
    ? [...new Set(products.map(product => product.category).filter(Boolean))].sort()
    : [];

  const handleCategoryChange = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // --- MOVE THIS BLOCK HERE ---
  const filteredProducts = products.filter(product => {
    const query = searchQuery.toLowerCase();
    // Add null/undefined checks for safety
    const nameMatch = product.name?.toLowerCase().includes(query) ?? false;
    const descMatch = product.description?.toLowerCase().includes(query) ?? false;
    const categoryMatch = product.category?.toLowerCase().includes(query) ?? false;
    const matchesSearch = nameMatch || descMatch || categoryMatch;

    const matchesCategory = selectedCategories.length === 0 || (product.category && selectedCategories.includes(product.category));
    return matchesSearch && matchesCategory;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    // Add nullish coalescing for safety
    const priceA = a.price ?? 0;
    const priceB = b.price ?? 0;
    const nameA = a.name ?? '';
    const nameB = b.name ?? '';

    if (sortBy === 'price-low') return priceA - priceB;
    if (sortBy === 'price-high') return priceB - priceA;
    if (sortBy === 'name') return nameA.localeCompare(nameB);
    return 0; // 'relevant' - uses filtered order
  });
  // --- END OF MOVED BLOCK ---

  // --- Navigation & Actions ---
  const goToProductDetails = (productId) => {
    // Navigate directly. ProtectedRoute in App.jsx handles auth.
    navigate(`/product/${productId}`);
  };

  const handleLoginClick = (e) => {
    e.stopPropagation();
    const currentProductPath = e.currentTarget.dataset.productId ? `/product/${e.currentTarget.dataset.productId}` : '/shop';
    navigate('/login', { state: { from: { pathname: currentProductPath } } });
  };

  const clearFilters = () => {
      setSearchQuery('');
      setSelectedCategories([]);
      setSortBy('relevant');
  };

  // --- RENDER ---
  return (
    <div className="bg-gray-100 dark:bg-black min-h-screen text-gray-900 dark:text-gray-100">
      <main className="container mx-auto px-4 py-6 lg:py-10">
        {/* Shop Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight flex items-center justify-center gap-2">
             <ShoppingCart className="h-7 w-7 text-primary" /> Browse Our Products
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">Find the best tech gadgets and accessories.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-6 lg:gap-8">
          {/* --- Sidebar Filters --- */}
          <aside className="w-full md:w-1/4 lg:w-1/5">
             <Card className="sticky top-24 bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700">
                <CardTitle className="text-lg font-semibold">Filters</CardTitle>
                {/* Search Input */}
                <div className="relative mt-2">
                   <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                   <Input
                     className="pl-8 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-primary dark:focus:ring-primary focus:border-primary dark:focus:border-primary"
                     placeholder="Search products..."
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                   />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                 <h3 className="font-semibold text-base mb-3">Categories</h3>
                 {/* Categories Checkboxes */}
                 {loading && !categories.length ? (
                   <p className="text-sm text-muted-foreground">Loading categories...</p>
                 ) : categories.length > 0 ? (
                   <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                     {categories.map(category => (
                       <div key={category} className="flex items-center space-x-2">
                         <Checkbox
                           id={`category-${category}`}
                           checked={selectedCategories.includes(category)}
                           onCheckedChange={() => handleCategoryChange(category)}
                           className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-gray-400 dark:border-gray-600 focus:ring-primary"
                         />
                         <label htmlFor={`category-${category}`} className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none">
                           {category}
                         </label>
                       </div>
                     ))}
                   </div>
                 ) : (
                   !loading && <p className="text-sm text-muted-foreground italic">No categories found.</p>
                 )}
                 {/* Selected Categories Badges */}
                 {selectedCategories.length > 0 && (
                   <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
                     <h3 className="font-semibold text-base mb-2">Selected:</h3>
                     <div className="flex flex-wrap gap-1">
                       {selectedCategories.map(category => (
                         <Badge key={category} variant="secondary" className="flex items-center gap-1 pl-2 pr-1 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 text-xs">
                           <span>{category}</span>
                           <button
                             className="ml-0.5 p-0.5 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-1 focus:ring-primary"
                             onClick={() => handleCategoryChange(category)} aria-label={`Remove ${category} filter`} >
                             <X className="h-3 w-3" />
                           </button>
                         </Badge>
                       ))}
                     </div>
                     <Button variant="ghost" size="sm" className="mt-3 text-xs text-muted-foreground hover:text-primary p-0 h-auto" onClick={() => setSelectedCategories([])}>
                         Clear selected categories
                     </Button>
                   </div>
                 )}
              </CardContent>
              <CardFooter className="pt-4 border-t border-gray-200 dark:border-gray-700 flex-col items-start gap-4">
                 {/* Sort By Select */}
                 <div>
                    <h3 className="font-semibold text-base mb-2">Sort By</h3>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-full bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-primary dark:focus:ring-primary focus:border-primary dark:focus:border-primary">
                        <SelectValue placeholder="Relevant" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                        <SelectItem value="relevant">Relevant</SelectItem>
                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                        <SelectItem value="name">Name (A-Z)</SelectItem>
                      </SelectContent>
                    </Select>
                 </div>
                 {/* Clear All Filters Button */}
                 {(searchQuery || selectedCategories.length > 0 || sortBy !== 'relevant') && ( // Show clear if sort is also not default
                    <Button variant="outline" size="sm" className="w-full mt-2 hover:border-primary hover:text-primary" onClick={clearFilters}>
                        Clear Filters & Sort
                    </Button>
                 )}
              </CardFooter>
            </Card>
          </aside>

          {/* --- Product Grid --- */}
          {/* Now sortedProducts should be defined here */}
          <section className="w-full md:w-3/4 lg:w-4/5">
            {loading && (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3 text-lg text-muted-foreground">Loading Products...</p>
              </div>
            )}
            {error && !loading && (
               <div className="text-center py-16 px-6 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-300 dark:border-red-700">
                <AlertTriangle className="h-12 w-12 mx-auto text-red-500 dark:text-red-400 mb-4" />
                <h3 className="text-xl font-semibold text-red-800 dark:text-red-200">Error Loading Products</h3>
                <p className="text-sm text-red-600 dark:text-red-300 mt-2">{error}</p>
                 <Button variant="destructive" size="sm" onClick={() => window.location.reload()} className="mt-4">Reload Page</Button>
              </div>
            )}
            {!loading && !error && (
              <>
                {/* Line 75 or near it is likely this conditional check or the map below */}
                {sortedProducts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 lg:gap-6">
                    {/* Map over sortedProducts */}
                    {sortedProducts.map(product => (
                      <Card key={product.id} className="overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg dark:hover:shadow-primary/10 transition-shadow duration-300 bg-white dark:bg-gray-800 flex flex-col group">
                        <div
                          className="h-52 overflow-hidden bg-gray-100 dark:bg-gray-700 relative cursor-pointer"
                          onClick={() => goToProductDetails(product.id)}
                        >
                          <img
                            src={product.image_url || 'https://via.placeholder.com/300x220?text=No+Image'}
                            alt={product.name || 'Product Image'}
                            className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
                            loading="lazy"
                            onError={(e) => { e.target.onerror = null; e.target.src='https://via.placeholder.com/300x220?text=Load+Error'; }}
                          />
                           {/* Show overlay ONLY if user is NOT logged in */}
                          {!isLoggedIn && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm pointer-events-none group-hover:pointer-events-auto">
                              <Button
                                  className="rounded-full px-6 bg-primary hover:bg-primary/90 text-primary-foreground pointer-events-auto"
                                  data-product-id={product.id} // Pass product id if needed by handler
                                  onClick={handleLoginClick}
                                  aria-label="Login to view product details"
                              >
                                <LogIn className="h-4 w-4 mr-2" /> Login to View
                              </Button>
                            </div>
                          )}
                        </div>
                        <CardContent className="p-4 flex-grow">
                          <div className="flex items-start justify-between mb-2 gap-2">
                             {product.category && (
                               <Badge variant="outline" className="text-xs border-gray-300 dark:border-gray-600 text-muted-foreground bg-gray-50 dark:bg-gray-700/50 shrink-0" title={product.category}>
                                {product.category}
                               </Badge>
                             )}
                             {/* Ensure price exists and is a number */}
                             <span className="font-bold text-xl text-gray-900 dark:text-white ml-auto">${(typeof product.price === 'number' ? product.price : 0).toFixed(2)}</span>
                          </div>
                          <h3 className="font-semibold text-lg truncate mb-1 group-hover:text-primary" title={product.name}>{product.name || 'Unnamed Product'}</h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 h-[60px]" title={product.description || ''}>{product.description || 'No description available.'}</p>
                        </CardContent>
                        <CardFooter className="pt-0 pb-4 px-4">
                          <Button
                            className="w-full group/button bg-primary hover:bg-primary/90 text-primary-foreground"
                            onClick={() => goToProductDetails(product.id)}
                            aria-label={`View details for ${product.name || 'product'}`}
                           >
                            <Eye className="h-4 w-4 mr-2 transition-transform duration-200 group-hover/button:scale-110" />
                            View Details
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  // Empty state when filters/search match nothing
                  <div className="text-center py-16 px-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 col-span-full">
                    <Search className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">No products match your criteria</h3>
                    <p className="text-sm text-muted-foreground mt-2">Try adjusting your search or filters.</p>
                    <Button variant="outline" className="mt-6 hover:border-primary hover:text-primary" onClick={clearFilters}>
                      Clear Filters & Search
                    </Button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Shop;