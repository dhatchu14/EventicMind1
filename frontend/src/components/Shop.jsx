import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, LogIn, X } from "lucide-react"; // Added X icon for badge close


// Image imports (ensure paths are correct)
import cameraImg from '../assets/images/product_9.png';
import smartwatchImg from '../assets/images/smartwatch (2).jpg';
import earbudsImg from '../assets/images/earbuds.jpg';
import powerbankImg from '../assets/images/powerbank.jpg';
import smarthomehubImg from '../assets/images/smarthomehub.jpg';
import ultrabookImg from '../assets/images/ultrabook.jpg';
import gaminglaptopImg from '../assets/images/gaminglaptop.jpg';
import businesslaptopImg from '../assets/images/businesslaptop.jpg';
import convertibleImg from '../assets/images/convertible.jpg';
import premiumPhoneImg from '../assets/images/premiumsmartphone.jpg';
import budgetPhoneImg from '../assets/images/budgetsmartphone.jpg';
import foldablePhoneImg from '../assets/images/foldablesmartphone.jpg';
import cameraphoneImg from '../assets/images/cameraphone.jpg';
import keyboardImg from '../assets/images/keyboard.jpg';
import mouseImg from '../assets/images/mouse.jpg';
import headsetImg from '../assets/images/headset.jpg';
import controllerImg from '../assets/images/controller.jpg';


