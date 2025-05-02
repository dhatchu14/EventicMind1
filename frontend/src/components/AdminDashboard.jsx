// src/pages/AdminDashboard.jsx (or adjust path as needed)

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner'; // Using sonner
import {
    TrendingUp, Users, ShoppingBag, DollarSign, PackagePlus, ListOrdered,
    Save, LayoutDashboard, BarChartHorizontal, Boxes, Upload, Link as LinkIcon,
    Loader2, RefreshCw, AlertCircle, Eye, Filter, Search, ListChecks, CalendarDays, Package,
    ServerCrash, CheckCircle, XCircle, Clock, Truck, Ban, Wifi, WifiOff // Added Wifi icons
} from 'lucide-react';

// Shadcn UI Components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// Recharts Components
import { Area, AreaChart, Bar, CartesianGrid, XAxis, Line, Radar, RadarChart, LabelList, YAxis, Rectangle, BarChart as RechartsBarChart, LineChart as RechartsLineChart, PolarAngleAxis, PolarGrid, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

import axiosInstance from '../api/axiosInstance';

// --- Import the AI Prediction Card ---
import { AiPredictionCard } from '@/components/AiPredictionCard';

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
];

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
);

// Helper component for Loader inside Button or Select
const LoaderIf = ({ loading, className = "h-4 w-4 mr-2 animate-spin" }) => (
    loading ? <Loader2 className={className} /> : null
);

