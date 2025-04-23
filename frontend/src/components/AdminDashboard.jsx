import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Keep for potential internal navigation
import { toast } from 'sonner';
import {
  TrendingUp, Users, ShoppingBag, DollarSign, PackagePlus, ListOrdered,
  View, Save, LayoutDashboard, BarChartHorizontal, UploadCloud, ListChecks,
  Boxes, Upload, Link as LinkIcon, // Renamed Link to avoid conflict with React Router Link
} from 'lucide-react';

// Shadcn UI Components (Ensure these paths are correct)
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Recharts Components
import {
  Area, AreaChart, Bar, CartesianGrid, XAxis, Line, Radar, RadarChart,
  LabelList, YAxis, Rectangle, BarChart as RechartsBarChart, LineChart as RechartsLineChart, PolarAngleAxis, PolarGrid, ResponsiveContainer
} from "recharts";
// **** Ensure these are correctly imported ****
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const Dashboard = () => {
  // State for user display (fetched once for welcome message)
  const [displayUser, setDisplayUser] = useState(null);

  // Mock Data & Stats State (Keep as in the original prompt)
  const [orders, setOrders] = useState([ { id: 1, customer: 'John Doe', amount: 459.99, status: 'Completed', timestamp: new Date().getTime() - 600000 }, { id: 2, customer: 'Jane Smith', amount: 239.50, status: 'Processing', timestamp: new Date().getTime() - 720000 }, { id: 3, customer: 'Robert Brown', amount: 179.99, status: 'Completed', timestamp: new Date().getTime() - 840000 }, { id: 4, customer: 'Alice Johnson', amount: 329.75, status: 'Pending', timestamp: new Date().getTime() - 960000 }, { id: 5, customer: 'David Wilson', amount: 569.25, status: 'Processing', timestamp: new Date().getTime() - 1080000 }, ].sort((a, b) => b.timestamp - a.timestamp));
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
  const [inventoryData, setInventoryData] = useState([ { id: 'prod_001', name: 'Wireless Headphones', stock: 55 }, { id: 'prod_002', name: 'Smart Watch', stock: 23 }, { id: 'prod_003', name: 'Bluetooth Speaker', stock: 8 }, { id: 'prod_004', name: 'Laptop Stand', stock: 115 }, { id: 'prod_005', name: 'USB-C Hub', stock: 0 }, { id: 'prod_006', name: 'Ergonomic Mouse', stock: 15 }, ]);
  const LOW_STOCK_THRESHOLD = 10;
  const navigate = useNavigate();

  useEffect(() => { const userString = localStorage.getItem('currentUser'); if (userString) { try { const user = JSON.parse(userString); if (user && user.role === 'admin') { setDisplayUser(user); } } catch (e) { console.error("Error parsing display user data in dashboard", e); } } }, []);
  useEffect(() => { console.log("Establishing WebSocket simulation..."); const orderInterval = setInterval(() => { const newOrder = { id: Math.floor(Math.random() * 9000) + 1000, customer: ['Alex Thompson', 'Maria Garcia', 'Samantha Lee', 'Michael Chen', 'Olivia Wilson'][Math.floor(Math.random() * 5)], amount: Math.floor(Math.random() * 500) + 100 + Math.random(), status: ['Pending', 'Processing', 'Completed'][Math.floor(Math.random() * 3)], timestamp: new Date().getTime() }; setOrders(prevOrders => { const updatedOrders = [newOrder, ...prevOrders].slice(0, 10); if (typeof window !== 'undefined') { toast.info(`🚀 New order: #${newOrder.id} - ${formatCurrency(newOrder.amount)}`); } return updatedOrders; }); setStats(prevStats => ({ ...prevStats, revenue: prevStats.revenue + newOrder.amount, orders: prevStats.orders + 1, customers: Math.random() > 0.85 ? prevStats.customers + 1 : prevStats.customers, growth: parseFloat((prevStats.growth + (Math.random() * 0.4 - 0.2)).toFixed(1)) })); }, 20000 + Math.random() * 20000); const statInterval = setInterval(() => { setStats(prevStats => ({ ...prevStats, growth: parseFloat((prevStats.growth + (Math.random() * 0.2 - 0.1)).toFixed(1)) })); }, 8000); return () => { clearInterval(orderInterval); clearInterval(statInterval); console.log("WebSocket simulation stopped"); }; }, []);
  const handleProductSubmit = (event) => { event.preventDefault(); const isFileMethod = imageUploadMethod === 'file'; const isUrlMethod = imageUploadMethod === 'url'; const imageSourceProvided = (isFileMethod && newProductImageFile) || (isUrlMethod && newProductImageUrl.trim() !== ''); if (!newProductName || !newProductPrice || !newProductCategory || !imageSourceProvided) { toast.error("Please fill required fields (*), including an image file or URL."); return; } if (isUrlMethod && !isValidHttpUrl(newProductImageUrl)) { toast.error("Please enter a valid image URL (http:// or https://)."); return; } const newProductData = { id: `prod_${Date.now()}`, name: newProductName, description: newProductDescription, price: parseFloat(newProductPrice), category: newProductCategory, specifications: newProductSpecifications, features: newProductFeatures, ...(isFileMethod && { imageFile: newProductImageFile }), ...(isUrlMethod && { imageUrl: newProductImageUrl.trim() }), }; console.log("Submitting new product (simulated):", newProductData); if (isFileMethod) console.log("Simulating image upload for:", newProductImageFile.name); else console.log("Using image URL:", newProductImageUrl); toast.success(`Product "${newProductData.name}" added! (Simulated)`); setInventoryData(prevData => [...prevData, { id: newProductData.id, name: newProductData.name, stock: 0 }]); setNewProductName(''); setNewProductDescription(''); setNewProductPrice(''); setNewProductCategory(''); setNewProductSpecifications(''); setNewProductFeatures(''); setNewProductImageFile(null); setNewProductImageUrl(''); setImageUploadMethod('file'); const fileInput = document.getElementById('productImageFile'); if (fileInput) fileInput.value = ''; };
  const handleOrderStatusChange = (orderId, newStatus) => { console.log(`Changing order ${orderId} status to ${newStatus}`); setOrders(prevOrders => prevOrders.map(order => order.id === orderId ? { ...order, status: newStatus } : order )); };
  const handleUpdateOrder = (orderId) => { const orderToUpdate = orders.find(o => o.id === orderId); if (orderToUpdate) { console.log(`Simulating update for order ${orderId} with status ${orderToUpdate.status}...`); toast.success(`Order #${orderId} status updated to ${orderToUpdate.status}. (Simulated)`); } };
  const handleImageFileChange = (event) => { if (event.target.files && event.target.files[0]) { const file = event.target.files[0]; setNewProductImageFile(file); setNewProductImageUrl(''); } else { setNewProductImageFile(null); } };
  const handleImageUrlChange = (event) => { const url = event.target.value; setNewProductImageUrl(url); if (url.trim() !== '') { setNewProductImageFile(null); const fileInput = document.getElementById('productImageFile'); if (fileInput) fileInput.value = ''; } };
  const handleImageMethodChange = (value) => { setImageUploadMethod(value); if (value === 'file') { setNewProductImageUrl(''); } else { setNewProductImageFile(null); const fileInput = document.getElementById('productImageFile'); if (fileInput) fileInput.value = ''; } }
  const handleStockUpdate = (productId) => { const inputElement = document.getElementById(`stock-update-${productId}`); if (!inputElement) { console.error("Input element not found:", productId); toast.error("Error: Input not found."); return; } const newValue = inputElement.value; if (newValue === '' || isNaN(newValue) || !Number.isInteger(Number(newValue)) || Number(newValue) < 0) { toast.error("Please enter a valid whole non-negative number for stock."); return; } const newStock = parseInt(newValue, 10); console.log(`Updating stock for ${productId} to ${newStock}`); setInventoryData(prevData => prevData.map(item => item.id === productId ? { ...item, stock: newStock } : item) ); toast.success(`Stock for product ID ${productId} updated to ${newStock}. (Simulated)`); inputElement.value = ''; };
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
  const formatTime = (timestamp) => { if (!timestamp) return '-'; const date = new Date(timestamp); return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); };
  const formatCurrency = (value) => { if (typeof value !== 'number') return '$--.--'; return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, }).format(value); };
  const formatMonthAbbreviation = (month) => { if (!month || typeof month !== 'string') return ''; return month.slice(0, 3); };
  const getStockStatus = (stock) => { if (stock <= 0) { return { text: 'Out of Stock', color: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/50' }; } if (stock <= LOW_STOCK_THRESHOLD) { return { text: 'Low Stock', color: 'text-yellow-700 dark:text-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-900/50' }; } return { text: 'In Stock', color: 'text-green-700 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/50' }; };
  const isValidHttpUrl = (string) => { try { const url = new URL(string); return url.protocol === "http:" || url.protocol === "https:"; } catch (_) { return false; } };


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
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="overflow-hidden shadow-sm dark:bg-gray-900 border dark:border-gray-700/50"> <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0"> <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</CardTitle> <DollarSign className="h-5 w-5 text-emerald-500 dark:text-emerald-400" /> </CardHeader> <CardContent> <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.revenue)}</div> <p className={`text-xs mt-1 flex items-center ${stats.growth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}> {stats.growth >= 0 ? '+' : ''}{stats.growth}% <TrendingUp className="h-3 w-3 ml-1" /> <span className="ml-1 text-gray-500 dark:text-gray-400">trend</span> </p> </CardContent> </Card>
          <Card className="overflow-hidden shadow-sm dark:bg-gray-900 border dark:border-gray-700/50"> <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0"> <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</CardTitle> <ShoppingBag className="h-5 w-5 text-blue-500 dark:text-blue-400" /> </CardHeader> <CardContent> <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.orders}</div> <p className="text-xs mt-1 text-green-600 dark:text-green-400 flex items-center"> +8.2% <TrendingUp className="h-3 w-3 ml-1" /> <span className="ml-1 text-gray-500 dark:text-gray-400">vs last month</span> </p> </CardContent> </Card>
          <Card className="overflow-hidden shadow-sm dark:bg-gray-900 border dark:border-gray-700/50"> <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0"> <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Customers</CardTitle> <Users className="h-5 w-5 text-purple-500 dark:text-purple-400" /> </CardHeader> <CardContent> <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.customers}</div> <p className="text-xs mt-1 text-green-600 dark:text-green-400 flex items-center"> +4.9% <TrendingUp className="h-3 w-3 ml-1" /> <span className="ml-1 text-gray-500 dark:text-gray-400">vs last month</span> </p> </CardContent> </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="overview" className="mb-8">
          <TabsList className="grid w-full grid-cols-6 bg-muted dark:bg-gray-800 rounded-lg p-1">
             <TabsTrigger value="overview" className="flex items-center justify-center gap-1.5 text-sm"> <LayoutDashboard className="h-4 w-4"/> Overview </TabsTrigger>
             <TabsTrigger value="orders" className="flex items-center justify-center gap-1.5 text-sm"> <ListOrdered className="h-4 w-4"/> Orders </TabsTrigger>
             <TabsTrigger value="products" className="flex items-center justify-center gap-1.5 text-sm"> <PackagePlus className="h-4 w-4"/> Products </TabsTrigger>
             <TabsTrigger value="inventory" className="flex items-center justify-center gap-1.5 text-sm"> <Boxes className="h-4 w-4"/> Inventory </TabsTrigger>
             <TabsTrigger value="analytics" className="flex items-center justify-center gap-1.5 text-sm"> <BarChartHorizontal className="h-4 w-4"/> Analytics </TabsTrigger>
             <TabsTrigger value="customers" className="flex items-center justify-center gap-1.5 text-sm"> <Users className="h-4 w-4"/> Customers </TabsTrigger>
          </TabsList>

          {/* --- Overview Tab Content --- */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Chart - ADD ChartContainer */}
              <Card className="shadow-sm dark:bg-gray-900 border dark:border-gray-700/50">
                <CardHeader> <CardTitle>Revenue Over Time</CardTitle> <CardDescription>Online vs In-store revenue (Last 6 months)</CardDescription> </CardHeader>
                <CardContent className="pl-2 pr-4">
                  {/* **** ADD ChartContainer HERE **** */}
                  <ChartContainer config={revenueChartConfig} className="aspect-auto h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueData} margin={{ left: 0, right: 5, top: 5, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.slice(0, 3)} fontSize={12} />
                        <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `$${value / 1000}k`} fontSize={12} />
                        {/* ChartTooltip must be inside AreaChart */}
                        <ChartTooltip
                           cursor={false}
                           content={<ChartTooltipContent formatter={(value) => formatCurrency(value)} indicator="dot" />}
                        />
                        <defs> <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1"> <stop offset="5%" stopColor="var(--color-desktop)" stopOpacity={0.8} /> <stop offset="95%" stopColor="var(--color-desktop)" stopOpacity={0.1} /> </linearGradient> <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1"> <stop offset="5%" stopColor="var(--color-mobile)" stopOpacity={0.8} /> <stop offset="95%" stopColor="var(--color-mobile)" stopOpacity={0.1} /> </linearGradient> </defs>
                        <Area dataKey="mobile" type="natural" fill="url(#fillMobile)" fillOpacity={0.4} stroke="var(--color-mobile)" stackId="a" />
                        <Area dataKey="desktop" type="natural" fill="url(#fillDesktop)" fillOpacity={0.4} stroke="var(--color-desktop)" stackId="a" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer> {/* **** CLOSE ChartContainer **** */}
                </CardContent>
                <CardFooter> <div className="flex w-full items-start gap-2 text-sm"> <div className="grid gap-2"> <div className="flex items-center gap-2 font-medium leading-none">Trending up by {stats.growth}% this month <TrendingUp className="h-4 w-4" /></div> <div className="flex items-center gap-2 leading-none text-muted-foreground">January - June 2024</div> </div> </div> </CardFooter>
              </Card>

              {/* Live Order Chart - ADD ChartContainer */}
              <Card className="shadow-sm dark:bg-gray-900 border dark:border-gray-700/50">
                 <CardHeader> <CardTitle>Live Order Activity</CardTitle> <CardDescription>Orders per hour (simulated)</CardDescription> </CardHeader>
                 <CardContent className="pl-2 pr-4">
                   {/* **** ADD ChartContainer HERE **** */}
                   <ChartContainer config={liveOrdersChartConfig} className="aspect-auto h-[300px] w-full">
                     <ResponsiveContainer width="100%" height="100%">
                       <RechartsLineChart data={liveOrdersData} margin={{ top: 20, left: 0, right: 5, bottom: 0 }}>
                         <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3"/>
                         <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                         <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                         {/* ChartTooltip must be inside LineChart */}
                         <ChartTooltip
                            cursor={{ strokeDasharray: '3 3' }}
                            content={<ChartTooltipContent indicator="line" />}
                         />
                         <Line dataKey="orders" type="monotone" stroke="var(--color-orders)" strokeWidth={2} dot={false} activeDot={{ r: 6 }} >
                            <LabelList position="top" offset={12} className="fill-foreground" fontSize={12} dataKey="orders" />
                         </Line>
                       </RechartsLineChart>
                     </ResponsiveContainer>
                   </ChartContainer> {/* **** CLOSE ChartContainer **** */}
                 </CardContent>
                 <CardFooter className="flex-col items-start gap-2 text-sm"> <div className="flex gap-2 font-medium leading-none"> {orders.length > 0 ? `Last order received: ${formatTime(orders[0].timestamp)}` : "Awaiting orders..."} </div> <div className="leading-none text-muted-foreground">Updates simulated via mock WebSocket feed</div> </CardFooter>
               </Card>
            </div>
          </TabsContent>


           {/* --- Orders Tab Content --- */}
          <TabsContent value="orders" className="mt-6">
             <Card className="shadow-sm dark:bg-gray-900 border dark:border-gray-700/50"> <CardHeader> <CardTitle className="text-xl font-semibold">Manage Orders</CardTitle> <CardDescription>View and update recent order statuses. Updates simulated.</CardDescription> </CardHeader> <CardContent> <div className="overflow-x-auto"> <table className="w-full text-sm"> <thead className="text-left text-muted-foreground"> <tr className="border-b dark:border-gray-700"> <th className="font-medium p-3">Order ID</th> <th className="font-medium p-3">Customer</th> <th className="font-medium p-3 text-right">Amount</th> <th className="font-medium p-3 text-center">Status</th> <th className="font-medium p-3 text-right">Time</th> <th className="font-medium p-3 text-center">Actions</th> </tr> </thead> <tbody className="divide-y dark:divide-gray-700/50"> {orders.length === 0 && ( <tr><td colSpan="6" className="p-4 text-center text-muted-foreground italic">No recent orders.</td></tr> )} {orders.map((order) => ( <tr key={order.id} className="hover:bg-muted/50 transition-colors"> <td className="p-3 font-mono text-xs">#{order.id}</td> <td className="p-3">{order.customer}</td> <td className="p-3 font-medium text-right">{formatCurrency(order.amount)}</td> <td className="p-3 text-center"> <Select value={order.status} onValueChange={(newStatus) => handleOrderStatusChange(order.id, newStatus)}> <SelectTrigger className="h-8 w-[120px] text-xs focus:ring-1 focus:ring-ring border-border mx-auto"> <SelectValue placeholder="Select status" /> </SelectTrigger> <SelectContent> <SelectItem value="Pending" className="text-xs">Pending</SelectItem> <SelectItem value="Processing" className="text-xs">Processing</SelectItem> <SelectItem value="Completed" className="text-xs">Completed</SelectItem> <SelectItem value="Cancelled" className="text-xs">Cancelled</SelectItem> <SelectItem value="Refunded" className="text-xs">Refunded</SelectItem> </SelectContent> </Select> </td> <td className="p-3 text-right text-muted-foreground">{formatTime(order.timestamp)}</td> <td className="p-3 text-center"> <div className="flex justify-center items-center gap-2"> <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => toast.info(`Viewing details for Order #${order.id}`)}> <View className="h-4 w-4" /> <span className="sr-only">View</span> </Button> <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleUpdateOrder(order.id)}> <Save className="h-4 w-4" /> <span className="sr-only">Update Status</span> </Button> </div> </td> </tr> ))} </tbody> </table> </div> </CardContent> </Card>
          </TabsContent>

           {/* --- Products Tab Content --- */}
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
                        {imageUploadMethod === 'file' && ( <div className="flex items-center gap-4"> <Input id="productImageFile" type="file" onChange={handleImageFileChange} accept="image/png, image/jpeg, image/gif, image/webp" required={imageUploadMethod === 'file'} className="flex-grow file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-muted file:text-foreground hover:file:bg-muted/80 cursor-pointer" aria-describedby="file-chosen-name"/> {newProductImageFile && ( <span id="file-chosen-name" className="text-sm text-muted-foreground truncate max-w-[150px]" title={newProductImageFile.name}> {newProductImageFile.name} </span> )} {!newProductImageFile && ( <span id="file-chosen-name" className="text-sm text-muted-foreground italic">No file chosen</span> )} </div> )}
                        {imageUploadMethod === 'url' && ( <Input id="productImageUrl" type="url" value={newProductImageUrl} onChange={handleImageUrlChange} placeholder="https://example.com/image.jpg" required={imageUploadMethod === 'url'} /> )}
                    </div>
                  </div>

                  {/* Form Submission Button */}
                  <div className="flex justify-end pt-4 border-t dark:border-gray-700"> <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground"> <PackagePlus className="h-4 w-4 mr-2" /> Add Product </Button> </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>


          {/* --- Inventory Tab Content --- */}
          <TabsContent value="inventory" className="mt-6">
             <Card className="shadow-sm dark:bg-gray-900 border dark:border-gray-700/50"> <CardHeader> <CardTitle className="text-xl font-semibold">Inventory Management</CardTitle> <CardDescription> Track and update product stock levels. Low stock threshold: {LOW_STOCK_THRESHOLD} units. New products added via the 'Products' tab will appear here. </CardDescription> </CardHeader> <CardContent> <div className="overflow-x-auto"> <table className="w-full text-sm"> <thead className="text-left text-muted-foreground"> <tr className="border-b dark:border-gray-700"> <th className="font-medium p-3">Product Name</th> <th className="font-medium p-3 text-center w-[120px]">Current Stock</th> <th className="font-medium p-3 text-center w-[130px]">Status</th> <th className="font-medium p-3 text-center w-[220px]">Update Stock (Set New Total)</th> </tr> </thead> <tbody className="divide-y dark:divide-gray-700/50"> {inventoryData.length === 0 && ( <tr> <td colSpan="4" className="p-4 text-center text-muted-foreground italic"> No products in inventory. Add products first. </td> </tr> )} {inventoryData.map((item) => { const status = getStockStatus(item.stock); return ( <tr key={item.id} className="hover:bg-muted/50 transition-colors"> <td className="p-3 font-medium">{item.name} <span className="text-xs text-muted-foreground font-mono ml-1">({item.id})</span></td> <td className="p-3 text-center font-semibold">{item.stock}</td> <td className="p-3 text-center"> <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}> {status.text} </span> </td> <td className="p-3"> <div className="flex justify-center items-center gap-2"> <Input id={`stock-update-${item.id}`} type="number" min="0" step="1" placeholder="New Qty" className="h-8 w-24 text-sm focus:ring-1 focus:ring-ring" /> <Button variant="outline" size="icon" className="h-8 w-8 text-primary hover:bg-accent hover:text-accent-foreground" onClick={() => handleStockUpdate(item.id)}> <Save className="h-4 w-4" /> <span className="sr-only">Update Stock for {item.name}</span> </Button> </div> </td> </tr> ); })} </tbody> </table> </div> </CardContent> <CardFooter className="text-sm text-muted-foreground pt-4 border-t dark:border-gray-700/50"> Enter the new total stock quantity and click the save icon to update (simulation). </CardFooter> </Card>
          </TabsContent>

          {/* --- Analytics Tab Content --- */}
          <TabsContent value="analytics" className="mt-6 space-y-6">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {/* Order Status Chart - ADD ChartContainer */}
                 <Card className="shadow-sm dark:bg-gray-900 border dark:border-gray-700/50">
                    <CardHeader> <CardTitle>Order Status Distribution</CardTitle> <CardDescription>Current distribution of recent order statuses</CardDescription> </CardHeader>
                    <CardContent className="pl-2 pr-4">
                      {/* **** ADD ChartContainer HERE **** */}
                      <ChartContainer config={statusChartConfig} className="aspect-auto h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsBarChart data={orderStatusData} margin={{top: 5, right: 5, left: 0, bottom: 5}}>
                            <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                            <XAxis dataKey="status" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(value) => statusChartConfig[value]?.label} fontSize={12}/>
                            <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12}/>
                            {/* ChartTooltip must be inside BarChart */}
                            <ChartTooltip
                               cursor={false}
                               content={<ChartTooltipContent indicator="dashed" />}
                            />
                            <Bar dataKey="count" radius={4}>
                              {orderStatusData.map((entry) => (
                                <Rectangle key={entry.status} fill={`var(--color-${entry.status})`} />
                              ))}
                            </Bar>
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      </ChartContainer> {/* **** CLOSE ChartContainer **** */}
                    </CardContent>
                    <CardFooter className="flex-col items-start gap-2 text-sm"> <div className="leading-none text-muted-foreground">Based on a snapshot of recent orders.</div> </CardFooter>
                 </Card>

                 {/* Monthly Orders Chart - ADD ChartContainer */}
                 <Card className="shadow-sm dark:bg-gray-900 border dark:border-gray-700/50">
                    <CardHeader> <CardTitle>Monthly Orders (Channel)</CardTitle> <CardDescription>Online vs In-store orders (Jan - Jun 2024)</CardDescription> </CardHeader>
                    <CardContent className="pl-2 pr-4">
                      {/* **** ADD ChartContainer HERE **** */}
                      <ChartContainer config={ordersChartConfig} className="aspect-auto h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsBarChart data={monthlyOrdersData} margin={{top: 5, right: 5, left: 0, bottom: 5}}>
                            <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                            <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(value) => value.slice(0, 3)} fontSize={12}/>
                            <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12}/>
                            {/* ChartTooltip must be inside BarChart */}
                            <ChartTooltip
                               cursor={false}
                               content={<ChartTooltipContent indicator="dashed" />}
                            />
                            <Bar dataKey="online" fill="var(--color-online)" radius={4} stackId="a"/>
                            <Bar dataKey="instore" fill="var(--color-instore)" radius={4} stackId="a"/>
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      </ChartContainer> {/* **** CLOSE ChartContainer **** */}
                    </CardContent>
                    <CardFooter className="flex-col items-start gap-2 text-sm"> <div className="leading-none text-muted-foreground">Comparison of order channels over the last 6 months.</div> </CardFooter>
                 </Card>
            </div>
          </TabsContent>


          {/* --- Customers Tab Content --- */}
          <TabsContent value="customers" className="mt-6 space-y-6">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* Top Customers Chart - ADD ChartContainer */}
                 <Card className="lg:col-span-2 shadow-sm dark:bg-gray-900 border dark:border-gray-700/50">
                    <CardHeader> <CardTitle>Top Customers by Spend</CardTitle> <CardDescription>Highest lifetime spending customers (mock data)</CardDescription> </CardHeader>
                    <CardContent className="pr-6">
                      {/* **** ADD ChartContainer HERE **** */}
                      <ChartContainer config={customersChartConfig} className="aspect-auto h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsBarChart data={topCustomersData} layout="vertical" margin={{ left: 0, right: 50, top: 10, bottom: 10}}>
                            <CartesianGrid horizontal={false} stroke="hsl(var(--border))" />
                            <YAxis dataKey="name" type="category" tickLine={false} tickMargin={10} axisLine={false} hide />
                            <XAxis dataKey="spent" type="number" hide />
                            {/* ChartTooltip must be inside BarChart */}
                            <ChartTooltip
                               cursor={false}
                               content={<ChartTooltipContent indicator="line" formatter={(value) => formatCurrency(value)} />}
                            />
                            <Bar dataKey="spent" layout="vertical" fill="var(--color-spent)" radius={4}>
                              <LabelList dataKey="name" position="insideLeft" offset={8} className="fill-primary-foreground" fontSize={12} />
                              <LabelList dataKey="spent" position="right" offset={8} className="fill-foreground" fontSize={12} formatter={(value) => formatCurrency(value)} />
                            </Bar>
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      </ChartContainer> {/* **** CLOSE ChartContainer **** */}
                    </CardContent>
                    <CardFooter className="flex-col items-start gap-2 text-sm"> <div className="leading-none text-muted-foreground">Based on total lifetime spending data.</div> </CardFooter>
                 </Card>

                 {/* New Customers Chart - ADD ChartContainer */}
                 <Card className="shadow-sm dark:bg-gray-900 border dark:border-gray-700/50">
                    <CardHeader className="items-center pb-0"> <CardTitle>New Customers Trend</CardTitle> <CardDescription>Monthly new customer acquisition (Jan - Jun)</CardDescription> </CardHeader>
                    <CardContent className="pb-4">
                      {/* **** ADD ChartContainer HERE **** */}
                      <ChartContainer config={newCustomersChartConfig} className="mx-auto aspect-square max-h-[320px]">
                        {/* RadarChart often doesn't need ResponsiveContainer if using aspect-square */}
                        <RadarChart data={newCustomersData} margin={{ top: 10, right: 30, bottom: 0, left: 30 }}>
                           {/* ChartTooltip must be inside RadarChart */}
                          <ChartTooltip
                             cursor={false}
                             content={<ChartTooltipContent indicator="dot"/>}
                          />
                          <PolarAngleAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickFormatter={formatMonthAbbreviation} />
                          <PolarGrid gridType='circle' stroke="hsl(var(--border))"/>
                          <Radar dataKey="customers" fill="var(--color-customers)" fillOpacity={0.6} stroke="var(--color-customers)" dot={{ r: 4, fillOpacity: 1 }} />
                        </RadarChart>
                      </ChartContainer> {/* **** CLOSE ChartContainer **** */}
                    </CardContent>
                    <CardFooter className="flex-col items-center gap-2 text-sm pt-4 border-t dark:border-gray-700/50"> <div className="leading-none text-muted-foreground text-center">Visualizing the trend of new customer sign-ups.</div> </CardFooter>
                 </Card>
            </div>
          </TabsContent>

        </Tabs>
      </div>
       {/* Define chart colors using CSS variables */}
       <style jsx global>{`
            :root {
                --color-desktop: hsl(220 80% 60%);
                --color-mobile: hsl(160 70% 50%);
                --color-orders: hsl(210 80% 60%);
                --color-completed: hsl(140 70% 50%);
                --color-processing: hsl(200 80% 60%);
                --color-pending: hsl(45 90% 60%);
                --color-cancelled: hsl(0 75% 60%);
                --color-refunded: hsl(280 60% 65%);
                --color-online: hsl(220 80% 60%);
                --color-instore: hsl(160 70% 50%);
                --color-spent: hsl(260 75% 60%);
                --color-customers: hsl(320 70% 60%);
            }
            /* Example: Define dark mode chart colors if needed */
            .dark {
                /* --color-desktop: hsl(220 70% 70%); */
                /* --color-mobile: hsl(160 60% 60%); */
                /* ... etc ... */
            }
        `}</style>
    </div>
  );
};

export default Dashboard;