const Shop = () => {
  const navigate = useNavigate();
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('relevant');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);


  useEffect(() => {
    const loggedInUser = localStorage.getItem('currentUser');
    if (loggedInUser) {
      setIsLoggedIn(true);
      setCurrentUser(JSON.parse(loggedInUser));
    }
  }, []);


  const products = [
    // (Product data remains the same - no color classes here)
    // Headphones
    { id: 1, name: 'Bluetooth Headset Pro', category: 'Headphones', price: 149.99, description: 'Experience superior sound quality...', image: 'https://storage.googleapis.com/a1aa/image/bwVNjdtCmZkbSDYez4gmB-7_FKdkFxP_0nI2IGfcsPM.jpg' },
    { id: 2, name: 'Noise Cancelling Headphones', category: 'Headphones', price: 199.99, description: 'A premium wireless headset...', image: 'https://storage.googleapis.com/a1aa/image/qxPThRywqZaKMkzeSZGUZ358BZnfQACthbpNzKTgZ2M.jpg' },
    { id: 3, name: 'Over-Ear Wireless Headphones', category: 'Headphones', price: 129.99, description: 'Comfortable over-ear headphones...', image: 'https://storage.googleapis.com/a1aa/image/Uweq9-3xJSEuQiZ5OhExyCIKcSpHVnCyI16rfVeYdUc.jpg' },
    { id: 4, name: 'Sports Bluetooth Headphones', category: 'Headphones', price: 79.99, description: 'Water-resistant Bluetooth headphones...', image: 'https://storage.googleapis.com/a1aa/image/gq9OGAPeXljm0zinxaIK2d8-gNRGRhvHBRR639zeEo4.jpg' },
    // Cameras
    { id: 5, name: 'Digital Camera Pro', category: 'Cameras', price: 699.99, description: 'Capture stunning photos...', image: 'https://storage.googleapis.com/a1aa/image/RxShr3akR5ULLWM2kfaqp3dxst3beOmh92zzV3kjEtM.jpg' },
    { id: 6, name: '4K DSLR Camera', category: 'Cameras', price: 1299.99, description: 'A 4K resolution DSLR camera...', image: 'https://storage.googleapis.com/a1aa/image/wjkhy9Shj8mY-djQZ9GWrzfchnVMtPl_VNQ6TPGcxHM.jpg' },
    { id: 7, name: 'Compact Digital Camera', category: 'Cameras', price: 349.99, description: 'Compact and lightweight camera...', image: 'https://storage.googleapis.com/a1aa/image/wPGAov6HZTlzTJBF7WdZUp-eFjEJ4e23DqgxPyBB42E.jpg' },
    { id: 8, name: 'Mirrorless Camera', category: 'Cameras', price: 899.99, description: 'Professional-grade mirrorless camera...', image: cameraImg },
    // Gadgets
    { id: 9, name: 'Smart Watch Ultra', category: 'Gadgets', price: 299.99, description: 'Track your fitness and stay connected...', image: smartwatchImg },
    { id: 10, name: 'Wireless Earbuds', category: 'Gadgets', price: 129.99, description: 'True wireless earbuds with ANC...', image: earbudsImg },
    { id: 11, name: 'Portable Power Bank', category: 'Gadgets', price: 49.99, description: '20,000mAh fast-charging power bank...', image: powerbankImg },
    { id: 12, name: 'Smart Home Hub', category: 'Gadgets', price: 149.99, description: 'Control all your smart home devices...', image: smarthomehubImg },
    // Laptops
    { id: 13, name: 'Ultrabook Pro', category: 'Laptops', price: 1299.99, description: 'Ultra-thin and lightweight laptop...', image: ultrabookImg },
    { id: 14, name: 'Gaming Laptop Elite', category: 'Laptops', price: 1799.99, description: 'High-performance gaming laptop...', image: gaminglaptopImg },
    { id: 15, name: 'Business Laptop', category: 'Laptops', price: 999.99, description: 'Reliable and secure laptop...', image: businesslaptopImg },
    { id: 16, name: 'Convertible Touchscreen Laptop', category: 'Laptops', price: 1099.99, description: '2-in-1 laptop with touchscreen...', image: convertibleImg },
    // Smartphones
    { id: 17, name: 'Premium Smartphone', category: 'Smartphones', price: 999.99, description: 'Flagship smartphone with cutting-edge camera...', image: premiumPhoneImg },
    { id: 18, name: 'Budget Smartphone Plus', category: 'Smartphones', price: 349.99, description: 'Feature-rich smartphone at affordable price...', image: budgetPhoneImg },
    { id: 19, name: 'Foldable Smartphone', category: 'Smartphones', price: 1499.99, description: 'Innovative foldable display...', image: foldablePhoneImg },
    { id: 20, name: 'Camera-focused Smartphone', category: 'Smartphones', price: 899.99, description: 'Smartphone with pro-grade camera...', image: cameraphoneImg },
    // Gaming Gears
    { id: 21, name: 'Mechanical Gaming Keyboard', category: 'Gaming Gears', price: 129.99, description: 'Responsive mechanical keyboard...', image: keyboardImg },
    { id: 22, name: 'Gaming Mouse Pro', category: 'Gaming Gears', price: 79.99, description: 'High-precision gaming mouse...', image: mouseImg },
    { id: 23, name: 'Gaming Headset Surround', category: 'Gaming Gears', price: 149.99, description: '7.1 surround sound headset...', image: headsetImg },
    { id: 24, name: 'Gaming Controller Elite', category: 'Gaming Gears', price: 89.99, description: 'Premium controller with customization...', image: controllerImg }
  ];




  const categories = [...new Set(products.map(product => product.category))];


  const handleCategoryChange = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };


  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(product.category);
    return matchesSearch && matchesCategory;
  });


  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return 0;
  });


  const goToProductDetails = (productId) => {
    if (isLoggedIn) {
      navigate(`/product/${productId}`);
    } else {
      localStorage.setItem('intendedProductView', productId.toString());
      navigate('/login', { state: { fromShop: true } });
    }
  };


  const handleLoginClick = (e) => {
    e.stopPropagation();
    navigate('/login', { state: { fromShop: true } });
  };


  return (
    // Changed background colors
    <div className="bg-gray-100 dark:bg-black min-h-screen text-gray-900 dark:text-gray-100">
      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6 lg:gap-8">
          {/* Sidebar */}
          <aside className="w-full md:w-1/4 lg:w-1/5">
            {/* Changed sidebar background and border */}
            <Card className="sticky top-24 bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-700">
              {/* Changed header border */}
              <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700">
                <CardTitle className="text-lg font-semibold">Filters</CardTitle>
                <div className="relative mt-2">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                   {/* Changed input background, border, focus ring */}
                  <Input
                    className="pl-8 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-black dark:focus:ring-gray-500 focus:border-black dark:focus:border-gray-500"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <h3 className="font-semibold text-base mb-3">Categories</h3>
                <div className="space-y-2">
                  {categories.map(category => (
                    <div key={category} className="flex items-center space-x-2">
                       {/* Changed checkbox checked state colors */}
                      <Checkbox
                        id={`category-${category}`}
                        checked={selectedCategories.includes(category)}
                        onCheckedChange={() => handleCategoryChange(category)}
                        className="data-[state=checked]:bg-black dark:data-[state=checked]:bg-gray-300 data-[state=checked]:text-white dark:data-[state=checked]:text-black data-[state=checked]:border-black dark:data-[state=checked]:border-gray-400 border-gray-400 dark:border-gray-600 focus:ring-black dark:focus:ring-gray-500"
                      />
                      <label
                        htmlFor={`category-${category}`}
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none"
                      >
                        {category}
                      </label>
                    </div>
                  ))}
                </div>


                {/* Selected Categories Display */}
                {selectedCategories.length > 0 && (
                   // Changed border color
                  <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-base mb-2">Selected:</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedCategories.map(category => (
                         // Changed Badge colors
                        <Badge key={category} variant="secondary" className="flex items-center gap-1 pl-2 pr-1 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600">
                          <span className="text-xs">{category}</span>
                          {/* Changed remove button hover, focus */}
                          <button
                            className="ml-1 p-0.5 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-gray-500 cursor-pointer"
                            onClick={() => handleCategoryChange(category)}
                            aria-label={`Remove ${category} filter`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    {/* Changed clear all button colors */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mt-3 text-xs text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white p-0 h-auto cursor-pointer"
                        onClick={() => setSelectedCategories([])}
                    >
                        Clear all filters
                    </Button>
                  </div>
                )}
              </CardContent>
               {/* Changed footer border */}
              <CardFooter className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="w-full">
                  <h3 className="font-semibold text-base mb-2">Sort By</h3>
                  <Select value={sortBy} onValueChange={setSortBy}>
                     {/* Changed Select Trigger background/border */}
                    <SelectTrigger className="w-full bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-black dark:focus:ring-gray-500 focus:border-black dark:focus:border-gray-500 cursor-pointer">
                      <SelectValue placeholder="Relevant" />
                    </SelectTrigger>
                     {/* Changed Select Content background */}
                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                      <SelectItem value="relevant" className="cursor-pointer focus:bg-gray-100 dark:focus:bg-gray-700">Relevant</SelectItem>
                      <SelectItem value="price-low" className="cursor-pointer focus:bg-gray-100 dark:focus:bg-gray-700">Price: Low to High</SelectItem>
                      <SelectItem value="price-high" className="cursor-pointer focus:bg-gray-100 dark:focus:bg-gray-700">Price: High to Low</SelectItem>
                      <SelectItem value="name" className="cursor-pointer focus:bg-gray-100 dark:focus:bg-gray-700">Name (A-Z)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardFooter>
            </Card>
          </aside>


          {/* Product grid */}
          <section className="w-full md:w-3/4 lg:w-4/5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedProducts.map(product => (
                 // Changed card background, border, hover shadow
                <Card key={product.id} className="overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg dark:hover:shadow-gray-900/40 transition-shadow duration-300 bg-white dark:bg-gray-800 flex flex-col">
                  <div
                    // Changed image container background
                    className="h-48 overflow-hidden bg-gray-100 dark:bg-gray-700 relative group cursor-pointer"
                    onClick={() => goToProductDetails(product.id)}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover transition-all duration-300 ease-in-out group-hover:scale-105"
                      loading="lazy"
                    />


                    {/* Overlay with Login Button */}
                    {!isLoggedIn && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm">
                         {/* Changed Login Button colors */}
                        <Button
                          className="rounded-full px-6 bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 dark:text-black text-white cursor-pointer"
                          onClick={handleLoginClick}
                        >
                          <LogIn className="h-4 w-4 mr-2" />
                          Login to View
                        </Button>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4 flex-grow">
                    <div className="flex items-center justify-between mb-2">
                       {/* Changed category badge colors */}
                      <Badge variant="outline" className="font-medium text-xs border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700">
                        {product.category}
                      </Badge>
                       {/* Changed price color */}
                      <span className="font-bold text-lg text-black dark:text-white">${product.price.toFixed(2)}</span>
                    </div>
                    <h3 className="font-semibold text-base truncate mb-1">{product.name}</h3>
                    {/* Changed description text color */}
                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 h-10">{product.description}</p>
                  </CardContent>
                  <CardFooter className="pt-0 pb-4 px-4">
                     {/* Changed View Details Button colors */}
                    <Button
                      className="w-full group bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black cursor-pointer"
                      onClick={() => goToProductDetails(product.id)}
                      aria-label={`View details for ${product.name}`}
                    >
                      <Eye className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:scale-110" />
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>


            {/* Empty state */}
            {sortedProducts.length === 0 && (
               // Changed empty state background, border, text colors
              <div className="text-center py-16 px-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 col-span-full">
                <Search className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">No products found</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Try adjusting your search or filter criteria.</p>
                 {/* Changed Clear Filters Button colors */}
                <Button
                  variant="outline"
                  className="mt-6 border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategories([]);
                    setSortBy('relevant');
                  }}
                >
                  Clear Filters & Search
                </Button>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};


export default Shop;