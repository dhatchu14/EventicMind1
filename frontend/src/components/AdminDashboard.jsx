import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    TrendingUp, Users, ShoppingBag, DollarSign, PackagePlus, ListOrdered,
    View, Save, LayoutDashboard, BarChartHorizontal, UploadCloud, ListChecks,
    Boxes, Upload, Link as LinkIcon, Loader2, RefreshCw, ServerCrash, Eye
} from 'lucide-react'; // Keep icons

// Shadcn UI Components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// Recharts Components
import { Area, AreaChart, Bar, CartesianGrid, XAxis, Line, Radar, RadarChart, LabelList, YAxis, Rectangle, BarChart as RechartsBarChart, LineChart as RechartsLineChart, PolarAngleAxis, PolarGrid, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

import axiosInstance from '../api/axiosInstance'; // Your configured axios instance

const Dashboard = () => {
    // --- Existing State (User, Mock Orders/Stats, Form Inputs) ---
    const [displayUser, setDisplayUser] = useState(null);
    const [orders, setOrders] = useState([ { id: 1, customer: 'John Doe', amount: 459.99, status: 'Completed', timestamp: Date.now() - 600000 }, { id: 2, customer: 'Jane Smith', amount: 239.50, status: 'Processing', timestamp: Date.now() - 720000 }, { id: 3, customer: 'Robert Brown', amount: 179.99, status: 'Completed', timestamp: Date.now() - 840000 }, { id: 4, customer: 'Alice Johnson', amount: 329.75, status: 'Pending', timestamp: Date.now() - 960000 }, { id: 5, customer: 'David Wilson', amount: 569.25, status: 'Processing', timestamp: Date.now() - 1080000 }, ].sort((a, b) => b.timestamp - a.timestamp));
    const [stats, setStats] = useState({ revenue: 18420.69, orders: 243, customers: 45, growth: 12.5 });
    const [newProductName, setNewProductName] = useState('');
    const [newProductDescription, setNewProductDescription] = useState('');
    const [newProductPrice, setNewProductPrice] = useState('');
    const [newProductCategory, setNewProductCategory] = useState('');
    const [newProductSpecifications, setNewProductSpecifications] = useState('');
    const [newProductFeatures, setNewProductFeatures] = useState('');
    const [newProductImageFile, setNewProductImageFile] = useState(null);
    const [imageUploadMethod, setImageUploadMethod] = useState('file');
    const [newProductImageUrl, setNewProductImageUrl] = useState('');
    const LOW_STOCK_THRESHOLD = 10;
    const navigate = useNavigate();

    // --- State for API Data & Actions ---
    const [adminProducts, setAdminProducts] = useState([]); // Stores raw product data from API
    const [productLoading, setProductLoading] = useState(false);
    const [productError, setProductError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false); // For Add Product form

    // --- State for Inventory ---
    const [inventoryItems, setInventoryItems] = useState([]); // Stores combined Product + Inventory data for display
    const [inventoryLoading, setInventoryLoading] = useState(false);
    const [inventoryError, setInventoryError] = useState(null);
    const [updatingStockId, setUpdatingStockId] = useState(null); // Track which stock is being updated

    // --- Existing useEffect Hooks (Keep) ---
    useEffect(() => {
        const userString = localStorage.getItem('currentUser');
        if (userString) { try { const user = JSON.parse(userString); if (user && user.role === 'admin') { setDisplayUser(user); } } catch (e) { console.error("Error parsing user data", e); } }
    }, []);
    useEffect(() => {
        console.log("Establishing WebSocket simulation...");
        const orderInterval = setInterval(() => { const newOrder = { id: Math.floor(Math.random() * 9000) + 1000, customer: ['Alex Thompson', 'Maria Garcia', 'Samantha Lee', 'Michael Chen', 'Olivia Wilson'][Math.floor(Math.random() * 5)], amount: Math.floor(Math.random() * 500) + 100 + Math.random(), status: ['Pending', 'Processing', 'Completed'][Math.floor(Math.random() * 3)], timestamp: Date.now() }; setOrders(prevOrders => { const updatedOrders = [newOrder, ...prevOrders].slice(0, 10); if (typeof window !== 'undefined') { toast.info(`🚀 New order: #${newOrder.id} - ${formatCurrency(newOrder.amount)}`); } return updatedOrders; }); setStats(prevStats => ({ ...prevStats, revenue: prevStats.revenue + newOrder.amount, orders: prevStats.orders + 1, customers: Math.random() > 0.85 ? prevStats.customers + 1 : prevStats.customers, growth: parseFloat((prevStats.growth + (Math.random() * 0.4 - 0.2)).toFixed(1)) })); }, 20000 + Math.random() * 20000);
        const statInterval = setInterval(() => { setStats(prevStats => ({ ...prevStats, growth: parseFloat((prevStats.growth + (Math.random() * 0.2 - 0.1)).toFixed(1)) })); }, 8000);
        return () => { clearInterval(orderInterval); clearInterval(statInterval); console.log("WebSocket simulation stopped"); };
    }, []);


    // --- Combine Product & Inventory Fetching Logic ---
    const fetchProductsAndInventory = useCallback(async () => {
        setProductLoading(true);
        setInventoryLoading(true);
        setProductError(null);
        setInventoryError(null);
        setAdminProducts([]);
        setInventoryItems([]);

        try {
            // Fetch products (adjust limit as needed)
            const productResponse = await axiosInstance.get('/products/?limit=500');
            const fetchedProducts = productResponse.data || [];
            setAdminProducts(fetchedProducts);
            console.log("API products loaded:", fetchedProducts.length);

            if (fetchedProducts.length > 0) {
                // Fetch all inventory records
                const inventoryResponse = await axiosInstance.get('/inventory/?limit=500');
                const fetchedInventory = inventoryResponse.data || [];
                console.log("API inventory records loaded:", fetchedInventory.length);

                // Create a map for quick inventory lookup by prod_id
                const inventoryMap = new Map();
                fetchedInventory.forEach(item => {
                    inventoryMap.set(item.prod_id, item.stock);
                });

                // Combine product data with inventory data for the Inventory Tab display
                const combinedItems = fetchedProducts.map(product => ({
                    id: product.id, // Use product.id as the key
                    name: product.name,
                    stock: inventoryMap.has(product.id) ? inventoryMap.get(product.id) : 0, // Default to 0 if no inventory record
                }));
                setInventoryItems(combinedItems);
                toast.success(`Loaded ${fetchedProducts.length} products and their inventory.`);

            } else {
               console.log("No products found, skipping inventory combination.");
               toast.info("No products found in the system.");
            }

        } catch (err) {
            console.error("Failed to fetch products or inventory:", err);
            const errorMsg = err.response?.data?.detail || "Could not load data.";
            setProductError(errorMsg);
            setInventoryError(errorMsg);
            toast.error(`Error loading data: ${errorMsg}`);
        } finally {
            setProductLoading(false);
            setInventoryLoading(false);
        }
    }, []);

    // Fetch data on component mount
    useEffect(() => {
        fetchProductsAndInventory();
    }, [fetchProductsAndInventory]);


    // --- Helper Functions ---
    const formatTime = (timestamp) => { if (!timestamp) return '-'; try { return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch { return '-'; } };
    const formatCurrency = (value) => { if (typeof value !== 'number' || isNaN(value)) return '$--.--'; return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, }).format(value); };
    const formatMonthAbbreviation = (month) => { if (!month || typeof month !== 'string') return ''; return month.slice(0, 3); };
    const getStockStatus = (stock) => { if (stock <= 0) { return { text: 'Out of Stock', color: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/50' }; } if (stock <= LOW_STOCK_THRESHOLD) { return { text: 'Low Stock', color: 'text-yellow-700 dark:text-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-900/50' }; } return { text: 'In Stock', color: 'text-green-700 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/50' }; };
    const isValidHttpUrl = (string) => { if (!string) return false; try { const url = new URL(string); return url.protocol === "http:" || url.protocol === "https:"; } catch (_) { return false; } };

    // --- Mock Action Handlers (Keep for Orders Tab) ---
     const handleOrderStatusChange = (orderId, newStatus) => { console.log(`Changing order ${orderId} status to ${newStatus}`); setOrders(prevOrders => prevOrders.map(order => order.id === orderId ? { ...order, status: newStatus } : order )); };
     const handleUpdateOrder = (orderId) => { const orderToUpdate = orders.find(o => o.id === orderId); if (orderToUpdate) { console.log(`Simulating update for order ${orderId} status ${orderToUpdate.status}...`); toast.success(`Order #${orderId} status updated to ${orderToUpdate.status}. (Simulated)`); } };
     const handleImageFileChange = (event) => { if (event.target.files && event.target.files[0]) { const file = event.target.files[0]; setNewProductImageFile(file); setNewProductImageUrl(''); } else { setNewProductImageFile(null); } };
     const handleImageUrlChange = (event) => { const url = event.target.value; setNewProductImageUrl(url); if (url.trim() !== '') { setNewProductImageFile(null); const fileInput = document.getElementById('productImageFile'); if (fileInput) fileInput.value = ''; } };
     const handleImageMethodChange = (value) => { setImageUploadMethod(value); if (value === 'file') { setNewProductImageUrl(''); } else { setNewProductImageFile(null); const fileInput = document.getElementById('productImageFile'); if (fileInput) fileInput.value = ''; } };


    // --- API Stock Update Handler ---
    const handleStockUpdateAPI = async (productId) => {
        const inputElement = document.getElementById(`stock-update-${productId}`);
        if (!inputElement) {
            console.error("Input element not found:", productId);
            toast.error("Error: Input field not found.");
            return;
        }
        const newValue = inputElement.value.trim();

        if (newValue === '' || isNaN(newValue) || !Number.isInteger(Number(newValue)) || Number(newValue) < 0) {
            toast.error("Please enter a valid whole non-negative number for stock.");
            inputElement.focus();
            return;
        }

        const newStock = parseInt(newValue, 10);
        setUpdatingStockId(productId); // Set loading state for this row

        try {
            console.log(`API: Updating stock for Product ID ${productId} to ${newStock}`);
            const response = await axiosInstance.put(`/inventory/${productId}`, { stock: newStock });

            // Update the inventoryItems state
            setInventoryItems(prevItems =>
                prevItems.map(item =>
                    item.id === productId ? { ...item, stock: response.data.stock } : item
                )
            );
             // Also update adminProducts if necessary (though less likely needed here)
             // setAdminProducts(prev => prev.map(p => p.id === productId ? { ...p, /* update fields if PUT returns full product */ } : p));

            toast.success(`Stock for product ID ${productId} updated to ${response.data.stock}.`);
            inputElement.value = '';

        } catch (error) {
            console.error(`API Error updating stock for ${productId}:`, error);
            const errorMsg = error.response?.data?.detail || "Failed to update stock.";
            toast.error(`Update failed for ID ${productId}: ${errorMsg}`);
        } finally {
            setUpdatingStockId(null); // Clear loading state for this row
        }
    };

    // --- API Product Submit Handler ---
     const handleProductSubmit = async (event) => {
          event.preventDefault();
          const isFileMethod = imageUploadMethod === 'file';
          const isUrlMethod = imageUploadMethod === 'url';
          const imageSourceProvided = (isFileMethod && newProductImageFile) || (isUrlMethod && newProductImageUrl.trim() !== '');

          if (!newProductName || !newProductPrice || !newProductCategory || !imageSourceProvided) {
              toast.error("Please fill required fields (*), including an image file or URL.");
              return;
          }
          const price = parseFloat(newProductPrice);
          if (isNaN(price) || price < 0) {
              toast.error("Please enter a valid price (>= 0).");
              return;
          }

          let apiUrlForProduct = null;
          let canAttemptApi = false;
          if (isUrlMethod && newProductImageUrl.trim()) {
              if (isValidHttpUrl(newProductImageUrl.trim())) {
                  apiUrlForProduct = newProductImageUrl.trim();
                  canAttemptApi = true;
              } else {
                  toast.error("Please enter a valid image URL (http:// or https://).");
                  return;
              }
          } else if (isFileMethod && newProductImageFile) {
               toast.info("File upload submission via API is not implemented in this example. Please use URL or expect mock behavior.");
               // Allow falling through to mock logic if file chosen
          } else if(isUrlMethod && !newProductImageUrl.trim()) {
              toast.error("Please enter an image URL or choose the file upload method.");
              return;
          } else {
               toast.error("Please select an image file or choose the URL method.");
               return;
          }


          if (canAttemptApi) { // Only attempt API if URL method with valid URL is used
              setIsSubmitting(true);
              const apiProductData = {
                  name: newProductName.trim(), description: newProductDescription.trim() || null,
                  price: price, category: newProductCategory.trim() || null,
                  specifications: newProductSpecifications.trim() || null, features: newProductFeatures.trim() || null,
                  image_url: apiUrlForProduct,
              };

              try {
                  console.log("Attempting to submit product to API:", apiProductData);
                  const response = await axiosInstance.post('/products/', apiProductData);
                  const newProduct = response.data;
                  toast.success(`API: Product "${newProduct.name}" (ID: ${newProduct.id}) added!`);

                  // Add to adminProducts list
                  setAdminProducts(prev => [newProduct, ...prev].sort((a, b) => a.name.localeCompare(b.name))); // Keep sorted

                  // Add to inventoryItems list (backend service should create inventory with stock 0)
                  setInventoryItems(prev => [{ id: newProduct.id, name: newProduct.name, stock: 0 }, ...prev].sort((a, b) => a.name.localeCompare(b.name))); // Keep sorted

                  // Clear form
                  setNewProductName(''); setNewProductDescription(''); setNewProductPrice('');
                  setNewProductCategory(''); setNewProductSpecifications(''); setNewProductFeatures('');
                  setNewProductImageFile(null); setNewProductImageUrl(''); setImageUploadMethod('file');
                  const fileInput = document.getElementById('productImageFile'); if (fileInput) fileInput.value = '';

              } catch (error) {
                  console.error("API Error creating product:", error);
                  toast.error(`API Error: ${error.response?.data?.detail || "Failed to add product."}`);
              } finally {
                  setIsSubmitting(false);
              }
          } else {
              // --- Fallback to Original Mock Logic (if File method or no valid URL) ---
               console.log("Executing original MOCK product submit logic (File upload not implemented for API).");
               const mockId = `mock_${Date.now()}`;
               toast.success(`Product "${newProductName}" added! (Simulated - ID: ${mockId})`);
               // Add to inventoryItems with mock ID and 0 stock for display consistency, keep sorted
               setInventoryItems(prevData => [...prevData, { id: mockId, name: newProductName, stock: 0 }].sort((a, b) => a.name.localeCompare(b.name)));
               // Clear form as per original logic
               setNewProductName(''); setNewProductDescription(''); setNewProductPrice('');
               setNewProductCategory(''); setNewProductSpecifications(''); setNewProductFeatures('');
               setNewProductImageFile(null); setNewProductImageUrl(''); setImageUploadMethod('file');
               const fileInput = document.getElementById('productImageFile'); if (fileInput) fileInput.value = '';
          }
      };

     // --- API Handlers for Edit/Delete (Keep for reference, UI not added for these) ---
     const handleProductUpdateAPI = async (productDataToUpdate) => {
         if (!productDataToUpdate || !productDataToUpdate.id) return;
         const updatedData = { /* structure as in previous example */ };
         try {
             const response = await axiosInstance.put(`/products/${productDataToUpdate.id}`, updatedData);
             toast.success(`API: Product "${response.data.name}" updated.`);
             setAdminProducts(prev => prev.map(p => p.id === productDataToUpdate.id ? response.data : p).sort((a, b) => a.name.localeCompare(b.name)));
             setInventoryItems(prevData => prevData.map(item => item.id === response.data.id ? { ...item, name: response.data.name } : item).sort((a, b) => a.name.localeCompare(b.name)));
         } catch (error) { toast.error(`API Update Error: ${error.response?.data?.detail || "Failed."}`); }
     };

     const handleProductDeleteAPI = async (productId, productName) => {
         if (!window.confirm(`API DELETE:\n"${productName}" (ID: ${productId})\n\nThis will also delete associated inventory.\nAre you sure?`)) return;
         try {
             await axiosInstance.delete(`/products/${productId}`);
             toast.success(`API: Product "${productName}" deleted.`);
             setAdminProducts(prev => prev.filter(p => p.id !== productId)); // No need to sort after filter
             setInventoryItems(prevData => prevData.filter(item => item.id !== productId)); // No need to sort after filter
         } catch (error) { toast.error(`API Delete Error: ${error.response?.data?.detail || "Failed."}`); }
     };


    // --- Chart Data & Configs (Keep ALL from user's code) ---
    const revenueData = [ { month: "January", desktop: 4580, mobile: 2340 }, { month: "February", desktop: 5950, mobile: 3100 }, { month: "March", desktop: 5237, mobile: 2820 }, { month: "April", desktop: 6473, mobile: 3290 }, { month: "May", desktop: 7209, mobile: 3730 }, { month: "June", desktop: 7914, mobile: 3840 }, ];
    const orderStatusData = [ { status: "completed", count: 187 }, { status: "processing", count: 125 }, { status: "pending", count: 95 }, { status: "cancelled", count: 43 }, { status: "refunded", count: 32 }, ];
    const topCustomersData = [ { name: "John Smith", spent: 2186 }, { name: "Maria Garcia", spent: 1905 }, { name: "David Wong", spent: 1837 }, { name: "Sarah Johnson", spent: 1673 }, { name: "Amir Patel", spent: 1509 }, { name: "Emma Thompson", spent: 1314 }, ];
    const monthlyOrdersData = [ { month: "January", online: 186, instore: 80 }, { month: "February", online: 305, instore: 120 }, { month: "March", online: 237, instore: 140 }, { month: "April", online: 273, instore: 190 }, { month: "May", online: 309, instore: 230 }, { month: "June", online: 314, instore: 240 }, ];
    const newCustomersData = [ { month: "January", customers: 46 }, { month: "February", customers: 55 }, { month: "March", customers: 47 }, { month: "April", customers: 63 }, { month: "May", customers: 59 }, { month: "June", customers: 64 }, ];
    const [liveOrdersData, setLiveOrdersData] = useState([ { time: "10:00", orders: 28 }, { time: "11:00", orders: 35 }, { time: "12:00", orders: 42 }, { time: "13:00", orders: 38 }, { time: "14:00", orders: 32 }, { time: "15:00", orders: 38 }, ]);
    const revenueChartConfig = { desktop: { label: "Online", color: "hsl(220, 80%, 60%)" }, mobile: { label: "In-store", color: "hsl(160, 70%, 50%)" }, } ;
    const statusChartConfig = { count: { label: "Orders" }, completed: { label: "Completed", color: "hsl(140, 70%, 50%)" }, processing: { label: "Processing", color: "hsl(200, 80%, 60%)" }, pending: { label: "Pending", color: "hsl(45, 90%, 60%)" }, cancelled: { label: "Cancelled", color: "hsl(0, 75%, 60%)" }, refunded: { label: "Refunded", color: "hsl(280, 60%, 65%)" }, } ;
    const customersChartConfig = { spent: { label: "Spent", color: "hsl(260, 75%, 60%)" }, label: { color: "hsl(var(--primary-foreground))" }, } ;
    const ordersChartConfig = { online: { label: "Online", color: "hsl(220, 80%, 60%)" }, instore: { label: "In-store", color: "hsl(160, 70%, 50%)" }, } ;
    const newCustomersChartConfig = { customers: { label: "New Customers", color: "hsl(320, 70%, 60%)" }, } ;
    const liveOrdersChartConfig = { orders: { label: "Orders", color: "hsl(210, 80%, 60%)" }, } ;

    // --- Component Render ---
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 pt-8 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
             <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white"> Store Dashboard </h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-400"> Welcome, {displayUser?.name || 'Admin'}. Manage your store here. </p>
             </div>
              {/* Refresh Button */}
              <Button variant="outline" size="icon" onClick={fetchProductsAndInventory} disabled={productLoading || inventoryLoading} title="Refresh Product & Inventory List" className="mt-4 sm:mt-0">
                {(productLoading || inventoryLoading) ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
          </div>

          {/* Stats Cards (Keep as is, or adjust 3rd card if desired) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Card 1: Revenue */}
            <Card className="overflow-hidden shadow-sm dark:bg-gray-900 border dark:border-gray-700/50"> <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0"> <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</CardTitle> <DollarSign className="h-5 w-5 text-emerald-500 dark:text-emerald-400" /> </CardHeader> <CardContent> <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.revenue)}</div> <p className={`text-xs mt-1 flex items-center ${stats.growth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}> {stats.growth >= 0 ? '+' : ''}{stats.growth}% <TrendingUp className="h-3 w-3 ml-1" /> <span className="ml-1 text-gray-500 dark:text-gray-400">trend</span> </p> </CardContent> </Card>
            {/* Card 2: Orders */}
            <Card className="overflow-hidden shadow-sm dark:bg-gray-900 border dark:border-gray-700/50"> <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0"> <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</CardTitle> <ShoppingBag className="h-5 w-5 text-blue-500 dark:text-blue-400" /> </CardHeader> <CardContent> <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.orders}</div> <p className="text-xs mt-1 text-green-600 dark:text-green-400 flex items-center"> +8.2% <TrendingUp className="h-3 w-3 ml-1" /> <span className="ml-1 text-gray-500 dark:text-gray-400">vs last month</span> </p> </CardContent> </Card>
            {/* Card 3: API Products Loaded */}
            <Card className="overflow-hidden shadow-sm dark:bg-gray-900 border dark:border-gray-700/50">
               <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                 <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">API Products Loaded</CardTitle>
                 <Boxes className="h-5 w-5 text-purple-500 dark:text-purple-400" />
               </CardHeader>
               <CardContent>
                 <div className="text-2xl font-bold text-gray-900 dark:text-white">
                   {productLoading ? <Loader2 className="h-5 w-5 animate-spin inline-block"/> : adminProducts.length}
                 </div>
                 <p className={`text-xs mt-1 ${productError ? 'text-red-500' : 'text-muted-foreground'}`}>
                    {productLoading ? 'Loading products...' : (productError ? `Error: ${productError}` : `${adminProducts.length} products found`)}
                 </p>
               </CardContent>
             </Card>
          </div>

          {/* Main Tabs */}
          <Tabs defaultValue="overview" className="mb-8">
            <TabsList className="grid w-full grid-cols-6 bg-muted dark:bg-gray-800 rounded-lg p-1">
               {/* Keep existing TabsTriggers */}
               <TabsTrigger value="overview" className="flex items-center justify-center gap-1.5 text-sm"> <LayoutDashboard className="h-4 w-4"/> Overview </TabsTrigger>
               <TabsTrigger value="orders" className="flex items-center justify-center gap-1.5 text-sm"> <ListOrdered className="h-4 w-4"/> Orders </TabsTrigger>
               <TabsTrigger value="products" className="flex items-center justify-center gap-1.5 text-sm"> <PackagePlus className="h-4 w-4"/> Products </TabsTrigger>
               <TabsTrigger value="inventory" className="flex items-center justify-center gap-1.5 text-sm"> <Boxes className="h-4 w-4"/> Inventory </TabsTrigger>
               <TabsTrigger value="analytics" className="flex items-center justify-center gap-1.5 text-sm"> <BarChartHorizontal className="h-4 w-4"/> Analytics </TabsTrigger>
               <TabsTrigger value="customers" className="flex items-center justify-center gap-1.5 text-sm"> <Users className="h-4 w-4"/> Customers </TabsTrigger>
            </TabsList>

            {/* Overview Tab Content (Keep as is - relies on mock data) */}
            <TabsContent value="overview" className="mt-6 space-y-6">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="shadow-sm dark:bg-gray-900 border dark:border-gray-700/50"> <CardHeader> <CardTitle>Revenue Over Time</CardTitle> <CardDescription>Mock Revenue Data</CardDescription> </CardHeader> <CardContent className="pl-2 pr-4"> <ChartContainer config={revenueChartConfig} className="aspect-auto h-[300px] w-full"> <ResponsiveContainer width="100%" height="100%"> <AreaChart data={revenueData} margin={{ left: 0, right: 5, top: 5, bottom: 0 }}> <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" /> <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.slice(0, 3)} fontSize={12} /> <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `$${value / 1000}k`} fontSize={12} /> <ChartTooltip cursor={false} content={<ChartTooltipContent formatter={(value) => formatCurrency(value)} indicator="dot" />} /> <defs> <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1"> <stop offset="5%" stopColor="var(--color-desktop)" stopOpacity={0.8} /> <stop offset="95%" stopColor="var(--color-desktop)" stopOpacity={0.1} /> </linearGradient> <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1"> <stop offset="5%" stopColor="var(--color-mobile)" stopOpacity={0.8} /> <stop offset="95%" stopColor="var(--color-mobile)" stopOpacity={0.1} /> </linearGradient> </defs> <Area dataKey="mobile" type="natural" fill="url(#fillMobile)" fillOpacity={0.4} stroke="var(--color-mobile)" stackId="a" /> <Area dataKey="desktop" type="natural" fill="url(#fillDesktop)" fillOpacity={0.4} stroke="var(--color-desktop)" stackId="a" /> </AreaChart> </ResponsiveContainer> </ChartContainer> </CardContent> <CardFooter> <div className="flex w-full items-start gap-2 text-sm"> <div className="grid gap-2"> <div className="flex items-center gap-2 font-medium leading-none">Trending up by {stats.growth}% this month <TrendingUp className="h-4 w-4" /></div> <div className="flex items-center gap-2 leading-none text-muted-foreground">Mock Data: Jan - Jun 2024</div> </div> </div> </CardFooter> </Card>
                  <Card className="shadow-sm dark:bg-gray-900 border dark:border-gray-700/50"> <CardHeader> <CardTitle>Live Order Activity</CardTitle> <CardDescription>Orders per hour (simulated)</CardDescription> </CardHeader> <CardContent className="pl-2 pr-4"> <ChartContainer config={liveOrdersChartConfig} className="aspect-auto h-[300px] w-full"> <ResponsiveContainer width="100%" height="100%"> <RechartsLineChart data={liveOrdersData} margin={{ top: 20, left: 0, right: 5, bottom: 0 }}> <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3"/> <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} /> <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} /> <ChartTooltip cursor={{ strokeDasharray: '3 3' }} content={<ChartTooltipContent indicator="line" />} /> <Line dataKey="orders" type="monotone" stroke="var(--color-orders)" strokeWidth={2} dot={false} activeDot={{ r: 6 }} > <LabelList position="top" offset={12} className="fill-foreground" fontSize={12} dataKey="orders" /> </Line> </RechartsLineChart> </ResponsiveContainer> </ChartContainer> </CardContent> <CardFooter className="flex-col items-start gap-2 text-sm"> <div className="flex gap-2 font-medium leading-none"> {orders.length > 0 ? `Last mock order: ${formatTime(orders[0].timestamp)}` : "Awaiting mock orders..."} </div> <div className="leading-none text-muted-foreground">Updates simulated via mock WebSocket feed</div> </CardFooter> </Card>
               </div>
            </TabsContent>

            {/* Orders Tab Content (Keep as is - relies on mock data) */}
            <TabsContent value="orders" className="mt-6">
                <Card className="shadow-sm dark:bg-gray-900 border dark:border-gray-700/50"> <CardHeader> <CardTitle className="text-xl font-semibold">Manage Orders (Mock)</CardTitle> <CardDescription>View and update recent order statuses. Updates simulated.</CardDescription> </CardHeader> <CardContent> <div className="overflow-x-auto"> <table className="w-full text-sm"> <thead className="text-left text-muted-foreground"> <tr className="border-b dark:border-gray-700"> <th className="font-medium p-3">Order ID</th> <th className="font-medium p-3">Customer</th> <th className="font-medium p-3 text-right">Amount</th> <th className="font-medium p-3 text-center">Status</th> <th className="font-medium p-3 text-right">Time</th> <th className="font-medium p-3 text-center">Actions</th> </tr> </thead> <tbody className="divide-y dark:divide-gray-700/50"> {orders.length === 0 && ( <tr><td colSpan="6" className="p-4 text-center text-muted-foreground italic">No recent orders.</td></tr> )} {orders.map((order) => ( <tr key={order.id} className="hover:bg-muted/50 transition-colors"> <td className="p-3 font-mono text-xs">#{order.id}</td> <td className="p-3">{order.customer}</td> <td className="p-3 font-medium text-right">{formatCurrency(order.amount)}</td> <td className="p-3 text-center"> <Select value={order.status} onValueChange={(newStatus) => handleOrderStatusChange(order.id, newStatus)}> <SelectTrigger className="h-8 w-[120px] text-xs focus:ring-1 focus:ring-ring border-border mx-auto"> <SelectValue placeholder="Select status" /> </SelectTrigger> <SelectContent> <SelectItem value="Pending" className="text-xs">Pending</SelectItem> <SelectItem value="Processing" className="text-xs">Processing</SelectItem> <SelectItem value="Completed" className="text-xs">Completed</SelectItem> <SelectItem value="Cancelled" className="text-xs">Cancelled</SelectItem> <SelectItem value="Refunded" className="text-xs">Refunded</SelectItem> </SelectContent> </Select> </td> <td className="p-3 text-right text-muted-foreground">{formatTime(order.timestamp)}</td> <td className="p-3 text-center"> <div className="flex justify-center items-center gap-2"> <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => toast.info(`Viewing mock details for Order #${order.id}`)}> <Eye className="h-4 w-4" /> <span className="sr-only">View</span> </Button> <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleUpdateOrder(order.id)}> <Save className="h-4 w-4" /> <span className="sr-only">Update Status</span> </Button> </div> </td> </tr> ))} </tbody> </table> </div> </CardContent> </Card>
            </TabsContent>

            {/* Products Tab Content (Keep as is, uses handleProductSubmit) */}
            <TabsContent value="products" className="mt-6">
                <Card className="shadow-sm dark:bg-gray-900 border dark:border-gray-700/50">
                  <CardHeader> <CardTitle className="text-xl font-semibold">Add New Product</CardTitle> <CardDescription>Enter details for the new product. Fields marked with <span className="text-red-500">*</span> are required.</CardDescription> </CardHeader>
                  <CardContent>
                    <form onSubmit={handleProductSubmit} className="space-y-6">
                       {/* Product Name */}
                       <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4"> <Label htmlFor="productName" className="sm:text-right">Name <span className="text-red-500">*</span></Label> <Input id="productName" value={newProductName} onChange={(e) => setNewProductName(e.target.value)} placeholder="e.g., Wireless Noise-Cancelling Headphones" required className="sm:col-span-3" /> </div>
                       {/* Description */}
                       <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-4"> <Label htmlFor="productDescription" className="sm:text-right pt-2">Description</Label> <Textarea id="productDescription" value={newProductDescription} onChange={(e) => setNewProductDescription(e.target.value)} placeholder="Detailed description of the product..." rows={4} className="sm:col-span-3" /> </div>
                       {/* Specifications */}
                       <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-4"> <Label htmlFor="productSpecifications" className="sm:text-right pt-2">Specifications</Label> <Textarea id="productSpecifications" value={newProductSpecifications} onChange={(e) => setNewProductSpecifications(e.target.value)} placeholder="e.g., Color: Black
Weight: 250g
Connectivity: Bluetooth 5.3" rows={3} className="sm:col-span-3" /> </div>
                       {/* Features */}
                       <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-4"> <Label htmlFor="productFeatures" className="sm:text-right pt-2">Features</Label> <Textarea id="productFeatures" value={newProductFeatures} onChange={(e) => setNewProductFeatures(e.target.value)} placeholder="List key features (one per line):
- Active Noise Cancellation
- 30-Hour Battery Life" rows={3} className="sm:col-span-3" /> </div>
                       {/* Price and Category */}
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                         <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4"> <Label htmlFor="productPrice" className="sm:text-right">Price ($)<span className="text-red-500">*</span></Label> <Input id="productPrice" type="number" step="0.01" min="0" value={newProductPrice} onChange={(e) => setNewProductPrice(e.target.value)} placeholder="e.g., 199.99" required className="sm:col-span-3" /> </div>
                         <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4"> <Label htmlFor="productCategory" className="sm:text-right">Category<span className="text-red-500">*</span></Label> <Input id="productCategory" value={newProductCategory} onChange={(e) => setNewProductCategory(e.target.value)} placeholder="e.g., Electronics > Audio" required className="sm:col-span-3" /> </div>
                       </div>
                       {/* Image Upload Section */}
                       <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-4 border-t dark:border-gray-700 pt-6">
                         <Label className="sm:text-right pt-2">Product Image <span className="text-red-500">*</span></Label>
                         <div className="sm:col-span-3 space-y-4">
                           <RadioGroup value={imageUploadMethod} onValueChange={handleImageMethodChange} className="flex space-x-6">
                             <div className="flex items-center space-x-2"> <RadioGroupItem value="file" id="r-file" /> <Label htmlFor="r-file" className="font-normal cursor-pointer flex items-center gap-1.5"><Upload className="h-4 w-4 text-muted-foreground"/> Upload File</Label> </div>
                             <div className="flex items-center space-x-2"> <RadioGroupItem value="url" id="r-url" /> <Label htmlFor="r-url" className="font-normal cursor-pointer flex items-center gap-1.5"><LinkIcon className="h-4 w-4 text-muted-foreground"/> Enter URL</Label> </div>
                           </RadioGroup>
                           {imageUploadMethod === 'file' && ( <div className="flex items-center gap-4"> <Input id="productImageFile" type="file" onChange={handleImageFileChange} accept="image/*" required={imageUploadMethod === 'file'} className="flex-grow file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-muted file:text-foreground hover:file:bg-muted/80 cursor-pointer" aria-describedby="file-chosen-name"/> {newProductImageFile && ( <span id="file-chosen-name" className="text-sm text-muted-foreground truncate max-w-[150px]" title={newProductImageFile.name}> {newProductImageFile.name} </span> )} {!newProductImageFile && ( <span id="file-chosen-name" className="text-sm text-muted-foreground italic">No file chosen</span> )} </div> )}
                           {imageUploadMethod === 'url' && ( <Input id="productImageUrl" type="url" value={newProductImageUrl} onChange={handleImageUrlChange} placeholder="https://example.com/image.jpg" required={imageUploadMethod === 'url'} /> )}
                         </div>
                       </div>
                      {/* Submit Button */}
                      <div className="flex justify-end pt-4 border-t dark:border-gray-700">
                         <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[140px]">
                            {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <PackagePlus className="h-4 w-4 mr-2" />}
                            {isSubmitting ? 'Submitting...' : 'Add Product'}
                         </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
            </TabsContent>

            {/* ----- Inventory Tab Content ----- */}
            <TabsContent value="inventory" className="mt-6">
                <Card className="shadow-sm dark:bg-gray-900 border dark:border-gray-700/50">
                  <CardHeader>
                      <CardTitle className="text-xl font-semibold">Inventory Management</CardTitle>
                      <CardDescription> Track and update product stock levels. Low stock threshold: {LOW_STOCK_THRESHOLD} units.</CardDescription>
                      <div className='mt-2'>
                        {inventoryLoading && <p className='text-sm text-blue-500 flex items-center'><Loader2 className='h-4 w-4 animate-spin mr-1'/> Loading inventory data...</p>}
                        {inventoryError && !inventoryLoading && <p className='text-sm text-red-500'>Inventory Error: {inventoryError}</p>}
                        {!inventoryLoading && !inventoryError && <p className='text-sm text-green-600'>{inventoryItems.length} products listed.</p>}
                      </div>
                   </CardHeader>
                   <CardContent>
                     <div className="overflow-x-auto">
                       <table className="w-full text-sm">
                         <thead className="text-left text-muted-foreground">
                           <tr className="border-b dark:border-gray-700">
                             <th className="font-medium p-3">Product Name</th>
                             <th className="font-medium p-3 text-center w-[120px]">Current Stock</th>
                             <th className="font-medium p-3 text-center w-[130px]">Status</th>
                             <th className="font-medium p-3 text-center w-[220px]">Update Stock (Set New Total)</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y dark:divide-gray-700/50">
                           {(inventoryLoading || productLoading) && (
                             <tr> <td colSpan="4" className="p-4 text-center text-muted-foreground italic"> <Loader2 className="h-5 w-5 animate-spin inline mr-2"/> Loading data... </td> </tr>
                           )}
                           {!(inventoryLoading || productLoading) && inventoryItems.length === 0 && (
                             <tr> <td colSpan="4" className="p-4 text-center text-muted-foreground italic"> No products found or inventory data available. Add products first. </td> </tr>
                           )}
                            {!(inventoryLoading || productLoading) && inventoryItems.map((item) => {
                               const status = getStockStatus(item.stock);
                               const isUpdating = updatingStockId === item.id;
                               return (
                                 <tr key={item.id} className={`hover:bg-muted/50 transition-colors ${isUpdating ? 'opacity-70' : ''}`}>
                                   <td className="p-3 font-medium">{item.name} <span className="text-xs text-muted-foreground font-mono ml-1">(ID: {item.id})</span></td>
                                   <td className="p-3 text-center font-semibold">{item.stock}</td>
                                   <td className="p-3 text-center"> <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}> {status.text} </span> </td>
                                   <td className="p-3">
                                     <div className="flex justify-center items-center gap-2">
                                       <Input
                                          id={`stock-update-${item.id}`}
                                          type="number"
                                          min="0"
                                          step="1"
                                          placeholder="New Qty"
                                          className="h-8 w-24 text-sm focus:ring-1 focus:ring-ring"
                                          disabled={isUpdating}
                                        />
                                       <Button
                                          variant="outline"
                                          size="icon"
                                          className="h-8 w-8 text-primary hover:bg-accent hover:text-accent-foreground"
                                          onClick={() => handleStockUpdateAPI(item.id)}
                                          disabled={isUpdating}
                                          title={`Update stock for ${item.name}`}
                                        >
                                           {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                          <span className="sr-only">Update Stock for {item.name}</span>
                                        </Button>
                                     </div>
                                   </td>
                                 </tr>
                               );
                           })}
                         </tbody>
                       </table>
                     </div>
                   </CardContent>
                   <CardFooter className="text-sm text-muted-foreground pt-4 border-t dark:border-gray-700/50">
                     Enter the new total stock quantity and click the save icon to update via API.
                   </CardFooter>
                </Card>
            </TabsContent>
            {/* ----- End Inventory Tab Content ----- */}

            {/* Analytics Tab Content (Keep as is - relies on mock data) */}
            <TabsContent value="analytics" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   <Card className="shadow-sm dark:bg-gray-900 border dark:border-gray-700/50"> <CardHeader> <CardTitle>Order Status Distribution</CardTitle> <CardDescription>Current distribution of recent order statuses</CardDescription> </CardHeader> <CardContent className="pl-2 pr-4"> <ChartContainer config={statusChartConfig} className="aspect-auto h-[300px] w-full"> <ResponsiveContainer width="100%" height="100%"> <RechartsBarChart data={orderStatusData} margin={{top: 5, right: 5, left: 0, bottom: 5}}> <CartesianGrid vertical={false} stroke="hsl(var(--border))" /> <XAxis dataKey="status" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(value) => statusChartConfig[value]?.label} fontSize={12}/> <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12}/> <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} /> <Bar dataKey="count" radius={4}> {orderStatusData.map((entry) => ( <Rectangle key={entry.status} fill={`var(--color-${entry.status})`} /> ))} </Bar> </RechartsBarChart> </ResponsiveContainer> </ChartContainer> </CardContent> <CardFooter className="flex-col items-start gap-2 text-sm"> <div className="leading-none text-muted-foreground">Based on a snapshot of recent orders.</div> </CardFooter> </Card>
                   <Card className="shadow-sm dark:bg-gray-900 border dark:border-gray-700/50"> <CardHeader> <CardTitle>Monthly Orders (Channel)</CardTitle> <CardDescription>Online vs In-store orders (Jan - Jun 2024)</CardDescription> </CardHeader> <CardContent className="pl-2 pr-4"> <ChartContainer config={ordersChartConfig} className="aspect-auto h-[300px] w-full"> <ResponsiveContainer width="100%" height="100%"> <RechartsBarChart data={monthlyOrdersData} margin={{top: 5, right: 5, left: 0, bottom: 5}}> <CartesianGrid vertical={false} stroke="hsl(var(--border))" /> <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(value) => value.slice(0, 3)} fontSize={12}/> <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12}/> <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} /> <Bar dataKey="online" fill="var(--color-online)" radius={4} stackId="a"/> <Bar dataKey="instore" fill="var(--color-instore)" radius={4} stackId="a"/> </RechartsBarChart> </ResponsiveContainer> </ChartContainer> </CardContent> <CardFooter className="flex-col items-start gap-2 text-sm"> <div className="leading-none text-muted-foreground">Comparison of order channels over the last 6 months.</div> </CardFooter> </Card>
                </div>
            </TabsContent>

            {/* Customers Tab Content (Keep as is - relies on mock data) */}
            <TabsContent value="customers" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                   <Card className="lg:col-span-2 shadow-sm dark:bg-gray-900 border dark:border-gray-700/50"> <CardHeader> <CardTitle>Top Customers by Spend</CardTitle> <CardDescription>Highest lifetime spending customers (mock data)</CardDescription> </CardHeader> <CardContent className="pr-6"> <ChartContainer config={customersChartConfig} className="aspect-auto h-[350px] w-full"> <ResponsiveContainer width="100%" height="100%"> <RechartsBarChart data={topCustomersData} layout="vertical" margin={{ left: 0, right: 50, top: 10, bottom: 10}}> <CartesianGrid horizontal={false} stroke="hsl(var(--border))" /> <YAxis dataKey="name" type="category" tickLine={false} tickMargin={10} axisLine={false} hide /> <XAxis dataKey="spent" type="number" hide /> <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" formatter={(value) => formatCurrency(value)} />} /> <Bar dataKey="spent" layout="vertical" fill="var(--color-spent)" radius={4}> <LabelList dataKey="name" position="insideLeft" offset={8} className="fill-primary-foreground" fontSize={12} /> <LabelList dataKey="spent" position="right" offset={8} className="fill-foreground" fontSize={12} formatter={(value) => formatCurrency(value)} /> </Bar> </RechartsBarChart> </ResponsiveContainer> </ChartContainer> </CardContent> <CardFooter className="flex-col items-start gap-2 text-sm"> <div className="leading-none text-muted-foreground">Based on total lifetime spending data.</div> </CardFooter> </Card>
                   <Card className="shadow-sm dark:bg-gray-900 border dark:border-gray-700/50"> <CardHeader className="items-center pb-0"> <CardTitle>New Customers Trend</CardTitle> <CardDescription>Monthly new customer acquisition (Jan - Jun)</CardDescription> </CardHeader> <CardContent className="pb-4"> <ChartContainer config={newCustomersChartConfig} className="mx-auto aspect-square max-h-[320px]"> <RadarChart data={newCustomersData} margin={{ top: 10, right: 30, bottom: 0, left: 30 }}> <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot"/>} /> <PolarAngleAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickFormatter={formatMonthAbbreviation} /> <PolarGrid gridType='circle' stroke="hsl(var(--border))"/> <Radar dataKey="customers" fill="var(--color-customers)" fillOpacity={0.6} stroke="var(--color-customers)" dot={{ r: 4, fillOpacity: 1 }} /> </RadarChart> </ChartContainer> </CardContent> <CardFooter className="flex-col items-center gap-2 text-sm pt-4 border-t dark:border-gray-700/50"> <div className="leading-none text-muted-foreground text-center">Visualizing the trend of new customer sign-ups.</div> </CardFooter> </Card>
                </div>
            </TabsContent>

          </Tabs>
        </div>
         {/* Chart Colors Style (Keep as is) */}
         <style jsx global>{`
              :root {
                  --chart-1: hsl(220 80% 60%); --chart-2: hsl(160 70% 50%);
                  --chart-3: hsl(45 90% 60%);  --chart-4: hsl(0 75% 60%);
                  --chart-5: hsl(280 60% 65%);
                  --color-desktop: var(--chart-1); --color-mobile: var(--chart-2);
                  --color-orders: hsl(210 80% 60%);
                  --color-completed: var(--chart-1); --color-processing: var(--chart-2);
                  --color-pending: var(--chart-3);   --color-cancelled: var(--chart-4);
                  --color-refunded: var(--chart-5);
                  --color-online: var(--chart-1);    --color-instore: var(--chart-2);
                  --color-spent: hsl(260 75% 60%);
                  --color-customers: hsl(320 70% 60%);
              }
              .dark { /* Optional dark mode overrides */ }
          `}</style>
      </div>
    );
};

export default Dashboard;