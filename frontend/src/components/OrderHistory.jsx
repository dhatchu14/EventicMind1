// OrderHistory.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance'; // Assuming you have this configured
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CalendarDays,
  Package,
  ChevronRight,
  Filter,
  Search,
  ShoppingBag,
  AlertCircle,
  ListOrdered,
  DollarSign
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from "@/components/ui/skeleton";

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const navigate = useNavigate();

  // --- Helper Functions ---
  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return 'success';
      case 'shipped': return 'info';
      case 'processing': return 'warning';
      case 'pending_cod': return 'secondary';
      case 'pending': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusText = (status) => {
     if (!status) return 'Unknown';
     return status.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
  }

  const formatDate = (dateString) => {
    if (!dateString) return '--';
    try {
      return new Intl.DateTimeFormat('en-US', {
          year: 'numeric', month: 'short', day: 'numeric',
          hour: 'numeric', minute: '2-digit', hour12: true
      }).format(new Date(dateString));
    } catch { return 'Invalid Date'; }
  };

  const formatCurrency = (amount) => {
    const numericAmount = Number(amount);
    if (isNaN(numericAmount)) return '--';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numericAmount);
  };

  // --- Data Fetching ---
  const fetchOrderHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    console.log("OrderHistory: Fetching order history...");
    try {
      const response = await axiosInstance.get('/orders');
      console.log("OrderHistory: API Response:", response.data);
      const fetchedOrders = response.data;
      if (!Array.isArray(fetchedOrders)) {
         throw new Error("Received invalid order data structure from server.");
      }
      const processedOrders = fetchedOrders.map(order => ({
          id: order.id,
          date: order.created_at || order.date,
          total: order.total,
          status: order.status || 'unknown',
          itemCount: order.item_count || order.items?.length || null,
        }));
      setOrders(processedOrders);
    } catch (err) {
      console.error("OrderHistory: Failed to fetch order history:", err);
      const errorMsg = err.response?.data?.detail || err.message || "Could not load order history.";
      setError(errorMsg);
      setOrders([]);
    } finally {
      setTimeout(() => setLoading(false), 300);
      console.log("OrderHistory: Finished fetching order history.");
    }
  }, []);

  // --- Initial Data Fetch ---
  useEffect(() => {
    console.log("OrderHistory: Component mounted, calling fetchOrderHistory.");
    fetchOrderHistory();
  }, [fetchOrderHistory]);

  // --- Filtering & Sorting ---
  useEffect(() => {
    console.log("OrderHistory: Applying filters/sort:", { searchTerm, statusFilter, sortOrder });
    let result = [...orders];
    if (searchTerm) {
      result = result.filter(order =>
        order.id?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.total?.toString().includes(searchTerm)
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter(order => order.status?.toLowerCase() === statusFilter);
    }
    result.sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        const totalA = Number(a.total) || 0;
        const totalB = Number(b.total) || 0;
        switch (sortOrder) {
            case 'oldest': return dateA - dateB;
            case 'highest': return totalB - totalA;
            case 'lowest': return totalA - totalB;
            case 'newest': default: return dateB - dateA;
        }
    });
    setFilteredOrders(result);
    console.log("OrderHistory: Filtered/Sorted orders count:", result.length);
  }, [searchTerm, statusFilter, sortOrder, orders]);

  // --- Loading Skeleton ---
  const renderSkeletons = (count = 3) => (
      Array.from({ length: count }).map((_, index) => (
        <Card key={`skeleton-${index}`} className="border shadow-sm overflow-hidden">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2 flex-grow">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 flex-shrink-0">
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-8 w-8 rounded-md" />
              </div>
          </CardContent>
        </Card>
      ))
  );

  // --- Main Render ---
  return (
    <div className="container mx-auto mt-8 sm:mt-12 px-4 mb-16">
        <div className="max-w-5xl mx-auto"> {/* Parent 1: max-width wrapper */}

            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Order History</h1>
                <p className="text-muted-foreground">Review your past orders and their status.</p>
            </div>

            {/* Filter and Search Section Card */}
            <Card className="mb-6 bg-card border shadow-sm">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                       <Filter className="h-5 w-5"/>
                       Filter & Sort Orders
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Search */}
                        <div className="relative md:col-span-1">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                           <Input
                               placeholder="Search by Order ID or Total..."
                               className="pl-9"
                               value={searchTerm}
                               onChange={(e) => setSearchTerm(e.target.value)}
                               aria-label="Search orders"
                           />
                       </div>
                        {/* Status Filter */}
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                           <SelectTrigger aria-label="Filter by status">
                               <SelectValue placeholder="Filter by Status" />
                           </SelectTrigger>
                           <SelectContent>
                               <SelectItem value="all">All Statuses</SelectItem>
                               <SelectItem value="delivered">Delivered</SelectItem>
                               <SelectItem value="shipped">Shipped</SelectItem>
                               <SelectItem value="processing">Processing</SelectItem>
                               <SelectItem value="pending_cod">Pending COD</SelectItem>
                               <SelectItem value="pending">Pending</SelectItem>
                               <SelectItem value="cancelled">Cancelled</SelectItem>
                           </SelectContent>
                        </Select>
                         {/* Sort Order */}
                        <Select value={sortOrder} onValueChange={setSortOrder}>
                           <SelectTrigger aria-label="Sort orders">
                               <SelectValue placeholder="Sort By" />
                           </SelectTrigger>
                           <SelectContent>
                               <SelectItem value="newest">Date: Newest First</SelectItem>
                               <SelectItem value="oldest">Date: Oldest First</SelectItem>
                               <SelectItem value="highest">Total: High to Low</SelectItem>
                               <SelectItem value="lowest">Total: Low to High</SelectItem>
                           </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Conditional Rendering: Loading, Error, List/No Orders */}
            {loading ? (
                // Loading State
                <div className="space-y-4">
                    {renderSkeletons()}
                </div>
            ) : error ? (
                // Error State
                <Card className="border-destructive bg-destructive/10">
                   <CardContent className="p-6 flex flex-col items-center text-center">
                       <AlertCircle className="h-10 w-10 text-destructive mb-3"/>
                       <p className="font-semibold text-destructive mb-2">Failed to load orders</p>
                       <p className="text-sm text-destructive/80 mb-4">{error}</p>
                       <Button variant="destructive" size="sm" onClick={fetchOrderHistory}>
                           Retry
                       </Button>
                   </CardContent>
                </Card>
            ) : (
                // Order List or No Orders Message State
                <div className="space-y-4">
                    {filteredOrders.length > 0 ? (
                        // Map over orders to display them
                        filteredOrders.map((order) => (
                            <Card key={order.id || `order-${Math.random()}`} className="border shadow-sm overflow-hidden hover:bg-muted/50 transition-colors">
                                <CardContent
                                    className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-y-3 gap-x-4 cursor-pointer"
                                    onClick={() => order.id && navigate(`/orders/${order.id}`)}
                                    role="link"
                                    tabIndex={0}
                                    onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && order.id && navigate(`/orders/${order.id}`)}
                                >
                                    {/* Left Section: ID and Date */}
                                    <div className="flex-shrink-0 space-y-1 min-w-0">
                                        <p className="text-sm font-semibold text-foreground flex items-center gap-2 truncate" title={`Order ID: ${order.id}`}>
                                            <Package className="h-4 w-4 text-primary flex-shrink-0" />
                                            <span className="truncate">Order #{order.id || 'N/A'}</span>
                                        </p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                                            <CalendarDays className="h-3.5 w-3.5 flex-shrink-0" />
                                            {formatDate(order.date)}
                                        </p>
                                    </div>

                                    <Separator orientation="vertical" className="hidden sm:block h-10 mx-2" />

                                    {/* Right Section: Status, Total, Items, Button */}
                                    <div className="flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-end gap-x-6 gap-y-2 flex-grow">
                                        {/* Status */}
                                        <div className="flex items-center" title={`Status: ${getStatusText(order.status)}`}>
                                            <Badge variant={getStatusBadgeVariant(order.status)} className="capitalize text-xs px-2 py-0.5 h-fit font-medium">
                                                {getStatusText(order.status)}
                                            </Badge>
                                        </div>

                                         {/* Item Count (Optional) */}
                                         {order.itemCount != null && ( // Check for null/undefined explicitly
                                             <div className="text-sm text-muted-foreground flex items-center gap-1.5" title={`${order.itemCount} items`}>
                                                <ListOrdered className="h-4 w-4" />
                                                <span>{order.itemCount}</span>
                                                <span className="hidden sm:inline">item(s)</span>
                                            </div>
                                        )}

                                        {/* Total Amount */}
                                        <div className="text-sm font-medium text-foreground flex items-center gap-1.5" title="Order Total">
                                           <DollarSign className="h-4 w-4 text-muted-foreground"/>
                                           {formatCurrency(order.total)}
                                        </div>

                                        {/* Action Button (Icon Only) */}
                                        <div className="hidden sm:block ml-2">
                                            {order.id && ( // Ensure ID exists before showing button
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" aria-label="View Order Details">
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        // No Orders State
                        <Card className="border-dashed border shadow-none">
                            <CardContent className="py-12 flex flex-col items-center text-center">
                               <ShoppingBag className="w-12 h-12 text-muted-foreground mb-4" />
                               <p className="text-lg font-medium text-foreground mb-1">
                                   {orders.length === 0 ? "No Orders Yet" : "No Matching Orders"}
                               </p>
                               <p className="text-sm text-muted-foreground mb-5 px-4">
                                   {orders.length === 0 ? "You haven't placed any orders. Start shopping to see them here." : "Try adjusting your search or filter criteria."}
                               </p>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => navigate('/shop')}
                              >
                                {orders.length === 0 ? "Start Shopping" : "Browse Products"}
                              </Button>
                            </CardContent>
                        </Card>
                    )}
                </div> // Closing tag for the space-y-4 div
            )} {/* End of conditional rendering block */}

        </div> {/* Closing tag for Parent 1: max-w wrapper */}
    </div> // Closing tag for the top-level container div
  ); // Closing tag for the return statement's parentheses
}; // Closing tag for the component function

export default OrderHistory;