import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent /* Removed unused CardDescription, CardHeader, CardTitle */ } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
// import { Separator } from '@/components/ui/separator'; // Separator not used in the compact version
import { Calendar, Package, /* CreditCard, */ ChevronRight, Filter, Search, /* Download, */ ShoppingBag } from 'lucide-react'; // Cleaned up imports
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Mock Data (Keep as is for simulation)
const mockOrdersData = [
    { id: 'ORD-7843', date: '2025-03-28T14:23:45Z', total: 129.99, status: 'delivered', items: 3, paymentMethod: 'Credit Card', shippingAddress: '123 Main St, Anytown, AN 12345' },
    { id: 'ORD-6529', date: '2025-02-15T09:12:30Z', total: 85.50, status: 'shipped', items: 2, paymentMethod: 'PayPal', shippingAddress: '123 Main St, Anytown, AN 12345' },
    { id: 'ORD-9102', date: '2025-03-30T10:05:00Z', total: 45.00, status: 'processing', items: 1, paymentMethod: 'Debit Card', shippingAddress: '456 Oak Ave, Otherplace, OP 67890' },
    { id: 'ORD-5217', date: '2025-01-02T16:45:00Z', total: 210.75, status: 'delivered', items: 4, paymentMethod: 'Credit Card', shippingAddress: '123 Main St, Anytown, AN 12345' },
    { id: 'ORD-3045', date: '2025-03-10T18:55:10Z', total: 15.99, status: 'cancelled', items: 1, paymentMethod: 'Credit Card', shippingAddress: '789 Pine Ln, Somewhere, SW 10112' },
    { id: 'ORD-4188', date: '2024-12-10T11:30:22Z', total: 65.25, status: 'delivered', items: 1, paymentMethod: 'Debit Card', shippingAddress: '123 Main St, Anytown, AN 12345' }
];

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const navigate = useNavigate();

  // --- Data Fetching & Login Check ---
  useEffect(() => {
    const userFromStorage = localStorage.getItem('currentUser');
    if (!userFromStorage) {
      navigate('/login');
      return;
    }
    setTimeout(() => {
      setOrders(mockOrdersData);
      setFilteredOrders(mockOrdersData);
      setLoading(false);
    }, 500);
  }, [navigate]);

  // --- Filtering & Sorting Logic ---
  useEffect(() => {
    let result = orders;
    if (searchTerm) {
      result = result.filter(order =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.total.toString().includes(searchTerm) // Allow searching total too
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter(order => order.status.toLowerCase() === statusFilter);
    }
    result.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        switch (sortOrder) {
            case 'oldest': return dateA - dateB;
            case 'highest': return b.total - a.total;
            case 'lowest': return a.total - b.total;
            case 'newest': default: return dateB - dateA;
        }
    });
    setFilteredOrders([...result]);
  }, [searchTerm, statusFilter, sortOrder, orders]);

  // --- Helper Functions ---
  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return 'success';
      case 'shipped': return 'info';
      case 'processing': return 'warning';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dateString));
    } catch { return 'Invalid Date'; }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  // --- Loading State ---
  if (loading) {
    return (
      // Keep loading state centered in the viewport, not constrained
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"> {/* Adjust min-height as needed */}
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // --- Main Render ---
  return (
    // Container still takes available space for padding
    <div className="container mx-auto mt-12 px-4 mb-10">
        {/* *** ADDED WRAPPER for width constraint *** */}
        <div className="max-w-4xl mx-auto"> {/* Adjust max-w-4xl as needed */}

            <h1 className="text-2xl font-semibold mb-4 text-foreground">Order History</h1>

            {/* --- Search and Filter Controls (Compact) --- */}
            <div className="mb-4 p-3 border rounded-md bg-card shadow-sm">
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-grow">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Search ID or Total..."
                            className="pl-8 h-9 text-xs"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
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
                        <Select value={sortOrder} onValueChange={setSortOrder}>
                            <SelectTrigger className="w-full sm:w-auto h-9 text-xs flex-grow">
                               <SelectValue placeholder="Sort" />
                            </SelectTrigger>
                            <SelectContent>
                               <SelectItem value="newest">Newest</SelectItem>
                               <SelectItem value="oldest">Oldest</SelectItem>
                               <SelectItem value="highest">Price High</SelectItem>
                               <SelectItem value="lowest">Price Low</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* --- Order Cards List (Compact) --- */}
            <div className="space-y-3">
                {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                        <Card key={order.id} className="border shadow-sm overflow-hidden bg-card">
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 items-center p-3">
                                {/* Order ID & Date */}
                                <div className="col-span-2 sm:col-span-2 space-y-0.5">
                                   <p className="text-sm font-semibold text-foreground flex items-center truncate" title={order.id}> {/* Added truncate & title */}
                                       <Package className="h-4 w-4 mr-1.5 text-primary flex-shrink-0" />
                                       {order.id}
                                   </p>
                                   <p className="text-xs text-muted-foreground flex items-center">
                                       <Calendar className="h-3 w-3 mr-1.5 flex-shrink-0" />
                                       {formatDate(order.date)}
                                   </p>
                                </div>
                                {/* Status */}
                                <div className="text-right sm:text-center">
                                    <Badge variant={getStatusBadgeVariant(order.status)} className="capitalize text-xs px-1.5 py-0.5 h-fit font-medium">
                                      {order.status}
                                    </Badge>
                                </div>
                                {/* Total Amount */}
                                <div className="text-left sm:text-center">
                                    <p className="text-sm font-medium text-foreground">{formatCurrency(order.total)}</p>
                                    <p className="text-xs text-muted-foreground">{order.items} item(s)</p>
                                </div>
                                {/* Actions */}
                                <div className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                                        title="View Details"
                                        onClick={() => navigate(`/orders/${order.id}`)}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))
                ) : (
                    // --- No Orders State ---
                    <Card className="border-dashed border shadow-none text-center py-8">
                        <CardContent className="flex flex-col items-center">
                           <ShoppingBag className="w-10 h-10 text-muted-foreground mb-3" />
                           <p className="text-sm text-muted-foreground mb-3">No orders match your criteria.</p>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate('/shop')}
                          >
                            Browse Products
                          </Button>
                        </CardContent>
                    </Card>
                )}
            </div>

        </div> {/* *** END of max-w wrapper *** */}
    </div> // End of container
  );
};

export default OrderHistory;