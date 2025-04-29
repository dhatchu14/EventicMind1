import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Import Axios
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Package, ChevronRight, Filter, Search, ShoppingBag, AlertTriangle, Loader2 } from 'lucide-react'; // Added Loader2, AlertTriangle
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Define your API base URL (adjust if needed)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// REMOVE MOCK DATA - We will fetch real data now
// const mockOrdersData = [ ... ];

const OrderHistory = () => {
  const [orders, setOrders] = useState([]); // Raw data from API
  const [filteredOrders, setFilteredOrders] = useState([]); // Data after filtering/sorting
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // State for fetch errors
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // Status is not in our current backend model, so this filter won't work yet
  const [sortOrder, setSortOrder] = useState('newest');
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);

  // --- Data Fetching & Login Check ---
  useEffect(() => {
    const userString = localStorage.getItem('currentUser');
    let currentUserId = null;
    if (userString) {
        try {
            const user = JSON.parse(userString);
            if (user && user.id) {
                currentUserId = user.id;
                setUserId(currentUserId); // Set userId state
            } else {
                 console.error("User data in localStorage is missing 'id'.");
                 setError("Could not identify user.");
                 setLoading(false);
                 // Optionally redirect to login
                 // navigate('/login');
                 return;
            }
        } catch(e) {
            console.error("Error parsing user data from localStorage:", e);
            setError("Error reading user information.");
            setLoading(false);
            // Optionally redirect
            // navigate('/login');
            return;
        }
    } else {
        console.warn("No user found in localStorage. Redirecting to login.");
        // It's best to redirect if no user is found
        navigate('/login');
        return; // Stop execution if not logged in
    }

    // Fetch orders only if we have a userId
    const fetchOrders = async () => {
        if (!currentUserId) return; // Should not happen due to checks above, but good practice

        setLoading(true);
        setError(null);
        console.log(`Fetching orders for user_id=${currentUserId}`);

        try {
            const response = await axios.get(`${API_BASE_URL}/orders/history`, {
                params: { user_id: currentUserId } // Pass user_id as query param
            });
            console.log("API Response:", response.data);
            // Map response data if necessary (e.g., ensure date is Date object)
            const fetchedOrders = response.data.map(order => ({
                ...order,
                // Ensure items and delivery_address are parsed correctly if they came as strings
                // Axios usually handles JSON parsing automatically
                // Add a placeholder status if needed for filtering UI (not in backend yet)
                status: 'processing', // Example placeholder
                date: new Date(order.timestamp) // Convert timestamp string to Date object for sorting
            }));
            setOrders(fetchedOrders);
            setFilteredOrders(fetchedOrders); // Initialize filtered orders
        } catch (err) {
            console.error('Error fetching order history:', err);
            let errorMessage = "Failed to fetch order history.";
            if (err.response) {
                 errorMessage = `Error: ${err.response.data?.detail || err.response.statusText}`;
            } else if (err.request) {
                 errorMessage = "Network error. Could not reach server.";
            } else {
                 errorMessage = `An unexpected error occurred: ${err.message}`;
            }
            setError(errorMessage);
            setOrders([]); // Clear orders on error
            setFilteredOrders([]);
        } finally {
            setLoading(false);
        }
    };

    fetchOrders();

  }, [navigate]); // Run once on mount or when navigate changes

  // --- Filtering & Sorting Logic ---
  useEffect(() => {
    let result = [...orders]; // Start with a fresh copy of the fetched orders

    // Filter by Search Term (ID or Total Price)
    if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        result = result.filter(order =>
            order.id.toString().toLowerCase().includes(lowerSearchTerm) || // Search by Order ID
            order.total_price.toString().includes(lowerSearchTerm) // Search by Total Price
            // Add search by item name if needed (more complex)
            // || order.items.some(item => item.product_name.toLowerCase().includes(lowerSearchTerm))
        );
    }

    // Filter by Status (NOTE: Status field needs to be added to backend Order model/schema first)
    // if (statusFilter !== 'all') {
    //   result = result.filter(order => order.status?.toLowerCase() === statusFilter);
    // }

    // Sort Orders
    result.sort((a, b) => {
        const dateA = a.date.getTime(); // Use the Date object directly
        const dateB = b.date.getTime();
        switch (sortOrder) {
            case 'oldest': return dateA - dateB;
            case 'highest': return b.total_price - a.total_price; // Use correct field name
            case 'lowest': return a.total_price - b.total_price; // Use correct field name
            case 'newest': default: return dateB - dateA;
        }
    });

    setFilteredOrders(result); // Update the state with the processed list

  }, [searchTerm, /* statusFilter, */ sortOrder, orders]); // Rerun when filters, sort order, or the base orders data change

  // --- Helper Functions (Keep as is, but adjust status if needed) ---
  const getStatusBadgeVariant = (status) => {
    // This won't work properly until status is added to backend/frontend data
    switch (status?.toLowerCase()) {
      case 'delivered': return 'success';
      case 'shipped': return 'info';
      case 'processing': return 'warning'; // Current placeholder
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const formatDate = (date) => { // Input is now a Date object
    if (!date || !(date instanceof Date)) return 'N/A';
    try {
      return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
    } catch { return 'Invalid Date'; }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };


  // --- Render Logic ---
  const renderContent = () => {
    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading orders...</span>
            </div>
        );
    }

    if (error) {
        return (
             <Card className="border-dashed border-destructive shadow-none text-center py-8 bg-destructive/10">
                 <CardContent className="flex flex-col items-center">
                    <AlertTriangle className="w-10 h-10 text-destructive mb-3" />
                    <p className="text-sm text-destructive font-medium mb-1">Error Loading Orders</p>
                    <p className="text-xs text-destructive/80 mb-3">{error}</p>
                   {/* Optional: Add a retry button */}
                   {/* <Button variant="destructive" size="sm" onClick={fetchOrders}>Retry</Button> */}
                 </CardContent>
             </Card>
        );
    }

    if (filteredOrders.length === 0) {
        return (
            <Card className="border-dashed border shadow-none text-center py-8">
                <CardContent className="flex flex-col items-center">
                   <ShoppingBag className="w-10 h-10 text-muted-foreground mb-3" />
                   <p className="text-sm text-muted-foreground mb-3">
                     {orders.length > 0 ? 'No orders match your current filters.' : 'You haven\'t placed any orders yet.'}
                   </p>
                   <Button variant="secondary" size="sm" onClick={() => navigate('/shop')}>
                      Browse Products
                   </Button>
                </CardContent>
            </Card>
        );
    }

    // Render the list of orders
    return filteredOrders.map((order) => (
        <Card key={order.id} className="border shadow-sm overflow-hidden bg-card">
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 items-center p-3 text-sm">
                {/* Order ID & Date */}
                <div className="col-span-2 sm:col-span-2 space-y-0.5">
                   <p className="font-semibold text-foreground flex items-center truncate" title={`Order ID: ${order.id}`}>
                       <Package className="h-4 w-4 mr-1.5 text-primary flex-shrink-0" />
                       #{order.id} {/* Show ID clearly */}
                   </p>
                   <p className="text-xs text-muted-foreground flex items-center">
                       <Calendar className="h-3 w-3 mr-1.5 flex-shrink-0" />
                       {formatDate(order.date)} {/* Use the Date object */}
                   </p>
                </div>
                {/* Status (Using Placeholder) */}
                <div className="text-right sm:text-center">
                    <Badge variant={getStatusBadgeVariant(order.status)} className="capitalize text-xs px-1.5 py-0.5 h-fit font-medium">
                      {order.status} {/* Display placeholder status */}
                    </Badge>
                </div>
                {/* Total Amount & Item Count */}
                <div className="text-left sm:text-center">
                    <p className="font-medium text-foreground">{formatCurrency(order.total_price)}</p>
                    <p className="text-xs text-muted-foreground">{order.items?.length || 0} item(s)</p>
                </div>
                {/* Actions */}
                <div className="text-right">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                        title="View Details"
                        // Update navigation if you have a detailed order view page
                        // onClick={() => navigate(`/orders/${order.id}`)}
                        onClick={() => alert(`Order Details:\nID: ${order.id}\nTotal: ${formatCurrency(order.total_price)}\nItems: ${order.items.length}\nAddress: ${order.delivery_address?.street}, ${order.delivery_address?.city}`)} // Simple alert for now
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </Card>
    ));
  };

  // --- Main Render ---
  return (
    <div className="container mx-auto mt-12 px-4 mb-10">
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-semibold mb-4 text-foreground">Order History</h1>

            {/* --- Search and Filter Controls --- */}
            <div className="mb-4 p-3 border rounded-md bg-card shadow-sm">
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-grow">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Search Order ID or Total..."
                            className="pl-8 h-9 text-xs"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            disabled={loading || !!error} // Disable when loading or error
                        />
                    </div>
                    <div className="flex gap-2">
                         {/* Status Filter - Disabled until backend supports it
                         <Select value={statusFilter} onValueChange={setStatusFilter} disabled={loading || !!error || true}>
                            <SelectTrigger className="w-full sm:w-auto h-9 text-xs flex-grow">
                               <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                               <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                               <SelectItem value="all">All Statuses</SelectItem>
                               <SelectItem value="delivered">Delivered</SelectItem>
                               <SelectItem value="shipped">Shipped</SelectItem>
                               <SelectItem value="processing">Processing</SelectItem>
                               <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                        */}
                        <Select value={sortOrder} onValueChange={setSortOrder} disabled={loading || !!error}>
                            <SelectTrigger className="w-full sm:w-[150px] h-9 text-xs flex-grow"> {/* Adjusted width */}
                               <SelectValue placeholder="Sort By" />
                            </SelectTrigger>
                            <SelectContent>
                               <SelectItem value="newest">Date: Newest</SelectItem>
                               <SelectItem value="oldest">Date: Oldest</SelectItem>
                               <SelectItem value="highest">Total: High-Low</SelectItem>
                               <SelectItem value="lowest">Total: Low-High</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* --- Render Order Cards or Loading/Error/Empty State --- */}
            <div className="space-y-3">
                {renderContent()}
            </div>

        </div> {/* END of max-w wrapper */}
    </div> // End of container
  );
};

export default OrderHistory;