const AdminDashboard = () => {
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
    const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
    const [inventoryItems, setInventoryItems] = useState([]);
    const [inventoryLoading, setInventoryLoading] = useState(true);
    const [inventoryError, setInventoryError] = useState(null);
    const [updatingStockId, setUpdatingStockId] = useState(null);
    const [allOrders, setAllOrders] = useState([]);
    const [allOrdersLoading, setAllOrdersLoading] = useState(true);
    const [allOrdersError, setAllOrdersError] = useState(null);
    const [updatingStatusOrderId, setUpdatingStatusOrderId] = useState(null);
    // --- WebSocket State ---
    const [isWsConnected, setIsWsConnected] = useState(false);
    const [wsError, setWsError] = useState(null);
    const ws = useRef(null); // Use useRef to hold the WebSocket instance
    // --- WebSocket Reconnection State ---
    const reconnectTimeoutRef = useRef(null); // Ref to store reconnect timeout ID
    const retryAttempt = useRef(0); // Ref to track retry attempts

    const LOW_STOCK_THRESHOLD = 10;
    const MAX_RECONNECT_ATTEMPTS = 5; // Max attempts before showing persistent error
    const RECONNECT_BASE_DELAY = 2000; // Initial delay 2 seconds

    const navigate = useNavigate();

    // --- Helper Functions ---
    const formatCurrency = (value) => {
        const numericAmount = Number(value);
        if (isNaN(numericAmount)) return '$--.--';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numericAmount);
    };

    const findStatusDetails = (statusValue) => {
        return ORDER_STATUSES.find(s => s.value === statusValue?.toLowerCase()) ||
               { value: statusValue || 'unknown', label: getStatusText(statusValue), icon: AlertCircle, badgeVariant: 'secondary' };
    };

    const getStatusBadgeVariant = (status) => {
        return findStatusDetails(status).badgeVariant;
    };

    const getStatusText = (status) => {
        if (!status) return 'Unknown';
        const details = ORDER_STATUSES.find(s => s.value === status.toLowerCase());
        return details ? details.label : status.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
    };

    const formatDate = (dateString) => {
       if (!dateString) return '--';
       try {
         return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(dateString));
       } catch { return 'Invalid Date'; }
    };

    const getStockStatus = (stock) => {
        const numStock = Number(stock);
        if (isNaN(numStock) || numStock <= 0) { return { text: 'Out of Stock', color: 'text-red-700 dark:text-red-400', variant: 'destructive' }; }
        if (numStock <= LOW_STOCK_THRESHOLD) { return { text: 'Low Stock', color: 'text-yellow-700 dark:text-yellow-400', variant: 'secondary' }; }
        return { text: 'In Stock', color: 'text-green-700 dark:text-green-400', variant: 'success' };
     };

    const isValidHttpUrl = (string) => {
        if (!string) return false;
        try { const url = new URL(string); return url.protocol === "http:" || url.protocol === "https:"; }
        catch (_) { return false; }
    };

    const formatMonthAbbreviation = (month) => {
        if (!month || typeof month !== 'string') return '';
        return month.slice(0, 3);
    };

    // --- Data Fetching Callbacks ---
    const fetchProductsAndInventory = useCallback(async (showToast = false) => {
        setProductLoading(true); setInventoryLoading(true); setProductError(null); setInventoryError(null);
        try {
            const [productResponse, inventoryResponse] = await Promise.all([
                axiosInstance.get('/products/?limit=500'),
                axiosInstance.get('/inventory/?limit=500')
            ]);
            const fetchedProducts = productResponse.data || [];
            const fetchedInventory = inventoryResponse.data || [];

            setAdminProducts(fetchedProducts);

            const inventoryMap = new Map(fetchedInventory.map(item => [item.prod_id, item.stock]));
            const combinedItems = fetchedProducts.map(product => ({
                id: product.id,
                name: product.name,
                stock: inventoryMap.get(product.id) ?? 0
            })).sort((a, b) => a.name.localeCompare(b.name));
            setInventoryItems(combinedItems);

            if (showToast) toast.success(`Refreshed ${fetchedProducts.length} products & inventory.`);
        } catch (err) {
            console.error("Failed fetch products/inventory:", err);
            const errorMsg = err.response?.data?.detail || "Could not load product/inventory data.";
            setProductError(errorMsg); setInventoryError(errorMsg);
            setAdminProducts([]); setInventoryItems([]);
            if (showToast) toast.error(`Error loading data: ${errorMsg}`);
        } finally {
            setProductLoading(false); setInventoryLoading(false);
        }
    }, []);

    const fetchAllOrders = useCallback(async (showToast = false) => {
        setAllOrdersLoading(true);
        setAllOrdersError(null);
        // Don't reset revenue here if WS updates it incrementally
        // setStats(prev => ({ ...prev, revenue: 0 }));

        try {
            const response = await axiosInstance.get('/orders/orders/admin/all');
            const ordersData = Array.isArray(response.data) ? response.data : [];

            let calculatedTotalRevenue = 0;
            const processedOrders = ordersData.map(order => {
                const orderAmount = Number(order.total || 0);
                calculatedTotalRevenue += orderAmount;
                const userId = order.user_id || order.user?.id || 'N/A';

                return {
                    id: order.id,
                    userId: userId,
                    amount: orderAmount,
                    status: order.status?.toLowerCase() || 'unknown',
                    date: order.created_at || order.date,
                    rawOrderData: order
                };
            }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            setAllOrders(processedOrders);
            // Update stats with potentially more accurate data from full fetch
            setStats(prev => ({
                ...prev,
                revenue: calculatedTotalRevenue,
                orders: processedOrders.length
            }));

            if (showToast && ordersData.length > 0) {
                toast.success(`Refreshed ${processedOrders.length} total orders. Revenue recalculated.`);
            } else if (showToast) {
                toast.info("No orders found to refresh.");
            }

        } catch (err) {
            console.error("Dashboard: Failed to fetch all orders:", err);
            const errorMsg =
                err.response?.status === 401 ? "Unauthorized." // Should not happen for this endpoint if public
                : err.response?.status === 403 ? "Forbidden."
                : err.response?.data?.detail || err.message || "Could not load orders.";
            setAllOrdersError(errorMsg);
            setAllOrders([]);
            setStats(prev => ({ ...prev, revenue: 0, orders: 0 })); // Reset on error
            if (showToast) toast.error(`Error loading orders: ${errorMsg}`);
        } finally {
            setTimeout(() => setAllOrdersLoading(false), 200);
        }
    }, []);

    const refreshAllData = useCallback(() => {
        toast.info("Refreshing dashboard data...");
        // Fetch orders first, then products/inventory
        fetchAllOrders(true).then(() => {
            fetchProductsAndInventory(true);
        });
    }, [fetchAllOrders, fetchProductsAndInventory]);

    // --- Initial Load & Authentication Check ---
    useEffect(() => {
        // This effect primarily checks if the user *looks* like an admin based on localStorage
        // The actual access control is (or should be) on the backend API endpoints.
        // For the WebSocket, we're now assuming it's open if the user reaches this page.
        const userString = localStorage.getItem('currentUser');
        let isAdmin = false;
        let userObject = null;
        if (userString) {
            try {
                userObject = JSON.parse(userString);
                // Basic check for admin role - enhance if needed
                if (userObject && userObject.role === 'admin') {
                    isAdmin = true;
                } else {
                    console.warn("User data found but role is not 'admin'. Redirecting to login.");
                    navigate('/admin/login'); // Redirect non-admins
                }
            } catch (e) {
                console.error("Error parsing user data from localStorage", e);
                navigate('/admin/login'); // Redirect on parsing error
            }
        } else {
            console.log("No user data found in localStorage. Redirecting to login.");
            navigate('/admin/login'); // Redirect if no user data
        }

        // If checks pass, set the user and fetch data
        if (isAdmin && JSON.stringify(userObject) !== JSON.stringify(displayUser)) {
             setDisplayUser(userObject);
             refreshAllData(); // Fetch data only when admin user is confirmed
        }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate]); // Rerun on navigation changes

    // --- WebSocket Connection Logic ---
    const connectWebSocket = useCallback(() => {
        // Conditions to check before attempting connection
        // Now only checks if the user *should* be here (basic check)
        if (!displayUser || displayUser.role !== 'admin') {
            console.log("WebSocket: Skipping connection, user not admin or not logged in.");
            return;
        }
        if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) {
             console.log("WebSocket: Connection attempt skipped, already open or connecting. State:", ws.current.readyState);
             return;
        }
         // Clear any pending reconnect timeout
         if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        // --- Construct WebSocket URL (No Token) ---
        const wsBaseUrl = process.env.NODE_ENV === 'production'
            ? 'wss://your-production-domain.com' // << --- REPLACE WITH YOUR ACTUAL PRODUCTION WSS URL
            : 'ws://localhost:8000';
        // REMOVED: ?token=${token}
        const wsUrl = `${wsBaseUrl}/orders/ws/admin/notifications`;

        console.log(`WebSocket: Attempting public connection #${retryAttempt.current + 1} to: ${wsUrl}`);
        setWsError('Connecting...'); // Indicate connection attempt
        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
            console.log('WebSocket: Admin connection established (public).');
            setIsWsConnected(true);
            setWsError(null); // Clear connecting/error message
            retryAttempt.current = 0; // Reset retry counter on successful connection
            toast.success("Real-time notifications connected.", { duration: 2000 });
        };

        ws.current.onmessage = (event) => {
            console.log('WebSocket: Message received:', event.data);
            try {
                const message = JSON.parse(event.data);

                if (message.type === 'new_order') {
                    toast.info(
                        `🚀 New Order #${message.order_id} Received!`,
                        {
                            description: `User ID: ${message.user_id || 'N/A'}, Total: ${formatCurrency(message.total)}, Status: ${getStatusText(message.status)}`,
                            duration: 10000,
                        }
                    );
                    // Update stats immediately
                    setStats(prev => ({
                        ...prev,
                        orders: prev.orders + 1,
                        revenue: prev.revenue + (Number(message.total) || 0),
                    }));
                    // Optional: Refresh full list if needed
                    // setTimeout(() => fetchAllOrders(false), 1000);

                } else if (message.type === 'status') {
                    // General status messages from backend (e.g., welcome message)
                    console.log(`WebSocket Status: ${message.message}`);
                    // You could still use this for a connection confirmation toast if backend sends one
                    // if (message.message === 'Admin WS Connected') {
                    //    toast.success("Real-time notifications active.", { duration: 2000 });
                    // }

                } else if (message.type === 'ping') {
                    // Optional: Handle keep-alive pings
                    // console.log("WebSocket: Ping received.");
                    // ws.current?.send('{"type": "pong"}');
                }
                 else {
                    console.warn("WebSocket: Received unknown message type:", message.type, message);
                }

            } catch (error) {
                console.error('WebSocket: Failed to parse message:', error, 'Data:', event.data);
                toast.error("Received unreadable notification data.");
            }
        };

        ws.current.onerror = (error) => {
            console.error('WebSocket: Error event occurred:', error);
            setIsWsConnected(false);
            // Let onclose handle UI updates and reconnection logic
        };

        ws.current.onclose = (event) => {
            console.log(`WebSocket: Connection Closed. Code=${event.code}, Reason='${event.reason}', Clean=${event.wasClean}`);
            setIsWsConnected(false);
            ws.current = null; // Nullify the ref

            if (event.code === 1000 || event.code === 1001) { // Normal closure
                console.log("WebSocket: Closed cleanly.");
                setWsError(null); // Clear errors
                retryAttempt.current = 0; // Reset retries
            } else { // Abnormal closure - Attempt Reconnection
                let closeReason = event.reason || 'Connection lost';
                // REMOVED: Specific handling for code 1008 (Auth failure)
                if (!event.reason && event.code === 1006) {
                    closeReason = 'Connection timed out or server unavailable';
                }
                console.warn(`WebSocket: Connection closed abnormally. Attempting reconnect... (Attempt ${retryAttempt.current + 1})`);
                setWsError(`Disconnected: ${closeReason}. Retrying...`);

                if (retryAttempt.current < MAX_RECONNECT_ATTEMPTS) {
                    const delay = RECONNECT_BASE_DELAY * Math.pow(2, retryAttempt.current);
                    console.log(`WebSocket: Scheduling reconnect in ${delay / 1000}s`);
                    reconnectTimeoutRef.current = setTimeout(() => {
                        retryAttempt.current += 1;
                        connectWebSocket(); // Attempt to reconnect
                    }, delay);
                } else {
                    console.error(`WebSocket: Max reconnect attempts (${MAX_RECONNECT_ATTEMPTS}) reached.`);
                    setWsError(`Disconnected: ${closeReason}. Max retries reached. Please refresh manually.`);
                    toast.error(`Failed to reconnect WebSocket after ${MAX_RECONNECT_ATTEMPTS} attempts.`, { duration: 10000 });
                }
            }
        };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [displayUser]); // Dependency: connectWebSocket depends on displayUser

    // --- WebSocket Connection Trigger Effect ---
    useEffect(() => {
        // Trigger connection attempt when displayUser is set and is an admin
        if (displayUser && displayUser.role === 'admin') {
            connectWebSocket();
        }

        // Cleanup function: Clear timeout and close connection on unmount or user change
        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
            if (ws.current) {
                console.log("WebSocket: Cleaning up connection on unmount/user change.");
                // Remove listeners first
                ws.current.onopen = null;
                ws.current.onmessage = null;
                ws.current.onerror = null;
                ws.current.onclose = null;
                ws.current.close(1000, "Component unmounting or user change"); // Normal closure
                ws.current = null;
                setIsWsConnected(false);
            }
            retryAttempt.current = 0; // Reset retries on cleanup
            setWsError(null); // Clear error state on cleanup
        };
    }, [connectWebSocket, displayUser]);


    // --- Action Handlers (No changes needed below this point for WS auth removal) ---
    const handleStockUpdateAPI = async (productId) => {
        const inputElement = document.getElementById(`stock-update-${productId}`);
        if (!inputElement) return toast.error("Input element not found.");
        const newValue = inputElement.value.trim();
        if (newValue === '' || isNaN(newValue) || !Number.isInteger(Number(newValue)) || Number(newValue) < 0) {
            return toast.error("Please enter valid non-negative whole number.");
        }
        const newStock = parseInt(newValue, 10);
        setUpdatingStockId(productId);
        try {
            const response = await axiosInstance.put(`/inventory/${productId}`, { stock: newStock });
            setInventoryItems(prevItems => prevItems.map(item =>
                item.id === productId ? { ...item, stock: response.data.stock } : item
            ));
            toast.success(`Stock for ID ${productId} updated to ${response.data.stock}.`);
            inputElement.value = '';
        } catch (error) {
            console.error(`API Error updating stock for ${productId}:`, error);
            toast.error(`Update failed: ${error.response?.data?.detail || "Server Error"}`);
        } finally {
            setUpdatingStockId(null);
        }
    };

    const handleOrderStatusUpdate = async (orderId, newStatus) => {
        if (!newStatus || !orderId) return;
        const orderIndex = allOrders.findIndex(o => o.id === orderId);
        if (orderIndex === -1) return;
        const originalStatus = allOrders[orderIndex]?.status;
        if (newStatus === originalStatus) return;
        setUpdatingStatusOrderId(orderId);
        const updatedOrders = allOrders.map(order =>
            order.id === orderId ? { ...order, status: newStatus.toLowerCase() } : order
        );
        setAllOrders(updatedOrders);
        try {
            const correctPath = `/orders/orders/${orderId}`;
            const response = await axiosInstance.patch(correctPath, { status: newStatus });
            const updatedOrderData = response.data;
            toast.success(`Order #${orderId} status updated to ${getStatusText(updatedOrderData.status)}.`);
        } catch (error) {
            console.error(`API Error updating status for order ${orderId}:`, error);
            const errorMsg = error.response?.status === 404
                ? "Order not found or API path incorrect."
                : error.response?.data?.detail || "Server error during update.";
            toast.error(`Update failed for Order #${orderId}: ${errorMsg}`);
            setAllOrders(prevOrders => prevOrders.map(order =>
                order.id === orderId ? { ...order, status: originalStatus } : order
            ));
        } finally {
            setUpdatingStatusOrderId(null);
        }
    };

    const handleProductSubmit = async (event) => {
         event.preventDefault();
         const isFileMethod = imageUploadMethod === 'file';
         const isUrlMethod = imageUploadMethod === 'url';
         const imageSourceProvided = (isFileMethod && newProductImageFile) || (isUrlMethod && newProductImageUrl.trim() !== '');
         if (!newProductName || !newProductPrice || !newProductCategory || !imageSourceProvided) {
             return toast.error("Please fill all required fields (*), including providing an image source.");
         }
         const price = parseFloat(newProductPrice);
         if (isNaN(price) || price < 0) {
             return toast.error("Please enter a valid, non-negative price.");
         }
         let finalImageUrl = null;
         if (isUrlMethod && newProductImageUrl.trim()) {
             if (isValidHttpUrl(newProductImageUrl.trim())) {
                 finalImageUrl = newProductImageUrl.trim();
             } else {
                 return toast.error("Please enter a valid image URL (starting with http:// or https://).");
             }
         } else if (isFileMethod && newProductImageFile) {
             toast.info("File upload via API is not implemented in this version. Please use the URL option.");
             return;
         } else {
              return toast.error("Please provide an image source (URL or File).");
         }
         if (finalImageUrl) {
             setIsSubmittingProduct(true);
             const apiProductData = {
                 name: newProductName.trim(),
                 description: newProductDescription.trim() || null,
                 price: price,
                 category: newProductCategory.trim() || null,
                 specifications: newProductSpecifications.trim() || null,
                 features: newProductFeatures.trim() || null,
                 image_url: finalImageUrl
             };
             try {
                 const response = await axiosInstance.post('/products/', apiProductData);
                 const newProduct = response.data;
                 toast.success(`Product "${newProduct.name}" (ID: ${newProduct.id}) added successfully!`);
                 fetchProductsAndInventory(false);
                 setNewProductName('');
                 setNewProductDescription('');
                 setNewProductPrice('');
                 setNewProductCategory('');
                 setNewProductSpecifications('');
                 setNewProductFeatures('');
                 setNewProductImageFile(null);
                 setNewProductImageUrl('');
                 setImageUploadMethod('file');
                 const fileInput = document.getElementById('productImageFile');
                 if (fileInput) fileInput.value = '';
             } catch (error) {
                 console.error("API Error creating product:", error);
                 toast.error(`API Error: ${error.response?.data?.detail || "Failed to add product."}`);
             } finally {
                 setIsSubmittingProduct(false);
             }
         }
    };

    const handleImageFileChange = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            setNewProductImageFile(file);
            setNewProductImageUrl('');
             setImageUploadMethod('file');
        } else {
            setNewProductImageFile(null);
        }
    };

    const handleImageUrlChange = (event) => {
        const url = event.target.value;
        setNewProductImageUrl(url);
        if (url.trim() !== '') {
            setNewProductImageFile(null);
            const fileInput = document.getElementById('productImageFile');
            if (fileInput) fileInput.value = '';
             setImageUploadMethod('url');
        }
    };

    const handleImageMethodChange = (value) => {
        setImageUploadMethod(value);
        if (value === 'file') {
            setNewProductImageUrl('');
        } else {
            setNewProductImageFile(null);
            const fileInput = document.getElementById('productImageFile');
            if (fileInput) fileInput.value = '';
        }
    };


    // --- Chart Data & Configs --- (Mock Data)
    const revenueData = [ { month: "Jan", Online: 4580, InStore: 2340 }, { month: "Feb", Online: 5950, InStore: 3100 }, { month: "Mar", Online: 5237, InStore: 2820 }, { month: "Apr", Online: 6473, InStore: 3290 }, { month: "May", Online: 7209, InStore: 3730 }, { month: "Jun", Online: 7914, InStore: 3840 }, ];
    const orderStatusData = [ { name: "Completed", value: 187, fill: chartColors.green }, { name: "Processing", value: 125, fill: chartColors.orange }, { name: "Pending", value: 95, fill: chartColors.blue }, { name: "Cancelled", value: 43, fill: chartColors.red }, { name: "Refunded", value: 32, fill: chartColors.violet }, ];
    const topCustomersData = [ { name: "J. Smith", value: 2186, fill: chartColors.violet }, { name: "M. Garcia", value: 1905, fill: chartColors.blue }, { name: "D. Wong", value: 1837, fill: chartColors.green }, { name: "S. Johnson", value: 1673, fill: chartColors.orange }, { name: "A. Patel", value: 1509, fill: chartColors.cyan }, { name: "E. Thompson", value: 1314, fill: chartColors.red }, ];
    const newCustomersData = [ { month: "Jan", value: 46 }, { month: "Feb", value: 55 }, { month: "Mar", value: 47 }, { month: "Apr", value: 63 }, { month: "May", value: 59 }, { month: "Jun", value: 64 }, ];
    const revenueChartConfig = { Online: { label: "Online", color: chartColors.blue }, InStore: { label: "In-store", color: chartColors.green } };
    const statusChartConfig = { value: { label: "Orders" } };
    const customersChartConfig = { value: { label: "Spent" } };
    const newCustomersChartConfig = { value: { label: "New Customers" } };

    // --- Skeletons ---
    const renderOrderSkeletons = (count = 5) => ( Array.from({ length: count }).map((_, index) => ( <TableRow key={`order-skel-${index}`}><TableCell><Skeleton className="h-4 w-20" /></TableCell><TableCell><Skeleton className="h-4 w-32" /></TableCell><TableCell><Skeleton className="h-4 w-40" /></TableCell><TableCell className="text-center"><Skeleton className="h-8 w-32 mx-auto" /></TableCell><TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell></TableRow> )) );
    const renderInventorySkeletons = (count = 5) => ( Array.from({ length: count }).map((_, index) => ( <TableRow key={`inv-skel-${index}`}><TableCell><Skeleton className="h-4 w-4/6" /></TableCell><TableCell className="text-center"><Skeleton className="h-4 w-12 mx-auto" /></TableCell><TableCell className="text-center"><Skeleton className="h-5 w-24 rounded-full mx-auto" /></TableCell><TableCell><div className="flex justify-center"><Skeleton className="h-9 w-40" /></div></TableCell></TableRow> )) );

    // --- Component Render ---
    const anyLoading = productLoading || inventoryLoading || allOrdersLoading;

    return (
      <div className="min-h-screen bg-background pt-8 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
             <div>
                 <h1 className="text-3xl font-bold tracking-tight text-foreground">Store Dashboard</h1>
                 <p className="mt-1 text-lg text-muted-foreground">
                    Welcome back, {displayUser?.name || 'Admin'}.
                 </p>
                 {/* WebSocket Status Indicator */}
                 <div className={`flex items-center gap-1.5 text-xs mt-1 transition-colors duration-300 ${
                     isWsConnected
                         ? 'text-green-600 dark:text-green-400'
                         : wsError && wsError !== 'Connecting...'
                           ? 'text-red-600 dark:text-red-400'
                           : 'text-amber-600 dark:text-amber-400'
                 }`}>
                     {isWsConnected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
                     <span>{isWsConnected ? 'Real-time updates active' : (wsError || 'Real-time updates inactive')}</span>
                 </div>
             </div>
             <Button variant="outline" size="sm" onClick={refreshAllData} disabled={anyLoading} className={`transition-opacity ${anyLoading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                 <LoaderIf loading={anyLoading} /> <RefreshCw className={`h-4 w-4 ${anyLoading ? 'hidden' : 'mr-2'}`} /> Refresh Data
             </Button>
          </div>


          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <StatsCard title="Total Revenue" value={allOrdersLoading ? <Skeleton className="h-7 w-32" /> : formatCurrency(stats.revenue)} icon={DollarSign} description={allOrdersLoading ? 'Calculating...' : `From ${stats.orders} orders`} />
            <StatsCard title="Total Orders" value={allOrdersLoading ? <Skeleton className="h-7 w-16"/> : stats.orders} icon={ShoppingBag} description={allOrdersLoading ? 'Loading...' : 'All time fetched'} />
            <StatsCard title="Active Products" value={productLoading ? <Skeleton className="h-7 w-16"/> : adminProducts.length} icon={Boxes} description={productLoading ? 'Loading...' : `${inventoryItems.filter(item => item.stock > 0).length} in stock`} />
          </div>

          {/* Main Tabs */}
          <Tabs defaultValue="overview" className="mb-8">
            {/* Tabs List */}
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 bg-muted rounded-lg p-1 mb-6 overflow-x-auto">
               <TabsTrigger value="overview" className="cursor-pointer data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Overview</TabsTrigger>
               <TabsTrigger value="all_orders" className="cursor-pointer data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">All Orders</TabsTrigger>
               <TabsTrigger value="products" className="cursor-pointer data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Add Product</TabsTrigger>
               <TabsTrigger value="inventory" className="cursor-pointer data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Inventory</TabsTrigger>
               <TabsTrigger value="analytics" className="cursor-pointer data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Analytics</TabsTrigger>
            </TabsList>

            {/* --- Overview Tab --- */}
            <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   <Card>
                       <CardHeader><CardTitle>Revenue Trend</CardTitle><CardDescription>Online vs In-Store (Mock)</CardDescription></CardHeader>
                       <CardContent className="pl-2">
                           <ChartContainer config={revenueChartConfig} className="aspect-auto h-[250px]">
                               <AreaChart accessibilityLayer data={revenueData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                   <defs><linearGradient id="colorOnline" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={chartColors.blue} stopOpacity={0.8}/><stop offset="95%" stopColor={chartColors.blue} stopOpacity={0}/></linearGradient><linearGradient id="colorInStore" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={chartColors.green} stopOpacity={0.8}/><stop offset="95%" stopColor={chartColors.green} stopOpacity={0}/></linearGradient></defs>
                                   <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))"/>
                                   <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickMargin={8}/>
                                   <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `$${value / 1000}k`}/>
                                   <ChartTooltip cursor={{fill: 'hsl(var(--muted)/.5)'}} content={<ChartTooltipContent indicator="dot" formatter={(value) => formatCurrency(value)} />} />
                                   <Area type="monotone" dataKey="InStore" stroke={chartColors.green} fillOpacity={0.6} fill="url(#colorInStore)" strokeWidth={2} name="In-Store"/>
                                   <Area type="monotone" dataKey="Online" stroke={chartColors.blue} fillOpacity={0.6} fill="url(#colorOnline)" strokeWidth={2} name="Online" />
                                   <Legend iconType="circle" wrapperStyle={{fontSize: '12px', paddingTop: '10px'}}/>
                               </AreaChart>
                           </ChartContainer>
                       </CardContent>
                   </Card>
                   <Card>
                       <CardHeader><CardTitle>Top Customers by Spend</CardTitle><CardDescription>Mock Data</CardDescription></CardHeader>
                       <CardContent className="pl-2">
                           <ChartContainer config={customersChartConfig} className="aspect-auto h-[250px]">
                               <RechartsBarChart data={topCustomersData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                    <CartesianGrid horizontal={false} stroke="hsl(var(--border))" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={60} tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--muted-foreground))" />
                                    <ChartTooltip cursor={{fill: 'hsl(var(--muted)/.5)'}} content={<ChartTooltipContent indicator="line" formatter={(value) => formatCurrency(value)} nameKey="name" />} />
                                    <Bar dataKey="value" name="Spent" radius={[0, 4, 4, 0]} barSize={20}>{topCustomersData.map((entry, index) => (<Rectangle key={`cell-${index}`} fill={entry.fill} />))} <LabelList dataKey="value" position="right" offset={8} className="fill-foreground" fontSize={11} formatter={(value) => formatCurrency(value)} /></Bar>
                               </RechartsBarChart>
                           </ChartContainer>
                       </CardContent>
                   </Card>
                </div>
                <AiPredictionCard />
            </TabsContent>

            {/* --- All Orders Tab --- */}
            <TabsContent value="all_orders">
                 <Card>
                    <CardHeader><CardTitle>All Customer Orders</CardTitle><CardDescription>Monitor and update order status.</CardDescription></CardHeader>
                    <CardContent>
                       {allOrdersError && (
                            <div className="mb-4 p-4 border border-destructive bg-destructive/10 text-destructive rounded-md flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3"><AlertCircle className="h-5 w-5 flex-shrink-0" /><span>{allOrdersError}</span></div>
                                <Button variant="destructive" size="sm" onClick={() => fetchAllOrders(true)} className="ml-auto cursor-pointer">Retry</Button>
                            </div>
                        )}
                       <div className="border rounded-md overflow-hidden">
                           <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow><TableHead className="w-[100px] p-3">Order ID</TableHead><TableHead className="p-3">Customer (User ID)</TableHead><TableHead className="p-3">Date</TableHead><TableHead className="p-3 text-center w-[180px]">Status</TableHead><TableHead className="p-3 text-right">Amount</TableHead></TableRow>
                                </TableHeader>
                                <TableBody>
                                   {allOrdersLoading ? renderOrderSkeletons(5) : allOrders.length === 0 && !allOrdersError ? (<TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground"> No orders found. </TableCell></TableRow> ) : (
                                       allOrders.map((order) => {
                                          const isUpdatingStatus = updatingStatusOrderId === order.id;
                                          return (
                                           <TableRow key={order.id} className={`hover:bg-muted/50 transition-opacity ${isUpdatingStatus ? 'opacity-60' : ''}`}>
                                               <TableCell className="p-3 font-mono text-xs font-medium cursor-pointer hover:underline" onClick={() => navigate(`/admin/orders/${order.id}`)} title={`View details for Order #${order.id}`}>#{order.id}</TableCell>
                                               <TableCell className="p-3 font-medium">User ID {order.userId}</TableCell>
                                               <TableCell className="p-3 text-muted-foreground text-xs">{formatDate(order.date)}</TableCell>
                                               <TableCell className="p-3 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Select value={order.status} onValueChange={(newStatus) => handleOrderStatusUpdate(order.id, newStatus)} disabled={isUpdatingStatus || allOrdersLoading}>
                                                            <SelectTrigger className={`h-8 text-xs w-[150px] relative transition-opacity ${isUpdatingStatus ? 'pl-8' : ''} ${isUpdatingStatus || allOrdersLoading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                                                                <LoaderIf loading={isUpdatingStatus} className="h-3 w-3 animate-spin absolute left-2 top-1/2 -translate-y-1/2" /> <SelectValue placeholder="Select status..." />
                                                            </SelectTrigger>
                                                            <SelectContent><SelectGroup><SelectLabel className="text-xs">Update Status</SelectLabel> {ORDER_STATUSES.map((statusOption) => (<SelectItem key={statusOption.value} value={statusOption.value} className="text-xs cursor-pointer"><div className="flex items-center gap-2">{statusOption.icon && <statusOption.icon className="h-3.5 w-3.5 text-muted-foreground" />}<span>{statusOption.label}</span></div></SelectItem>))} </SelectGroup></SelectContent>
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
                  <CardHeader><CardTitle>Inventory Management</CardTitle><CardDescription> Track and update product stock levels. Low stock: {LOW_STOCK_THRESHOLD} units or less.</CardDescription></CardHeader>
                   <CardContent>
                     {inventoryError && (
                        <div className="mb-4 p-4 border border-destructive bg-destructive/10 text-destructive rounded-md flex items-center justify-between gap-3">
                             <div className="flex items-center gap-3"><AlertCircle className="h-5 w-5 flex-shrink-0" /><span>{inventoryError}</span></div>
                            <Button variant="destructive" size="sm" onClick={() => fetchProductsAndInventory(true)} className="ml-auto cursor-pointer">Retry</Button>
                        </div>
                      )}
                     <div className="border rounded-md overflow-hidden">
                       <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow><TableHead className="p-3">Product Name (ID)</TableHead><TableHead className="p-3 text-center w-[100px]">Stock</TableHead><TableHead className="p-3 text-center w-[120px]">Status</TableHead><TableHead className="p-3 text-center w-[240px]">Set New Stock Total</TableHead></TableRow>
                            </TableHeader>
                            <TableBody>
                                {(inventoryLoading || productLoading) && renderInventorySkeletons(5)}
                                {!(inventoryLoading || productLoading) && inventoryItems.length === 0 && !inventoryError && (<TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No products found.</TableCell></TableRow>)}
                                {!(inventoryLoading || productLoading) && inventoryItems.map((item) => {
                                   const stockStatus = getStockStatus(item.stock);
                                   const isUpdating = updatingStockId === item.id;
                                   return (
                                    <TableRow key={item.id} className={`hover:bg-muted/50 transition-opacity ${isUpdating ? 'opacity-60' : ''}`}>
                                           <TableCell className="p-3 font-medium">{item.name} <span className="text-xs text-muted-foreground font-mono ml-1">(ID: {item.id})</span></TableCell>
                                           <TableCell className="p-3 text-center font-semibold text-lg">{item.stock}</TableCell>
                                           <TableCell className="p-3 text-center"><Badge variant={stockStatus.variant} className={`text-xs px-2 py-0.5`}>{stockStatus.text}</Badge></TableCell>
                                           <TableCell className="p-3">
                                                <form onSubmit={(e) => { e.preventDefault(); handleStockUpdateAPI(item.id); }} className="flex justify-center items-center gap-2">
                                                    <Input id={`stock-update-${item.id}`} type="number" min="0" step="1" placeholder="Qty" className="h-9 w-20 text-sm" disabled={isUpdating} required/>
                                                    <Button type="submit" variant="outline" size="icon" className={`h-9 w-9 text-primary hover:text-primary-foreground hover:bg-primary transition-opacity ${isUpdating ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`} disabled={isUpdating} title={`Update stock for ${item.name}`}>
                                                        {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                    </Button>
                                                </form>
                                           </TableCell>
                                       </TableRow>
                                    );
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
                  <CardHeader><CardTitle>Add New Product</CardTitle><CardDescription>Enter product details. Required fields marked <span className="text-destructive">*</span>.</CardDescription></CardHeader>
                  <CardContent>
                    <form onSubmit={handleProductSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2"><Label htmlFor="productName" className={isSubmittingProduct ? 'cursor-not-allowed' : 'cursor-pointer'}>Product Name <span className="text-destructive">*</span></Label><Input id="productName" value={newProductName} onChange={(e) => setNewProductName(e.target.value)} placeholder="e.g., Wireless Ergonomic Mouse" required disabled={isSubmittingProduct}/></div>
                            <div className="space-y-2"><Label htmlFor="productPrice" className={isSubmittingProduct ? 'cursor-not-allowed' : 'cursor-pointer'}>Price (USD) <span className="text-destructive">*</span></Label><Input id="productPrice" type="number" value={newProductPrice} onChange={(e) => setNewProductPrice(e.target.value)} placeholder="e.g., 49.99" step="0.01" min="0" required disabled={isSubmittingProduct}/></div>
                        </div>
                        <div className="space-y-2"><Label htmlFor="productCategory" className={isSubmittingProduct ? 'cursor-not-allowed' : 'cursor-pointer'}>Category <span className="text-destructive">*</span></Label><Input id="productCategory" value={newProductCategory} onChange={(e) => setNewProductCategory(e.target.value)} placeholder="e.g., Electronics, Accessories" required disabled={isSubmittingProduct}/></div>
                        <div className="space-y-2"><Label htmlFor="productDescription" className={isSubmittingProduct ? 'cursor-not-allowed' : 'cursor-pointer'}>Description</Label><Textarea id="productDescription" value={newProductDescription} onChange={(e) => setNewProductDescription(e.target.value)} placeholder="Detailed description of the product..." rows={4} disabled={isSubmittingProduct}/></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2"><Label htmlFor="productSpecifications" className={isSubmittingProduct ? 'cursor-not-allowed' : 'cursor-pointer'}>Specifications</Label><Textarea id="productSpecifications" value={newProductSpecifications} onChange={(e) => setNewProductSpecifications(e.target.value)} placeholder="e.g., Size: 10x5x3 cm\nWeight: 150g\nMaterial: ABS Plastic" rows={3} disabled={isSubmittingProduct}/></div>
                            <div className="space-y-2"><Label htmlFor="productFeatures" className={isSubmittingProduct ? 'cursor-not-allowed' : 'cursor-pointer'}>Key Features</Label><Textarea id="productFeatures" value={newProductFeatures} onChange={(e) => setNewProductFeatures(e.target.value)} placeholder="List key selling points, one per line:\n- Feature 1\n- Feature 2\n- Long battery life" rows={3} disabled={isSubmittingProduct}/></div>
                        </div>
                        <Card className="bg-muted/30 border-dashed">
                            <CardHeader className="pb-3"><CardTitle className="text-base">Product Image <span className="text-destructive">*</span></CardTitle><CardDescription>Choose upload method. URL is recommended.</CardDescription></CardHeader>
                            <CardContent className="space-y-4">
                                <RadioGroup value={imageUploadMethod} onValueChange={handleImageMethodChange} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4" disabled={isSubmittingProduct}>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="url" id="imageUrlMethod" className={isSubmittingProduct ? 'cursor-not-allowed' : 'cursor-pointer'}/><Label htmlFor="imageUrlMethod" className={`flex items-center gap-1 ${isSubmittingProduct ? 'cursor-not-allowed' : 'cursor-pointer'}`}><LinkIcon className="w-4 h-4 mr-1"/>Use Image URL</Label></div>
                                     <div className="flex items-center space-x-2"><RadioGroupItem value="file" id="imageFileMethod" className={isSubmittingProduct ? 'cursor-not-allowed' : 'cursor-pointer'}/><Label htmlFor="imageFileMethod" className={`flex items-center gap-1 ${isSubmittingProduct ? 'cursor-not-allowed' : 'cursor-pointer'}`}><Upload className="w-4 h-4 mr-1"/>Upload File (Disabled)</Label></div>
                                </RadioGroup>
                                {imageUploadMethod === 'url' && ( <div className="space-y-2 pt-2"><Label htmlFor="productImageUrl" className={isSubmittingProduct ? 'cursor-not-allowed' : 'cursor-pointer'}>Image URL <span className="text-destructive">*</span></Label><Input id="productImageUrl" type="url" value={newProductImageUrl} onChange={handleImageUrlChange} placeholder="https://example.com/path/to/your/image.jpg" disabled={isSubmittingProduct} required={imageUploadMethod === 'url'}/>{newProductImageUrl && !isValidHttpUrl(newProductImageUrl) && <p className="text-xs text-destructive">Please enter a valid URL (http/https).</p>}</div> )}
                                {imageUploadMethod === 'file' && ( <div className="space-y-2 pt-2"><Label htmlFor="productImageFile" className={isSubmittingProduct ? 'cursor-not-allowed text-muted-foreground' : 'cursor-pointer'}>Select Image File <span className="text-destructive">*</span></Label><Input id="productImageFile" type="file" onChange={handleImageFileChange} accept="image/png, image/jpeg, image/webp" disabled className="cursor-not-allowed"/>{newProductImageFile && <p className="text-xs text-muted-foreground">Selected: {newProductImageFile.name}</p>}<p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 pt-1"><AlertCircle className="w-3 h-3"/> File upload via API is currently disabled. Please use the URL option above.</p></div> )}
                            </CardContent>
                        </Card>
                        <div className="flex justify-end pt-4"><Button type="submit" disabled={isSubmittingProduct} className={`transition-opacity ${isSubmittingProduct ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}><LoaderIf loading={isSubmittingProduct} /><PackagePlus className={`h-4 w-4 ${isSubmittingProduct ? 'hidden' : 'mr-2'}`} />Add Product</Button></div>
                    </form>
                  </CardContent>
                </Card>
            </TabsContent>

            {/* --- Analytics Tab --- */}
            <TabsContent value="analytics">
                <Card>
                    <CardHeader><CardTitle>Store Analytics</CardTitle><CardDescription>Visual summary (Mock Data)</CardDescription></CardHeader>
                    <CardContent className="space-y-6">
                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <Card className="border shadow-sm">
                              <CardHeader className="p-4 pb-2"><CardTitle className="text-base font-medium">Order Status Distribution</CardTitle></CardHeader>
                              <CardContent className="p-0 pb-4 pl-2 h-[250px]">
                                  <ChartContainer config={statusChartConfig} className="w-full h-full">
                                      <RechartsBarChart data={orderStatusData} margin={{top: 5, right: 20, left: 0, bottom: 5}}>
                                          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} /><YAxis hide /><ChartTooltip cursor={{fill: 'hsl(var(--muted)/.3)'}} content={<ChartTooltipContent indicator="dashed" nameKey="name" />} /><Bar dataKey="value" name="Count" radius={[4, 4, 0, 0]}>{orderStatusData.map((entry) => (<Rectangle key={entry.name} fill={entry.fill} />))}</Bar>
                                      </RechartsBarChart>
                                  </ChartContainer>
                              </CardContent>
                          </Card>
                          <Card className="border shadow-sm">
                              <CardHeader className="p-4 pb-2 items-center"><CardTitle className="text-base font-medium">New Customers Trend</CardTitle></CardHeader>
                              <CardContent className="p-0 pb-4 h-[250px] flex items-center justify-center">
                                  <ChartContainer config={newCustomersChartConfig} className="aspect-square h-[200px]">
                                      <RadarChart data={newCustomersData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                                          <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" nameKey="month" />} /><PolarAngleAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickFormatter={formatMonthAbbreviation} /><PolarGrid gridType='circle' stroke="hsl(var(--border))"/><Radar name="Customers" dataKey="value" stroke={chartColors.violet} fill={chartColors.violet} fillOpacity={0.5} />
                                      </RadarChart>
                                  </ChartContainer>
                              </CardContent>
                          </Card>
                       </div>
                    </CardContent>
                </Card>
            </TabsContent>

          </Tabs>
        </div>
        {/* Chart Colors Style & Select Fix */}
        <style jsx global>{`
            :root { --chart-1: ${chartColors.blue}; --chart-2: ${chartColors.green}; --chart-3: ${chartColors.orange}; --chart-4: ${chartColors.red}; --chart-5: ${chartColors.violet}; }
            .dark { --chart-1: hsl(221.2 80% 65%); --chart-2: hsl(142.1 65% 50%); --chart-3: hsl(24.6 90% 55%); --chart-4: hsl(0 80% 65%); --chart-5: hsl(262.1 80% 68%); }
            .pl-8 > span { padding-left: 0.5rem !important; } /* Fix SelectTrigger padding */
            [disabled] { cursor: not-allowed !important; }
            label[data-disabled="true"] { cursor: not-allowed !important; }
        `}</style>
      </div>
    );
};

export default AdminDashboard;