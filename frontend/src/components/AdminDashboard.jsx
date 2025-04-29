// src/components/Dashboard.jsx (or adjust path)

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    TrendingUp, Users, ShoppingBag, DollarSign, PackagePlus, ListOrdered,
    Save, LayoutDashboard, BarChartHorizontal, Boxes, Upload, Link as LinkIcon,
    Loader2, RefreshCw, AlertCircle, Eye, Filter, Search, ListChecks, CalendarDays, Package,
    ServerCrash, CheckCircle, XCircle, Clock, Truck, Ban // Icons for status dropdown
} from 'lucide-react';

// Shadcn UI Components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"; // Updated Select imports
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// Recharts Components
import { Area, AreaChart, Bar, CartesianGrid, XAxis, Line, Radar, RadarChart, LabelList, YAxis, Rectangle, BarChart as RechartsBarChart, LineChart as RechartsLineChart, PolarAngleAxis, PolarGrid, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

import axiosInstance from '../api/axiosInstance';

// Define Chart Colors
const chartColors = {
    blue: "hsl(221.2 83.2% 53.3%)", violet: "hsl(262.1 83.3% 57.8%)",
    green: "hsl(142.1 70.6% 45.3%)", orange: "hsl(24.6 95% 53.1%)",
    red: "hsl(0 84.2% 60.2%)", cyan: "hsl(180 80% 45%)",
    muted: "hsl(220 8.9% 46.1%)"
};

// Define Order Statuses for Dropdown and Logic
const ORDER_STATUSES = [
    { value: 'pending', label: 'Pending', icon: Clock, badgeVariant: 'outline' },
    { value: 'pending_cod', label: 'Pending COD', icon: Clock, badgeVariant: 'secondary' },
    { value: 'processing', label: 'Processing', icon: RefreshCw, badgeVariant: 'warning' },
    { value: 'shipped', label: 'Shipped', icon: Truck, badgeVariant: 'info' },
    { value: 'delivered', label: 'Delivered', icon: CheckCircle, badgeVariant: 'success' },
    { value: 'cancelled', label: 'Cancelled', icon: Ban, badgeVariant: 'destructive' },
]; // Semicolon verified

// Helper component for Stats Card
const StatsCard = ({ title, value, icon: Icon, description }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        </CardHeader>
        <CardContent>
            {typeof value === 'object' && React.isValidElement(value) ? (
                 value
            ) : (
                 <div className="text-2xl font-bold">{value}</div>
            )}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </CardContent>
    </Card>
); // Semicolon verified

// Helper component for Loader inside Button or Select
const LoaderIf = ({ loading, className = "h-4 w-4 mr-2 animate-spin" }) => (
    loading ? <Loader2 className={className} /> : null
); // Semicolon verified


const Dashboard = () => {
    // --- State Definitions ---
    const [displayUser, setDisplayUser] = useState(null);
    const [stats, setStats] = useState({ revenue: 0, orders: 0, customers: 0, growth: 0 });
    const [newProductName, setNewProductName] = useState('');
    const [newProductDescription, setNewProductDescription] = useState('');
    const [newProductPrice, setNewProductPrice] = useState('');
    const [newProductCategory, setNewProductCategory] = useState('');
    const [newProductSpecifications, setNewProductSpecifications] = useState('');
    const [newProductFeatures, setNewProductFeatures] = useState('');
    const [newProductImageFile, setNewProductImageFile] = useState(null);
    const [imageUploadMethod, setImageUploadMethod] = useState('file');
    const [newProductImageUrl, setNewProductImageUrl] = useState('');
    const [adminProducts, setAdminProducts] = useState([]);
    const [productLoading, setProductLoading] = useState(true);
    const [productError, setProductError] = useState(null);
    const [isSubmittingProduct, setIsSubmittingProduct] = useState(false); // Renamed for clarity
    const [inventoryItems, setInventoryItems] = useState([]);
    const [inventoryLoading, setInventoryLoading] = useState(true);
    const [inventoryError, setInventoryError] = useState(null);
    const [updatingStockId, setUpdatingStockId] = useState(null);
    const [allOrders, setAllOrders] = useState([]);
    const [allOrdersLoading, setAllOrdersLoading] = useState(true);
    const [allOrdersError, setAllOrdersError] = useState(null);
    const [updatingStatusOrderId, setUpdatingStatusOrderId] = useState(null); // State for status update loading

    const LOW_STOCK_THRESHOLD = 10;
    const navigate = useNavigate();

    // --- Helper Functions ---
    const formatCurrency = (value) => {
        const numericAmount = Number(value);
        if (isNaN(numericAmount)) return '$--.--';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numericAmount);
    }; // Semicolon verified

    // Find status object from ORDER_STATUSES array
    const findStatusDetails = (statusValue) => {
        return ORDER_STATUSES.find(s => s.value === statusValue?.toLowerCase()) ||
               { value: statusValue || 'unknown', label: getStatusText(statusValue), icon: AlertCircle, badgeVariant: 'secondary' };
    }; // Semicolon verified

    // Get badge variant from status details
    const getStatusBadgeVariant = (status) => {
        return findStatusDetails(status).badgeVariant;
    }; // Semicolon verified

    // Get display text for status
    const getStatusText = (status) => {
        if (!status) return 'Unknown';
        const details = ORDER_STATUSES.find(s => s.value === status.toLowerCase());
        return details ? details.label : status.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
    }; // Semicolon verified


    const formatDate = (dateString) => {
       if (!dateString) return '--';
       try {
         return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(dateString));
       } catch { return 'Invalid Date'; }
    }; // Semicolon verified

    const getStockStatus = (stock) => {
        const numStock = Number(stock);
        if (isNaN(numStock) || numStock <= 0) { return { text: 'Out of Stock', color: 'text-red-700 dark:text-red-400', variant: 'destructive' }; }
        if (numStock <= LOW_STOCK_THRESHOLD) { return { text: 'Low Stock', color: 'text-yellow-700 dark:text-yellow-400', variant: 'secondary' }; }
        return { text: 'In Stock', color: 'text-green-700 dark:text-green-400', variant: 'success' };
     }; // Semicolon verified

    const isValidHttpUrl = (string) => {
        if (!string) return false;
        try { const url = new URL(string); return url.protocol === "http:" || url.protocol === "https:"; }
        catch (_) { return false; }
    }; // Semicolon verified

    const formatMonthAbbreviation = (month) => {
        if (!month || typeof month !== 'string') return '';
        return month.slice(0, 3);
    }; // Semicolon verified

    // --- Data Fetching Callbacks ---
    const fetchProductsAndInventory = useCallback(async (showToast = false) => {
        setProductLoading(true); setInventoryLoading(true); setProductError(null); setInventoryError(null);
        try {
            const [productResponse, inventoryResponse] = await Promise.all([ axiosInstance.get('/products/?limit=500'), axiosInstance.get('/inventory/?limit=500') ]);
            const fetchedProducts = productResponse.data || []; const fetchedInventory = inventoryResponse.data || [];
            setAdminProducts(fetchedProducts);
            const inventoryMap = new Map(fetchedInventory.map(item => [item.prod_id, item.stock]));
            const combinedItems = fetchedProducts.map(product => ({ id: product.id, name: product.name, stock: inventoryMap.get(product.id) ?? 0 })).sort((a, b) => a.name.localeCompare(b.name));
            setInventoryItems(combinedItems);
            if (showToast) toast.success(`Refreshed ${fetchedProducts.length} products & inventory.`);
        } catch (err) { console.error("Failed fetch products/inventory:", err); const errorMsg = err.response?.data?.detail || "Could not load product/inventory data."; setProductError(errorMsg); setInventoryError(errorMsg); setAdminProducts([]); setInventoryItems([]); if (showToast) toast.error(`Error loading data: ${errorMsg}`); }
        finally { setProductLoading(false); setInventoryLoading(false); }
    }, []); // Semicolon verified

    const fetchAllOrders = useCallback(async (showToast = false) => {
        setAllOrdersLoading(true); setAllOrdersError(null);
        setStats(prev => ({...prev, revenue: 0}));
        try {
            const response = await axiosInstance.get('/orders');
            const ordersData = Array.isArray(response.data) ? response.data : [];
            let calculatedTotalRevenue = 0;
            const processedOrders = ordersData.map(order => {
                const orderAmount = Number(order.total || 0);
                calculatedTotalRevenue += orderAmount;
                return {
                    id: order.id,
                    customerName: order.user?.name || order.user?.email || `User ID ${order.user_id || 'N/A'}`,
                    userId: order.user_id,
                    amount: orderAmount,
                    status: order.status?.toLowerCase() || 'unknown', // Ensure status is lowercase for consistency
                    date: order.created_at || order.date
                };
            }).sort((a,b)=> new Date(b.date).getTime() - new Date(a.date).getTime());

            setAllOrders(processedOrders);
            setStats(prev => ({ ...prev, revenue: calculatedTotalRevenue }));
            if (showToast && ordersData.length > 0) toast.success(`Refreshed ${processedOrders.length} total orders. Revenue recalculated.`);
            else if (showToast) toast.info("No orders found to refresh.");
        } catch (err) {
            console.error("Dashboard: Failed fetch all orders:", err);
            const errorMsg = err.response?.status === 401 ? "Unauthorized." : err.response?.status === 403 ? "Forbidden." : err.response?.data?.detail || err.message || "Could not load orders.";
            setAllOrdersError(errorMsg);
            setAllOrders([]);
            setStats(prev => ({ ...prev, revenue: 0 }));
            if (showToast) toast.error(`Error loading orders: ${errorMsg}`);
        } finally {
            setTimeout(() => setAllOrdersLoading(false), 200);
        }
    }, []); // Semicolon verified

    const refreshAllData = useCallback(() => {
        toast.info("Refreshing dashboard data...");
        fetchAllOrders(true).then(() => fetchProductsAndInventory(true));
    }, [fetchAllOrders, fetchProductsAndInventory]); // Semicolon verified

    // --- Initial Load ---
    useEffect(() => {
        const userString = localStorage.getItem('currentUser');
        if (userString) { try { const user = JSON.parse(userString); if (!user || user.role !== 'admin') navigate('/admin/login'); else setDisplayUser(user); } catch (e) { console.error("Error parsing user data", e); navigate('/admin/login'); } } else { navigate('/admin/login'); }
        refreshAllData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate]);


    // --- Action Handlers ---
    const handleStockUpdateAPI = async (productId) => {
        const inputElement = document.getElementById(`stock-update-${productId}`);
        if (!inputElement) return toast.error("Input element not found.");
        const newValue = inputElement.value.trim();
        if (newValue === '' || isNaN(newValue) || !Number.isInteger(Number(newValue)) || Number(newValue) < 0) { return toast.error("Please enter valid non-negative whole number."); }
        const newStock = parseInt(newValue, 10);
        setUpdatingStockId(productId);
        try {
            // Assuming endpoint is /inventory/{product_id} accepting { stock: number }
            const response = await axiosInstance.put(`/inventory/${productId}`, { stock: newStock });
            setInventoryItems(prevItems => prevItems.map(item => item.id === productId ? { ...item, stock: response.data.stock } : item ));
            toast.success(`Stock for ID ${productId} updated to ${response.data.stock}.`);
            inputElement.value = '';
        } catch (error) { console.error(`API Error updating stock for ${productId}:`, error); toast.error(`Update failed: ${error.response?.data?.detail || "Server Error"}`); }
        finally { setUpdatingStockId(null); }
     }; // Semicolon verified

    // Handler for updating order status
    const handleOrderStatusUpdate = async (orderId, newStatus) => {
        if (!newStatus || !orderId) return;
        const originalStatus = allOrders.find(o => o.id === orderId)?.status;
        if (newStatus === originalStatus) return;

        setUpdatingStatusOrderId(orderId);

        // Optimistic UI update
        setAllOrders(prevOrders =>
            prevOrders.map(order =>
                order.id === orderId ? { ...order, status: newStatus } : order
            )
        );

        try {
            // --- ADJUST THIS LINE ---
            // This API call caused the 404 error.
            // Replace `/orders/${orderId}` and `axiosInstance.patch` with the
            // correct endpoint URL and HTTP method (e.g., PUT, POST)
            // defined in your backend API for updating order status.
            // Also ensure the payload `{ status: newStatus }` is correct.
            await axiosInstance.patch(`/orders/${orderId}`, { status: newStatus });
            // --- END ADJUSTMENT ---

            toast.success(`Order #${orderId} status updated to ${getStatusText(newStatus)}.`);
            // Optional: Refetch orders to confirm, or use API response if it returns updated order
            // fetchAllOrders();

        } catch (error) {
            console.error(`API Error updating status for order ${orderId}:`, error);
            // Provide more specific feedback based on the error
            const errorMsg = error.response?.status === 404
                ? "API endpoint not found. Check backend route."
                : error.response?.data?.detail || "Server Error";
            toast.error(`Update failed for Order #${orderId}: ${errorMsg}`);

            // Revert optimistic update on error
            setAllOrders(prevOrders =>
                prevOrders.map(order =>
                    order.id === orderId ? { ...order, status: originalStatus } : order
                )
            );
        } finally {
            setUpdatingStatusOrderId(null); // Clear loading state for this row
        }
    }; // Semicolon verified


    const handleProductSubmit = async (event) => {
         event.preventDefault();
         const isFileMethod = imageUploadMethod === 'file'; const isUrlMethod = imageUploadMethod === 'url';
         const imageSourceProvided = (isFileMethod && newProductImageFile) || (isUrlMethod && newProductImageUrl.trim() !== '');
         if (!newProductName || !newProductPrice || !newProductCategory || !imageSourceProvided) { return toast.error("Fill required fields (*), including image."); }
         const price = parseFloat(newProductPrice);
         if (isNaN(price) || price < 0) { return toast.error("Enter a valid price (>= 0)."); }
         let apiUrlForProduct = null; let canAttemptApi = false;
         if (isUrlMethod && newProductImageUrl.trim()) { if (isValidHttpUrl(newProductImageUrl.trim())) { apiUrlForProduct = newProductImageUrl.trim(); canAttemptApi = true; } else { return toast.error("Enter a valid image URL (http/https)."); } }
         else if (isFileMethod && newProductImageFile) { toast.info("File upload via API not implemented. Use URL."); return; }
         else { return toast.error("Provide image source (URL or File)."); }

         if (canAttemptApi) {
             setIsSubmittingProduct(true);
             const apiProductData = { name: newProductName.trim(), description: newProductDescription.trim() || null, price: price, category: newProductCategory.trim() || null, specifications: newProductSpecifications.trim() || null, features: newProductFeatures.trim() || null, image_url: apiUrlForProduct };
             try {
                 const response = await axiosInstance.post('/products/', apiProductData);
                 const newProduct = response.data;
                 toast.success(`API: Product "${newProduct.name}" (ID: ${newProduct.id}) added!`);
                 setAdminProducts(prev => [newProduct, ...prev].sort((a, b) => a.name.localeCompare(b.name)));
                 setInventoryItems(prev => [{ id: newProduct.id, name: newProduct.name, stock: 0 }, ...prev].sort((a, b) => a.name.localeCompare(b.name)));
                 setNewProductName(''); setNewProductDescription(''); setNewProductPrice(''); setNewProductCategory(''); setNewProductSpecifications(''); setNewProductFeatures(''); setNewProductImageFile(null); setNewProductImageUrl(''); setImageUploadMethod('file');
                 const fileInput = document.getElementById('productImageFile'); if (fileInput) fileInput.value = '';
             } catch (error) { console.error("API Error creating product:", error); toast.error(`API Error: ${error.response?.data?.detail || "Failed."}`); }
             finally { setIsSubmittingProduct(false); }
         }
     }; // Semicolon verified

    const handleImageFileChange = (event) => { if (event.target.files?.[0]) { setNewProductImageFile(event.target.files[0]); setNewProductImageUrl(''); } else { setNewProductImageFile(null); } }; // Semicolon verified
    const handleImageUrlChange = (event) => { setNewProductImageUrl(event.target.value); if (event.target.value.trim() !== '') { setNewProductImageFile(null); const fileInput = document.getElementById('productImageFile'); if (fileInput) fileInput.value = ''; } }; // Semicolon verified
    const handleImageMethodChange = (value) => { setImageUploadMethod(value); if (value === 'file') setNewProductImageUrl(''); else { setNewProductImageFile(null); const fileInput = document.getElementById('productImageFile'); if (fileInput) fileInput.value = ''; } }; // Semicolon verified


    // --- Chart Data & Configs ---
    const revenueData = [ { month: "Jan", Online: 4580, InStore: 2340 }, { month: "Feb", Online: 5950, InStore: 3100 }, { month: "Mar", Online: 5237, InStore: 2820 }, { month: "Apr", Online: 6473, InStore: 3290 }, { month: "May", Online: 7209, InStore: 3730 }, { month: "Jun", Online: 7914, InStore: 3840 }, ];
    const orderStatusData = [ { name: "Completed", value: 187, fill: chartColors.green }, { name: "Processing", value: 125, fill: chartColors.orange }, { name: "Pending", value: 95, fill: chartColors.blue }, { name: "Cancelled", value: 43, fill: chartColors.red }, { name: "Refunded", value: 32, fill: chartColors.violet }, ];
    const topCustomersData = [ { name: "J. Smith", value: 2186, fill: chartColors.violet }, { name: "M. Garcia", value: 1905, fill: chartColors.blue }, { name: "D. Wong", value: 1837, fill: chartColors.green }, { name: "S. Johnson", value: 1673, fill: chartColors.orange }, { name: "A. Patel", value: 1509, fill: chartColors.cyan }, { name: "E. Thompson", value: 1314, fill: chartColors.red }, ];
    const newCustomersData = [ { month: "Jan", value: 46 }, { month: "Feb", value: 55 }, { month: "Mar", value: 47 }, { month: "Apr", value: 63 }, { month: "May", value: 59 }, { month: "Jun", value: 64 }, ];
    const revenueChartConfig = { Online: { label: "Online", color: chartColors.blue }, InStore: { label: "In-store", color: chartColors.green } } ;
    const statusChartConfig = { value: { label: "Orders" } } ;
    const customersChartConfig = { value: { label: "Spent" } } ;
    const newCustomersChartConfig = { value: { label: "New Customers" } } ;


    // --- Skeletons ---
    const renderOrderSkeletons = (count = 5) => (
        Array.from({ length: count }).map((_, index) => (
            <TableRow key={`order-skel-${index}`}>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                <TableCell className="text-center"><Skeleton className="h-8 w-32 mx-auto" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
            </TableRow>
        ))
    );
    const renderInventorySkeletons = (count = 5) => (
        Array.from({ length: count }).map((_, index) => ( <TableRow key={`inv-skel-${index}`}> <TableCell><Skeleton className="h-4 w-4/6" /></TableCell> <TableCell className="text-center"><Skeleton className="h-4 w-12 mx-auto" /></TableCell> <TableCell className="text-center"><Skeleton className="h-5 w-24 rounded-full mx-auto" /></TableCell> <TableCell><div className="flex justify-center"><Skeleton className="h-9 w-40" /></div></TableCell> </TableRow> ))
    );

    // --- Component Render ---
    const anyLoading = productLoading || inventoryLoading || allOrdersLoading;

    return (
      <div className="min-h-screen bg-background pt-8 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
             <div><h1 className="text-3xl font-bold tracking-tight text-foreground">Store Dashboard</h1><p className="mt-1 text-lg text-muted-foreground"> Welcome back, {displayUser?.name || 'Admin'}. </p></div>
             <Button variant="outline" size="sm" onClick={refreshAllData} disabled={anyLoading}> <LoaderIf loading={anyLoading} /> <RefreshCw className={`h-4 w-4 ${anyLoading ? 'hidden' : 'mr-2'}`} /> Refresh Data </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <StatsCard
                title="Total Revenue"
                value={allOrdersLoading ? <Skeleton className="h-7 w-32" /> : formatCurrency(stats.revenue)}
                icon={DollarSign}
                description={allOrdersLoading ? 'Calculating...' : 'Sum of all fetched orders'}
            />
            <StatsCard
                title="Total Orders"
                value={allOrdersLoading ? <Skeleton className="h-7 w-16"/> : allOrders.length}
                icon={ShoppingBag}
                description={allOrdersLoading ? 'Loading...' : 'All time'}
            />
            <StatsCard
                title="Active Products"
                value={productLoading ? <Skeleton className="h-7 w-16"/> : adminProducts.length}
                icon={Boxes}
                description={productLoading ? 'Loading...' : `${inventoryItems.filter(item => item.stock > 0).length} in stock`}
            />
          </div>

          {/* Main Tabs */}
          <Tabs defaultValue="all_orders" className="mb-8">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 bg-muted rounded-lg p-1 mb-6 overflow-x-auto">
               <TabsTrigger value="overview">Overview</TabsTrigger>
               <TabsTrigger value="all_orders">All Orders</TabsTrigger>
               <TabsTrigger value="products">Products</TabsTrigger>
               <TabsTrigger value="inventory">Inventory</TabsTrigger>
               <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            {/* --- Overview Tab --- */}
            <TabsContent value="overview">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   {/* Revenue Trend Chart (Mock) */}
                   <Card> <CardHeader> <CardTitle>Revenue Trend</CardTitle> <CardDescription>Online vs In-Store (Mock)</CardDescription> </CardHeader> <CardContent className="pl-2"> <ChartContainer config={revenueChartConfig} className="aspect-auto h-[250px]"> <AreaChart accessibilityLayer data={revenueData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}> <defs> <linearGradient id="colorOnline" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={chartColors.blue} stopOpacity={0.8}/><stop offset="95%" stopColor={chartColors.blue} stopOpacity={0}/></linearGradient> <linearGradient id="colorInStore" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={chartColors.green} stopOpacity={0.8}/><stop offset="95%" stopColor={chartColors.green} stopOpacity={0}/></linearGradient> </defs> <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))"/> <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickMargin={8}/> <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `$${value / 1000}k`}/> <ChartTooltip cursor={{fill: 'hsl(var(--muted)/.5)'}} content={<ChartTooltipContent indicator="dot" formatter={(value) => formatCurrency(value)} />} /> <Area type="monotone" dataKey="InStore" stroke={chartColors.green} fillOpacity={0.6} fill="url(#colorInStore)" strokeWidth={2} name="In-Store"/> <Area type="monotone" dataKey="Online" stroke={chartColors.blue} fillOpacity={0.6} fill="url(#colorOnline)" strokeWidth={2} name="Online" /> <Legend iconType="circle" wrapperStyle={{fontSize: '12px', paddingTop: '10px'}}/> </AreaChart> </ChartContainer> </CardContent> </Card>
                   {/* Top Customers Chart (Mock) */}
                   <Card> <CardHeader> <CardTitle>Top Customers by Spend</CardTitle> <CardDescription>Mock Data</CardDescription> </CardHeader> <CardContent className="pl-2"> <ChartContainer config={customersChartConfig} className="aspect-auto h-[250px]"> <RechartsBarChart data={topCustomersData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}> <CartesianGrid horizontal={false} stroke="hsl(var(--border))" /> <XAxis type="number" hide /> <YAxis dataKey="name" type="category" width={60} tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--muted-foreground))" /> <ChartTooltip cursor={{fill: 'hsl(var(--muted)/.5)'}} content={<ChartTooltipContent indicator="line" formatter={(value) => formatCurrency(value)} nameKey="name" />} /> <Bar dataKey="value" name="Spent" radius={[0, 4, 4, 0]} barSize={20}> {topCustomersData.map((entry, index) => (<Rectangle key={`cell-${index}`} fill={entry.fill} /> ))} <LabelList dataKey="value" position="right" offset={8} className="fill-foreground" fontSize={11} formatter={(value) => formatCurrency(value)} /> </Bar> </RechartsBarChart> </ChartContainer> </CardContent> </Card>
                </div>
            </TabsContent>

            {/* --- All Orders Tab --- */}
            <TabsContent value="all_orders">
                 <Card>
                    <CardHeader> <CardTitle>All Customer Orders</CardTitle> <CardDescription>Monitor and update order status.</CardDescription> </CardHeader>
                    <CardContent>
                       {allOrdersError && ( <div className="mb-4 p-4 border border-destructive bg-destructive/10 text-destructive rounded-md flex items-center gap-3"> <AlertCircle className="h-5 w-5 flex-shrink-0" /> <span>{allOrdersError}</span> <Button variant="destructive" size="sm" onClick={() => fetchAllOrders(true)} className="ml-auto">Retry</Button> </div> )}
                       <div className="border rounded-md overflow-hidden">
                           <Table>
                               <TableHeader className="bg-muted/50">
                                   <TableRow>
                                        <TableHead className="w-[100px] p-3">Order ID</TableHead>
                                        <TableHead className="p-3">Customer</TableHead>
                                        <TableHead className="p-3">Date</TableHead>
                                        <TableHead className="p-3 text-center w-[180px]">Status</TableHead>
                                        <TableHead className="p-3 text-right">Amount</TableHead>
                                   </TableRow>
                                </TableHeader>
                               <TableBody>
                                   {allOrdersLoading ? renderOrderSkeletons(5) : allOrders.length === 0 && !allOrdersError ? (
                                       <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground"> No orders found. </TableCell></TableRow>
                                    ) : (
                                       allOrders.map((order) => {
                                          const isUpdatingStatus = updatingStatusOrderId === order.id;
                                          const statusDetails = findStatusDetails(order.status);
                                          const StatusIcon = statusDetails.icon; // Get the icon component

                                          return (
                                           <TableRow key={order.id} className={`hover:bg-muted/50 ${isUpdatingStatus ? 'opacity-70' : ''}`}>
                                               <TableCell
                                                    className="p-3 font-mono text-xs font-medium cursor-pointer hover:underline"
                                                    onClick={() => navigate(`/admin/orders/${order.id}`)}
                                                    title={`View details for Order #${order.id}`}
                                                >
                                                    #{order.id}
                                                </TableCell>
                                               <TableCell className="p-3 font-medium">{order.customerName}</TableCell>
                                               <TableCell className="p-3 text-muted-foreground text-xs">{formatDate(order.date)}</TableCell>
                                               <TableCell className="p-3 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Select
                                                            value={order.status} // Current status value
                                                            onValueChange={(newStatus) => handleOrderStatusUpdate(order.id, newStatus)} // Handler on change
                                                            disabled={isUpdatingStatus || allOrdersLoading} // Disable while updating or initially loading
                                                        >
                                                            <SelectTrigger className={`h-8 text-xs w-[150px] relative ${isUpdatingStatus ? 'pl-8' : ''}`}> {/* Add relative positioning and padding */}
                                                                {/* Show loader inside trigger when updating */}
                                                                <LoaderIf loading={isUpdatingStatus} className="h-3 w-3 animate-spin absolute left-2 top-1/2 -translate-y-1/2" />
                                                                <SelectValue placeholder="Select status..." />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectGroup>
                                                                    <SelectLabel className="text-xs">Update Status</SelectLabel>
                                                                    {ORDER_STATUSES.map((statusOption) => (
                                                                        <SelectItem key={statusOption.value} value={statusOption.value} className="text-xs">
                                                                            <div className="flex items-center gap-2">
                                                                                {/* Render the icon component */}
                                                                                {statusOption.icon && <statusOption.icon className="h-3.5 w-3.5 text-muted-foreground" />}
                                                                                <span>{statusOption.label}</span>
                                                                            </div>
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectGroup>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                               </TableCell>
                                               <TableCell className="p-3 text-right font-medium">{formatCurrency(order.amount)}</TableCell>
                                           </TableRow>
                                          );
                                       })
                                   )}
                               </TableBody>
                           </Table>
                       </div>
                    </CardContent>
                 </Card>
            </TabsContent>

             {/* --- Inventory Tab --- */}
            <TabsContent value="inventory">
                <Card>
                  <CardHeader> <CardTitle>Inventory Management</CardTitle> <CardDescription> Track and update product stock levels. Low stock: {LOW_STOCK_THRESHOLD} units or less.</CardDescription> </CardHeader>
                   <CardContent>
                     {inventoryError && ( <div className="mb-4 p-4 border border-destructive bg-destructive/10 text-destructive rounded-md flex items-center gap-3"> <AlertCircle className="h-5 w-5 flex-shrink-0" /> <span>{inventoryError}</span> <Button variant="destructive" size="sm" onClick={() => fetchProductsAndInventory(true)} className="ml-auto">Retry</Button> </div> )}
                     <div className="border rounded-md overflow-hidden">
                       <Table>
                         <TableHeader className="bg-muted/50"> <TableRow> <TableHead className="p-3">Product Name (ID)</TableHead> <TableHead className="p-3 text-center w-[100px]">Stock</TableHead> <TableHead className="p-3 text-center w-[120px]">Status</TableHead> <TableHead className="p-3 text-center w-[240px]">Set New Stock Total</TableHead> </TableRow> </TableHeader>
                         <TableBody>
                            {(inventoryLoading || productLoading) && renderInventorySkeletons(5)}
                            {!(inventoryLoading || productLoading) && inventoryItems.length === 0 && !inventoryError && ( <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No products found.</TableCell></TableRow> )}
                            {!(inventoryLoading || productLoading) && inventoryItems.map((item) => {
                               const status = getStockStatus(item.stock);
                               const isUpdating = updatingStockId === item.id;
                               return ( <TableRow key={item.id} className={`hover:bg-muted/50 ${isUpdating ? 'opacity-60' : ''}`}> <TableCell className="p-3 font-medium">{item.name} <span className="text-xs text-muted-foreground font-mono ml-1">(ID: {item.id})</span></TableCell> <TableCell className="p-3 text-center font-semibold text-lg">{item.stock}</TableCell>
                               <TableCell className="p-3 text-center"> <Badge variant={status.variant} className={`text-xs px-2 py-0.5`}>{status.text}</Badge> </TableCell>
                               <TableCell className="p-3"> <form onSubmit={(e) => { e.preventDefault(); handleStockUpdateAPI(item.id); }} className="flex justify-center items-center gap-2"> <Input id={`stock-update-${item.id}`} type="number" min="0" step="1" placeholder="Qty" className="h-9 w-20 text-sm" disabled={isUpdating} required /> <Button type="submit" variant="outline" size="icon" className="h-9 w-9 text-primary hover:text-primary-foreground hover:bg-primary" disabled={isUpdating} title={`Update stock for ${item.name}`}> {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} </Button> </form> </TableCell> </TableRow> );
                           })}
                         </TableBody>
                       </Table>
                     </div>
                   </CardContent>
                </Card>
            </TabsContent>

            {/* --- Add Product Tab --- */}
            <TabsContent value="products">
                <Card>
                  <CardHeader> <CardTitle>Add New Product</CardTitle> <CardDescription>Enter product details. Required fields marked <span className="text-destructive">*</span>.</CardDescription> </CardHeader>
                  <CardContent>
                    <form onSubmit={handleProductSubmit} className="space-y-6">
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="productName">Product Name <span className="text-destructive">*</span></Label>
                                <Input id="productName" value={newProductName} onChange={(e) => setNewProductName(e.target.value)} placeholder="e.g., Wireless Ergonomic Mouse" required disabled={isSubmittingProduct}/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="productPrice">Price (USD) <span className="text-destructive">*</span></Label>
                                <Input id="productPrice" type="number" value={newProductPrice} onChange={(e) => setNewProductPrice(e.target.value)} placeholder="e.g., 49.99" step="0.01" min="0" required disabled={isSubmittingProduct}/>
                            </div>
                        </div>

                         <div className="space-y-2">
                                <Label htmlFor="productCategory">Category <span className="text-destructive">*</span></Label>
                                <Input id="productCategory" value={newProductCategory} onChange={(e) => setNewProductCategory(e.target.value)} placeholder="e.g., Electronics, Accessories" required disabled={isSubmittingProduct}/>
                         </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="productDescription">Description</Label>
                            <Textarea id="productDescription" value={newProductDescription} onChange={(e) => setNewProductDescription(e.target.value)} placeholder="Detailed description of the product..." rows={4} disabled={isSubmittingProduct}/>
                        </div>

                        {/* Specs & Features */}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="productSpecifications">Specifications</Label>
                                <Textarea id="productSpecifications" value={newProductSpecifications} onChange={(e) => setNewProductSpecifications(e.target.value)} placeholder="e.g., Size: ..., Weight: ..., Material: ..." rows={3} disabled={isSubmittingProduct}/>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="productFeatures">Key Features</Label>
                                <Textarea id="productFeatures" value={newProductFeatures} onChange={(e) => setNewProductFeatures(e.target.value)} placeholder="e.g., - Feature 1
- Feature 2
- Feature 3" rows={3} disabled={isSubmittingProduct}/>
                            </div>
                        </div>

                         {/* Image Upload */}
                         <Card className="bg-muted/30 border-dashed">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Product Image <span className="text-destructive">*</span></CardTitle>
                                <CardDescription>Choose upload method: File or URL.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <RadioGroup value={imageUploadMethod} onValueChange={handleImageMethodChange} className="flex space-x-4" disabled={isSubmittingProduct}>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="file" id="imageFileMethod" />
                                        <Label htmlFor="imageFileMethod" className="cursor-pointer flex items-center gap-1"><Upload className="w-4 h-4 mr-1"/>Upload File</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="url" id="imageUrlMethod" />
                                        <Label htmlFor="imageUrlMethod" className="cursor-pointer flex items-center gap-1"><LinkIcon className="w-4 h-4 mr-1"/>Use URL</Label>
                                    </div>
                                </RadioGroup>

                                {imageUploadMethod === 'file' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="productImageFile">Select Image File</Label>
                                        <Input id="productImageFile" type="file" onChange={handleImageFileChange} accept="image/png, image/jpeg, image/webp" disabled={isSubmittingProduct} />
                                        {newProductImageFile && <p className="text-xs text-muted-foreground">Selected: {newProductImageFile.name}</p>}
                                         <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                             <AlertCircle className="w-3 h-3"/> File upload via API is currently disabled. Please use the URL method.
                                         </p>
                                    </div>
                                )}

                                {imageUploadMethod === 'url' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="productImageUrl">Image URL</Label>
                                        <Input id="productImageUrl" type="url" value={newProductImageUrl} onChange={handleImageUrlChange} placeholder="https://example.com/image.jpg" disabled={isSubmittingProduct} required={imageUploadMethod === 'url'}/>
                                    </div>
                                )}
                            </CardContent>
                        </Card>


                        {/* Submit Button */}
                        <div className="flex justify-end">
                            <Button type="submit" disabled={isSubmittingProduct}>
                                <LoaderIf loading={isSubmittingProduct} />
                                <PackagePlus className={`h-4 w-4 ${isSubmittingProduct ? 'hidden' : 'mr-2'}`} />
                                Add Product
                            </Button>
                        </div>
                    </form>
                  </CardContent>
                </Card>
            </TabsContent>

             {/* --- Analytics Tab --- */}
            <TabsContent value="analytics">
                <Card>
                    <CardHeader><CardTitle>Store Analytics</CardTitle><CardDescription>Visual summary of store performance (Mock Data)</CardDescription></CardHeader>
                    <CardContent className="space-y-6">
                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Order Status Chart */}
                          <Card className="border shadow-sm"> <CardHeader className="p-4 pb-2"> <CardTitle className="text-base font-medium">Order Status Distribution</CardTitle> </CardHeader> <CardContent className="p-0 pb-4 pl-2 h-[250px]"> <ChartContainer config={statusChartConfig} className="w-full h-full"> <RechartsBarChart data={orderStatusData} margin={{top: 5, right: 20, left: 0, bottom: 5}}> <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" /> <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} /> <YAxis hide /> <ChartTooltip cursor={{fill: 'hsl(var(--muted)/.3)'}} content={<ChartTooltipContent indicator="dashed" nameKey="name" />} /> <Bar dataKey="value" name="Count" radius={[4, 4, 0, 0]}> {orderStatusData.map((entry) => ( <Rectangle key={entry.name} fill={entry.fill} /> ))} </Bar> </RechartsBarChart> </ChartContainer> </CardContent> </Card>
                          {/* New Customers Chart */}
                          <Card className="border shadow-sm"> <CardHeader className="p-4 pb-2 items-center"> <CardTitle className="text-base font-medium">New Customers Trend</CardTitle> </CardHeader> <CardContent className="p-0 pb-4 h-[250px] flex items-center justify-center"> <ChartContainer config={newCustomersChartConfig} className=" aspect-square h-[200px]"> <RadarChart data={newCustomersData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}> <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" nameKey="month" />} /> <PolarAngleAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickFormatter={formatMonthAbbreviation} /> <PolarGrid gridType='circle' stroke="hsl(var(--border))"/> <Radar name="Customers" dataKey="value" stroke={chartColors.violet} fill={chartColors.violet} fillOpacity={0.5} /> </RadarChart> </ChartContainer> </CardContent> </Card>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

          </Tabs>
        </div>
         {/* Chart Colors Style & Select Fix */}
         <style jsx global>{`
              :root {
                  --chart-1: ${chartColors.blue}; --chart-2: ${chartColors.green};
                  --chart-3: ${chartColors.orange}; --chart-4: ${chartColors.red};
                  --chart-5: ${chartColors.violet};
                  /* ... other color variables ... */
              }
              .dark {
                   --chart-1: hsl(221.2 80% 65%); --chart-2: hsl(142.1 65% 50%);
                   --chart-3: hsl(24.6 90% 55%); --chart-4: hsl(0 80% 65%);
                   --chart-5: hsl(262.1 80% 68%);
              }
              /* Fix for SelectTrigger text overlapping loader when padding is added */
              .pl-8 > span { padding-left: 0.5rem !important; }
          `}</style>
      </div>
    );
};

export default Dashboard;