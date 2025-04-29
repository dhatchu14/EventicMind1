// OrderHistory.jsx
import React, { useEffect, useState, useCallback } from 'react';
// Removed useNavigate from here as it's no longer used for the login redirect
import axiosInstance from '../api/axiosInstance'; // Assuming you have this configured
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Package, ChevronRight, Filter, Search, ShoppingBag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// Added useNavigate back for navigating to order details
import { useNavigate } from 'react-router-dom';


const OrderHistory = () => {
  const [orders, setOrders] = useState([]); // State for all fetched orders
  const [filteredOrders, setFilteredOrders] = useState([]); // State for displayed orders (after filter/sort)
  const [loading, setLoading] = useState(true); // Loading state for API call
  const [error, setError] = useState(null); // Error state for API call
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  // Keep useNavigate for navigating to order details
  const navigate = useNavigate();

  // --- Helper Functions (Keep as is) ---
  const getStatusBadgeVariant = (status) => { /* ... */ };
  const formatDate = (dateString) => { /* ... */ };
  const formatCurrency = (amount) => { /* ... */ };

  // --- Data Fetching using Axios ---
  const fetchOrderHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    console.log("OrderHistory: Fetching order history...");

    try {
      const response = await axiosInstance.get('/orders');
      console.log("OrderHistory: API Response:", response.data);

      // **IMPORTANT**: Adapt this based on your actual API response structure
      const fetchedOrders = response.data; // Adjust if data is nested, e.g., response.data.orders
      if (!Array.isArray(fetchedOrders)) {
         throw new Error("Received invalid order data structure from server.");
      }

      const processedOrders = fetchedOrders.map(order => ({
          ...order,
          // Remap fields if necessary (e.g., created_at -> date)
          date: order.created_at || order.date,
          total: order.total,
          status: order.status,
          id: order.id,
          // Attempt to get item count if available
          items: order.items?.length || 1, // Default or calculate if possible
        }));

      setOrders(processedOrders);
      // setFilteredOrders(processedOrders); // Filter/Sort useEffect will handle this
      console.log(`OrderHistory: Fetched ${processedOrders.length} orders.`);

    } catch (err) {
      console.error("OrderHistory: Failed to fetch order history:", err);
      const errorMsg = err.response?.data?.detail || err.message || "Could not load order history.";
      setError(errorMsg);
      setOrders([]); // Clear orders on error
      // setFilteredOrders([]); // Filter/Sort useEffect will handle this
    } finally {
      setLoading(false);
      console.log("OrderHistory: Finished fetching order history.");
    }
  }, []); // Empty dependency array is correct here

  // --- Initial Data Fetch ---
  // Removed the localStorage check and redirect.
  // Assumes ProtectedRoute handles authentication before rendering this component.
  useEffect(() => {
    console.log("OrderHistory: Component mounted, calling fetchOrderHistory.");
    fetchOrderHistory();
  }, [fetchOrderHistory]); // Dependency array includes the memoized fetch function

  // --- Filtering & Sorting Logic (Client-side - Keep as is) ---
  useEffect(() => {
    console.log("OrderHistory: Applying filters/sort:", { searchTerm, statusFilter, sortOrder });
    let result = [...orders]; // Work on a copy of the fetched orders

    // Apply filtering logic (as before)
    if (searchTerm) { /* ... filter by search ... */ }
    if (statusFilter !== 'all') { /* ... filter by status ... */ }

    // Apply sorting logic (as before)
    result.sort((a, b) => { /* ... sorting logic ... */ });

    setFilteredOrders(result); // Update the displayed list
    console.log("OrderHistory: Filtered/Sorted orders count:", result.length);
  }, [searchTerm, statusFilter, sortOrder, orders]); // Re-run when filters, sort, or base orders change

  // --- Loading State (Keep as is) ---
  if (loading) { /* ... return loading indicator ... */ }

   // --- Error State (Keep as is) ---
   if (error) { /* ... return error message with retry button ... */ }

  // --- Main Render (Existing UI structure - No changes needed here) ---
  return (
    <div className="container mx-auto mt-12 px-4 mb-10">
        <div className="max-w-4xl mx-auto"> {/* Existing width constraint */}
            <h1 className="text-2xl font-semibold mb-4 text-foreground">Order History</h1>
            {/* --- Search and Filter Controls (Existing UI) --- */}
            <div className="mb-4 p-3 border rounded-md bg-card shadow-sm"> {/* ... */} </div>
            {/* --- Order Cards List (Existing UI) --- */}
            <div className="space-y-3">
                {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                        // Using existing Card structure and logic
                        <Card key={order.id || `order-${Math.random()}`} className="border shadow-sm overflow-hidden bg-card">
                             <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 items-center p-3">
                                 {/* Order ID & Date */}
                                 <div className="col-span-2 sm:col-span-2 space-y-0.5">
                                    <p className="text-sm font-semibold ... truncate" title={order.id}>
                                        <Package className="h-4 w-4 mr-1.5 ..."/>{order.id || 'N/A'}
                                    </p>
                                    <p className="text-xs text-muted-foreground ...">
                                        <Calendar className="h-3 w-3 mr-1.5 ..."/>{formatDate(order.date)}
                                    </p>
                                 </div>
                                 {/* Status */}
                                 <div className="text-right sm:text-center">
                                     <Badge variant={getStatusBadgeVariant(order.status)} className="...">
                                       {order.status || 'Unknown'}
                                     </Badge>
                                 </div>
                                 {/* Total Amount & Item Count */}
                                 <div className="text-left sm:text-center">
                                     <p className="text-sm font-medium ...">{formatCurrency(order.total)}</p>
                                     {order.items && <p className="text-xs text-muted-foreground">{order.items} item(s)</p>}
                                 </div>
                                 {/* Actions Button */}
                                 <div className="text-right">
                                     {order.id && (
                                         <Button variant="ghost" size="sm" className="..." title="View Details" onClick={() => navigate(`/orders/${order.id}`)}>
                                             <ChevronRight className="h-4 w-4" />
                                         </Button>
                                     )}
                                 </div>
                             </div>
                         </Card>
                    ))
                ) : (
                    // --- No Orders State (Existing UI) ---
                    <Card className="border-dashed ..."> {/* ... */} </Card>
                )}
            </div>
        </div> {/* End of max-w wrapper */}
    </div> // End of container
  );
};

export default OrderHistory;