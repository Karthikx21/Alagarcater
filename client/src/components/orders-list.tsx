import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Eye, Printer, Download, RefreshCw, Search, Trash2, Loader2, X, FileText, CalendarIcon, CreditCard } from "lucide-react";
import { formatCurrency, formatDate, determinePaymentStatus } from "@/lib/utils";
import { useState, useMemo } from "react";
import { generatePDF, printOrder, generateMenuList } from "@/lib/pdf-generator";
import { calculateOrderSummary } from "@/lib/utils";
import { OrderData, SelectedMenuItem, TransformedOrder } from "@/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import PaymentStatusBadge from "./ui/payment-status-badge";
import { useToast } from "@/hooks/use-toast";

interface OrdersListProps {
  onViewOrder?: (orderId: number) => void;
}

interface MenuItem {
  id: number;
  name: string;
  tamilName?: string;
  price: number;
  category: string;
  subcategory?: string;
  type: string;
  description?: string;
  isActive: boolean;
}

export default function OrdersList({ onViewOrder: _onViewOrder }: OrdersListProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: orders = [], isLoading, refetch } = useQuery<TransformedOrder[]>({
    queryKey: ["/api/orders"],
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [filterDate, setFilterDate] = useState("all");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("all");
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // State for fetched details
  const [detailedOrder, setDetailedOrder] = useState<TransformedOrder | null>(null);
  const [selectedMenuItems, setSelectedMenuItems] = useState<SelectedMenuItem[]>([]);
  
  // Payment tracking states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Filtered orders memoization
  const filteredOrders = useMemo(() => {
    let currentOrders = orders;

    if (searchTerm) {
      currentOrders = currentOrders.filter(
        (order) =>
          (order.orderId && order.orderId.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (order.customer && order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filterDate !== "all") {
      const now = new Date();
      currentOrders = currentOrders.filter((order) => {
        const orderDate = new Date(order.createdAt);
        if (filterDate === "today") {
          return (
            orderDate.getDate() === now.getDate() &&
            orderDate.getMonth() === now.getMonth() &&
            orderDate.getFullYear() === now.getFullYear()
          );
        } else if (filterDate === "week") {
          // Adjust to get the start of the current week (Sunday)
          const firstDayOfWeek = new Date(now);
          firstDayOfWeek.setDate(now.getDate() - now.getDay());
          firstDayOfWeek.setHours(0, 0, 0, 0);
          return orderDate >= firstDayOfWeek;
        } else if (filterDate === "month") {
          return (
            orderDate.getMonth() === now.getMonth() &&
            orderDate.getFullYear() === now.getFullYear()
          );
        }
        return true;
      });
    }

    // Apply payment status filter
    if (filterPaymentStatus !== "all") {
      currentOrders = currentOrders.filter((order) => {
        const actualStatus = determinePaymentStatus(order.amountPaid, order.total, order.eventDate);
        return actualStatus === filterPaymentStatus;
      });
    }

    // Apply date range filter if start and/or end date are set
    if (startDate) {
      currentOrders = currentOrders.filter(order => new Date(order.createdAt) >= startDate);
    }
    if (endDate) {
      currentOrders = currentOrders.filter(order => new Date(order.createdAt) <= endDate);
    }

    return currentOrders;
  }, [orders, searchTerm, filterDate, filterPaymentStatus, startDate, endDate]);

  // Fetch full order, customer, and menu items when modal is opened
  const openOrderModal = async (order: TransformedOrder) => {
    setShowModal(true);
    try {
      // Invalidate the queries to ensure we get fresh data
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${order.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${order.id}/payments`] });
      
      // Fetch the latest order data with payments
      const orderResp = await fetch(`/api/orders/${order.id}`);
      const fullOrder: TransformedOrder = await orderResp.json();

      // Fetch the menu items
      const menuResp = await fetch('/api/menu');
      const allMenu: MenuItem[] = await menuResp.json();

      // Always show all items from the order, even if menu item is missing
      const selectedWithQty: SelectedMenuItem[] = fullOrder.selectedItems.map((si: { menuItemId?: number; id?: number; name?: string; tamilName?: string; category?: string; subcategory?: string; type?: string; price: number; quantity: number; isCustom?: boolean }) => {
        const menuItem = allMenu.find((item) => item.id === (si.id || si.menuItemId));
        return {
          id: menuItem?.id || si.menuItemId || si.id || Math.random(),
          name: menuItem?.name || si.name || 'Deleted Item',
          tamilName: menuItem?.tamilName || si.tamilName || '',
          category: menuItem?.category || si.category || '',
          subcategory: menuItem?.subcategory || si.subcategory || '',
          type: menuItem?.type || si.type || '',
          price: si.price || menuItem?.price || 0,
          quantity: si.quantity || 1,
          isCustom: si.isCustom || false,
        };
      });

      setDetailedOrder({
        ...fullOrder,
        selectedItems: selectedWithQty,
      });
      setSelectedMenuItems(selectedWithQty);
    } catch (error) {
      console.error('Error loading order details:', error);
      setSelectedMenuItems([]);
      toast({
        title: "Error",
        description: "Failed to load order details. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewOrder = (orderId: number) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      openOrderModal(order);
    }
  };

  /**
   * Prepares order data for printing or downloading
   * @param orderId The order ID
   * @returns The prepared order data or null if not found
   */
  const prepareOrderData = async (orderId: number): Promise<OrderData | null> => {
    const orderToPrint = orders.find(o => o.id === orderId);
    if (!orderToPrint) return null;
    
    try {
      const orderResp = await fetch(`/api/orders/${orderToPrint.id}`);
      const fullOrder: TransformedOrder = await orderResp.json();

      const menuResp = await fetch('/api/menu');
      const allMenu: MenuItem[] = await menuResp.json();
      
      // Always show all items from the order, even if menu item is missing
      const selectedWithQty: SelectedMenuItem[] = fullOrder.selectedItems.map((si: { menuItemId?: number; id?: number; name?: string; tamilName?: string; category?: string; subcategory?: string; type?: string; price: number; quantity: number; isCustom?: boolean }) => {
        const menuItem = allMenu.find((item) => item.id === (si.id || si.menuItemId));
        return {
          id: menuItem?.id || si.menuItemId || si.id || Math.random(),
          name: menuItem?.name || si.name || 'Deleted Item',
          tamilName: menuItem?.tamilName || si.tamilName || '',
          category: menuItem?.category || si.category || '',
          subcategory: menuItem?.subcategory || si.subcategory || '',
          type: menuItem?.type || si.type || '',
          price: si.price || menuItem?.price || 0,
          quantity: si.quantity || 1,
          isCustom: si.isCustom || false,
        };
      });

      // Calculate summary for printing with precise calculations
      const itemsSubtotal = selectedWithQty.reduce((acc: number, item: SelectedMenuItem) => {
        // Ensure price is a valid number
        const itemPrice = Number(parseFloat(item.price.toString()).toFixed(2));
        
        // Ensure quantity is a valid number
        const quantity = Math.max(1, Number(item.quantity) || 0);
        
        // Calculate item total (price * quantity)
        const itemTotal = Number((itemPrice * quantity).toFixed(2));
        
        // Add to running total
        return Number((acc + itemTotal).toFixed(2));
      }, 0);
      
      // Get order summary
      const summary = calculateOrderSummary(itemsSubtotal);

      // Construct OrderData
      return {
        customer: fullOrder.customer, // Use the fetched customer data directly
        selectedItems: selectedWithQty, // Use the processed menu items
        guestCount: fullOrder.guestCount,
        eventDate: new Date(fullOrder.eventDate).toISOString(), // Ensure eventDate is string for OrderData
        summary: summary,
        orderId: fullOrder.orderId, // Include orderId from fullOrder
        paymentStatus: fullOrder.paymentStatus,
        amountPaid: fullOrder.amountPaid,
        amountDue: fullOrder.amountDue,
      };
    } catch (e) {
      console.error("Failed to prepare order data:", e);
      alert("Failed to prepare data for this order.");
      return null;
    }
  };

  /**
   * Handles printing the order
   * @param orderId The order ID
   */
  const handlePrintOrder = async (orderId: number) => {
    const orderData = await prepareOrderData(orderId);
    if (orderData) {
      printOrder(orderData);
    }
  };
  
  /**
   * Handles downloading the invoice PDF
   * @param orderId The order ID
   */
  const handleDownloadInvoice = async (orderId: number) => {
    const orderData = await prepareOrderData(orderId);
    if (orderData) {
      generatePDF(orderData, 'detailed', false);
    }
  };
  
  /**
   * Handles downloading the menu list without prices
   * @param orderId The order ID
   */
  const handleDownloadMenuList = async (orderId: number) => {
    const orderData = await prepareOrderData(orderId);
    if (orderData) {
      generateMenuList(orderData);
    }
  };

  /**
   * Opens the payment modal for adding a new payment
   */
  const handleOpenPaymentModal = () => {
    if (!detailedOrder) return;
    
    // Reset payment form
    setPaymentAmount("");
    setPaymentMethod("cash");
    setPaymentNotes("");
    setReceiptNumber("");
    setPaymentDate(new Date());
    setShowPaymentModal(true);
  };

  /**
   * Handles payment form submission
   */
  const handlePaymentSubmit = async () => {
    if (!detailedOrder) return;
    
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount.",
        variant: "destructive",
      });
      return;
    }

    if (!paymentMethod) {
      toast({
        title: "Payment Method Required",
        description: "Please select a payment method.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingPayment(true);
    
    try {
      const response = await fetch(`/api/orders/${detailedOrder.id}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount.toString(),
          paymentMethod,
          notes: paymentNotes || undefined,
          receiptNumber: receiptNumber || undefined,
          paymentDate: paymentDate.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process payment');
      }

      // Payment successful - no need to parse response data
      
      toast({
        title: "Payment Recorded",
        description: `Payment of ${formatCurrency(amount)} has been recorded successfully.`,
      });

      // Refresh order data
      await queryClient.invalidateQueries({ queryKey: [`/api/orders/${detailedOrder.id}`] });
      await queryClient.invalidateQueries({ queryKey: [`/api/orders/${detailedOrder.id}/payments`] });
      await queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      
      // Refresh the detailed order in the modal
      const orderResp = await fetch(`/api/orders/${detailedOrder.id}`);
      const updatedOrder: TransformedOrder = await orderResp.json();
      
      setDetailedOrder({
        ...updatedOrder,
        selectedItems: selectedMenuItems,
      });

      // Close the payment modal
      setShowPaymentModal(false);
      
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Failed to record payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedOrders.size) return;
    setDeleting(true);
    try {
      // If only one order is selected, use the single order delete endpoint
      if (selectedOrders.size === 1) {
        const orderId = Array.from(selectedOrders)[0];
        
        const response = await fetch(`/api/orders/${orderId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Failed to delete order: ${errorData.message || response.statusText}${errorData.details ? ` - ${errorData.details}` : ''}`);
        }
      } else {
        // Otherwise use the bulk delete endpoint
        const orderIds = Array.from(selectedOrders);
        
        const response = await fetch('/api/orders/bulk', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: orderIds })
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Failed to delete orders: ${errorData.message || response.statusText}${errorData.details ? ` - ${errorData.details}` : ''}`);
        }
      }
      
      // Clear selection, refresh data, and close dialog
      setSelectedOrders(new Set());
      refetch();
      setShowDeleteConfirm(false);
    } catch (e: unknown) {
      console.error('Error in handleDeleteSelected:', e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
      alert(`Failed to delete selected orders: ${errorMessage}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allOrderIds = filteredOrders.map((order) => order.id);
      setSelectedOrders(new Set(allOrderIds));
    } else {
      setSelectedOrders(new Set());
    }
  };

  const handleOrderSelect = (orderId: number) => {
    setSelectedOrders((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(orderId)) {
        newSelection.delete(orderId);
      } else {
        newSelection.add(orderId);
      }
      return newSelection;
    });
  };

  const isAllSelected = filteredOrders.length > 0 && selectedOrders.size === filteredOrders.length;

  if (isLoading) {
    return (
      <Card className="w-full max-w-6xl mx-auto">
        <CardContent className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto animate-in">
      <Card className="border-2 border-primary/20 shadow-xl bg-gradient-to-br from-white to-primary-light/10 overflow-hidden">
        <CardContent className="p-8">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-r from-primary to-primary-dark rounded-full flex items-center justify-center mr-4 shadow-lg">
              <span className="text-white font-bold text-lg">4</span>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-foreground text-shadow-sm">{t('ordersList.title')}</h2>
              <h3 className="text-lg text-secondary font-tamil mt-1">{t('ordersList.subtitle')}</h3>
            </div>
          </div>

          <div className="space-y-6">
            {/* Filters and Actions */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="flex flex-wrap gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder={t('ordersList.searchPlaceholder') || 'Search orders...'} 
                    className="pl-10 w-full sm:w-[250px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select onValueChange={setFilterDate} defaultValue="all">
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder={t('ordersList.filterByDate') || 'Filter by date'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('ordersList.allDates') || 'All dates'}</SelectItem>
                    <SelectItem value="today">{t('ordersList.today') || 'Today'}</SelectItem>
                    <SelectItem value="week">{t('ordersList.thisWeek') || 'This Week'}</SelectItem>
                    <SelectItem value="month">{t('ordersList.thisMonth') || 'This Month'}</SelectItem>
                  </SelectContent>
                </Select>
                <Select onValueChange={setFilterPaymentStatus} defaultValue="all">
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder={t('ordersList.filterByPayment') || 'Filter by payment'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All Payments') || 'All Payments'}</SelectItem>
                    <SelectItem value="pending">{t('pending') || 'Pending'}</SelectItem>
                    <SelectItem value="partial">{t('partial') || 'Partial'}</SelectItem>
                    <SelectItem value="paid">{t('paid') || 'Paid'}</SelectItem>
                    <SelectItem value="overdue">{t('overdue') || 'Overdue'}</SelectItem>
                  </SelectContent>
                </Select>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full sm:w-[200px] justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : <span className="text-muted-foreground">{t('ordersList.pickStartDate') || 'Pick a start date'}</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full sm:w-[200px] justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : <span className="text-muted-foreground">{t('ordersList.pickEndDate') || 'Pick an end date'}</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Button variant="outline" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t('ordersList.refresh') || 'Refresh'}
                </Button>
              </div>
              {selectedOrders.size > 0 && (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      {t('ordersList.deleting') || 'Deleting...'}
                    </>
                  ) : (
                    `${t('ordersList.deleteSelected') || 'Delete Selected'} (${selectedOrders.size})`
                  )}
                </Button>
              )}
            </div>

            {/* Orders Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b bg-muted/50">
                    <tr className="hover:bg-muted/70 transition-colors border-b">
                      <th className="h-14 px-4 text-left align-middle font-semibold text-foreground w-12">
                        <Checkbox 
                          checked={isAllSelected}
                          onCheckedChange={handleSelectAll}
                          aria-label={t('ordersList.selectAll') || 'Select all orders'}
                        />
                      </th>
                      <th className="h-14 px-4 text-left align-middle font-semibold text-foreground min-w-[120px]">
                        Order ID
                      </th>
                      <th className="h-14 px-4 text-left align-middle font-semibold text-foreground min-w-[160px]">
                        Customer Name
                      </th>
                      <th className="h-14 px-4 text-left align-middle font-semibold text-foreground min-w-[120px]">
                        Order Date
                      </th>
                      <th className="h-14 px-4 text-left align-middle font-semibold text-foreground min-w-[120px]">
                        Items Count
                      </th>
                      <th className="h-14 px-4 text-left align-middle font-semibold text-foreground min-w-[140px]">
                        Total Amount
                      </th>
                      <th className="h-14 px-4 text-left align-middle font-semibold text-foreground min-w-[200px]">
                        Payment Status
                      </th>
                      <th className="h-14 px-4 text-center align-middle font-semibold text-foreground min-w-[200px]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="h-24 text-center text-muted-foreground">
                          <div className="flex flex-col items-center justify-center p-4">
                            <Search className="h-12 w-12 text-muted-foreground/30 mb-2" />
                            <p className="text-lg font-semibold">{t('ordersList.noOrdersFound') || 'No orders found'}</p>
                            {searchTerm && (
                                <p className="text-sm mt-1">{t('ordersList.adjustSearchCriteria') || 'Try adjusting your search criteria'}</p>
                              )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order: TransformedOrder) => (
                        <tr key={order.id} className="hover:bg-muted/30 transition-colors border-b border-border/50">
                          <td className="px-4 py-4">
                            <Checkbox 
                              checked={selectedOrders.has(order.id)}
                              onCheckedChange={() => handleOrderSelect(order.id)}
                              aria-label={`Select order ${order.id}`}
                            />
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-mono text-sm font-semibold text-primary">
                              {order.orderId}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-medium text-foreground">
                              {order.customer.name}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {order.customer.mobile}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm text-foreground">
                              {formatDate(order.createdAt)}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Event: {formatDate(order.eventDate)}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-center">
                              <span className="inline-flex items-center justify-center min-w-[2rem] h-8 px-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                                {order.itemCount}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-semibold text-lg text-foreground">
                              {formatCurrency(Number(order.total))}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Guests: {order.guestCount}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-3">
                              <PaymentStatusBadge
                                status={determinePaymentStatus(order.amountPaid, order.total, order.eventDate)}
                                amountPaid={order.amountPaid}
                                total={order.total}
                                showProgress={true}
                                size="sm"
                              />
                              <div className="space-y-1">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-muted-foreground font-medium">Paid:</span>
                                  <span className="font-semibold text-green-600">
                                    {formatCurrency(Number(order.amountPaid) || 0)}
                                  </span>
                                </div>
                                {order.paymentStatus !== 'paid' && (
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-muted-foreground font-medium">Due:</span>
                                    <span className="font-semibold text-red-600">
                                      {formatCurrency(Number(order.amountDue))}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleViewOrder(order.id)}
                                className="h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary"
                                title="View Order Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handlePrintOrder(order.id)}
                                className="h-9 w-9 p-0 hover:bg-blue-100 hover:text-blue-600"
                                title="Print Invoice"
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDownloadInvoice(order.id)}
                                className="h-9 w-9 p-0 hover:bg-green-100 hover:text-green-600"
                                title="Download Invoice PDF"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDownloadMenuList(order.id)}
                                className="h-9 w-9 p-0 hover:bg-purple-100 hover:text-purple-600"
                                title="Download Menu List"
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => {
                                  setSelectedOrders(new Set([order.id]));
                                  setShowDeleteConfirm(true);
                                }}
                                className="h-9 w-9 p-0 hover:bg-red-100 hover:text-red-600"
                                title="Delete Order"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* View Order Modal */}
          {showModal && detailedOrder && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-background rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
                <div className="p-6 border-b sticky top-0 bg-background z-10 flex justify-between items-center">
                  <h3 className="text-xl font-bold">{t('ordersList.orderDetails') || 'Order Details'}</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowModal(false)} className="h-8 w-8 p-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Order Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold">{t('ordersList.orderInformation') || 'Order Information'}</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('ordersList.orderId') || 'Order ID'}:</span>
                          <span className="font-medium">{detailedOrder.orderId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('ordersList.date') || 'Date'}:</span>
                          <span>{formatDate(detailedOrder.createdAt)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('ordersList.totalAmount') || 'Total Amount'}:</span>
                          <span className="font-medium">{formatCurrency(Number(detailedOrder.total))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('ordersList.paymentStatus') || 'Payment Status'}:</span>
                          <PaymentStatusBadge
                            status={determinePaymentStatus(detailedOrder.amountPaid, detailedOrder.total, detailedOrder.eventDate)}
                            amountPaid={detailedOrder.amountPaid}
                            total={detailedOrder.total}
                            showProgress={false}
                            size="sm"
                          />
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('ordersList.amountPaid') || 'Amount Paid'}:</span>
                          <span className="font-medium">{formatCurrency(Number(detailedOrder.amountPaid) || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('ordersList.amountDue') || 'Amount Due'}:</span>
                          <span className="font-medium">{formatCurrency(Number(detailedOrder.amountDue))}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-semibold">{t('ordersList.customerInformation') || 'Customer Information'}</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('ordersList.name') || 'Name'}:</span>
                          <span className="font-medium">{detailedOrder.customer.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('ordersList.mobile') || 'Mobile'}:</span>
                          <span>{detailedOrder.customer.mobile}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('ordersList.guestCount') || 'Guest Count'}:</span>
                          <span>{detailedOrder.guestCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('ordersList.eventDate') || 'Event Date'}:</span>
                          <span>{formatDate(detailedOrder.eventDate)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Menu Items */}
                  <div>
                    <h4 className="font-semibold mb-4">{t('ordersList.menuItems') || 'Menu Items'}</h4>
                    <div className="overflow-auto max-h-[300px] pr-2 scrollbar-thin">
                      <table className="w-full">
                        <thead className="bg-muted sticky top-0">
                          <tr>
                            <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">{t('ordersList.item') || 'Item'}</th>
                            <th className="text-right py-2 px-3 text-sm font-medium text-muted-foreground">{t('ordersList.price') || 'Price'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {selectedMenuItems.map((item) => (
                            <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                              <td className="py-2 px-3">
                                <div className="font-medium">{item.name}</div>
                                <div className="text-sm text-muted-foreground font-tamil">{item.tamilName}</div>
                              </td>
                              <td className="py-2 px-3 text-right">
                                {formatCurrency((item.price))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {/* Payment Tracking Section */}
                  <div>
                    <h4 className="font-semibold mb-4">{ 'Payment Tracking'}</h4>
                    <div className="bg-accent/20 rounded-lg p-4 border border-border space-y-3">
                      <div className="flex items-center gap-3 mb-2">
                        <PaymentStatusBadge
                          status={determinePaymentStatus(detailedOrder.amountPaid, detailedOrder.total, detailedOrder.eventDate)}
                          amountPaid={detailedOrder.amountPaid}
                          total={detailedOrder.total}
                          showProgress={true}
                          size="lg"
                        />
                        <span className="text-base font-semibold">
                          {determinePaymentStatus(detailedOrder.amountPaid, detailedOrder.total, detailedOrder.eventDate) === 'paid'
                            ? t('paid') || 'Paid'
                            : determinePaymentStatus(detailedOrder.amountPaid, detailedOrder.total, detailedOrder.eventDate) === 'partial'
                            ? t('partial') || 'Partial'
                            : t('due') || 'Due'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">{t('ordersList.amountPaid') || 'Amount Paid'}:</span>
                        <span className="font-medium text-green-600">{formatCurrency(Number(detailedOrder.amountPaid) || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">{t('ordersList.amountDue') || 'Amount Due'}:</span>
                        <span className="font-medium text-red-600">{formatCurrency(Number(detailedOrder.amountDue))}</span>
                      </div>
                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                        <div
                          className={`h-2.5 rounded-full ${Number(detailedOrder.amountPaid) >= Number(detailedOrder.total) ? 'bg-green-500' : 'bg-yellow-500'}`}
                          style={{ width: `${Math.min(100, (Number(detailedOrder.amountPaid) / Number(detailedOrder.total)) * 100)}%` }}
                        ></div>
                      </div>
                      {/* Add Payment Button */}
                      {determinePaymentStatus(detailedOrder.amountPaid, detailedOrder.total, detailedOrder.eventDate) !== 'paid' && (
                        <Button
                          variant="outline"
                          className="mt-3"
                          onClick={handleOpenPaymentModal}
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          {t('ordersList.addPayment') || 'Add Payment'}
                        </Button>
                      )}
                      {/* Payment Records */}
                      {detailedOrder.payments && detailedOrder.payments.length > 0 && (
                        <div className="mt-4">
                          <h5 className="font-semibold mb-3 text-sm text-primary">{t('ordersList.paymentHistory') || 'Payment History'}</h5>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {(detailedOrder.payments as Array<{ id?: number; paymentDate: string; amount: number | string; paymentMethod: string; receiptNumber?: string; notes?: string }>).map((p, idx) => (
                              <div key={p.id || idx} className="bg-white/50 rounded-lg p-3 border border-border/30">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="font-semibold text-green-700">{formatCurrency(Number(p.amount) || 0)}</span>
                                      <span className="text-xs text-muted-foreground">{formatDate(p.paymentDate)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                                        {p.paymentMethod.charAt(0).toUpperCase() + p.paymentMethod.slice(1).replace('_', ' ')}
                                      </span>
                                      {p.receiptNumber && (
                                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                                          #{p.receiptNumber}
                                        </span>
                                      )}
                                    </div>
                                    {p.notes && (
                                      <p className="text-xs text-muted-foreground mt-1 italic">&ldquo;{p.notes}&rdquo;</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="p-6 border-t bg-muted/30 flex justify-end gap-3">
                  <Button variant="outline" onClick={() => handlePrintOrder(detailedOrder.id as number)}>
                    <Printer className="mr-2 h-4 w-4" />
                    {t('ordersList.printOrder') || 'Print Order'}
                  </Button>
                  <Button onClick={() => setShowModal(false)}>
                    {t('ordersList.close') || 'Close'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('ordersList.deleteOrders') || 'Delete Orders'}</AlertDialogTitle>
                <AlertDialogDescription>
                  <p>
                    {selectedOrders.size === 1 ?
                      t('ordersList.confirmDeleteMessage') || 'Are you sure you want to delete this order? This action cannot be undone.' :
                      t('ordersList.ordersDeleted', { count: selectedOrders.size }) || `Are you sure you want to delete ${selectedOrders.size} selected orders? This action cannot be undone.`
                    }
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('cancel') || 'Cancel'}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteSelected}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      {t('ordersList.deleting') || 'Deleting...'}
                    </>
                  ) : (
                    t('delete') || 'Delete'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Payment Modal */}
          <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{t('ordersList.addPayment') || 'Add Payment'}</DialogTitle>
                <DialogDescription>
                  {detailedOrder && (
                    <>
                      Record a payment for order {detailedOrder.orderId}
                      <br />
                      Amount Due: <span className="font-semibold text-red-600">{formatCurrency(Number(detailedOrder.amountDue))}</span>
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right">
                    Amount
                  </Label>
                  <div className="col-span-3 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="pl-8"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="method" className="text-right">
                    Method
                  </Label>
                  <div className="col-span-3">
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="receipt" className="text-right">
                    Receipt #
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="receipt"
                      placeholder="Receipt number (optional)"
                      value={receiptNumber}
                      onChange={(e) => setReceiptNumber(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">
                    Date
                  </Label>
                  <div className="col-span-3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !paymentDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {paymentDate ? format(paymentDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={paymentDate}
                          onSelect={(date) => date && setPaymentDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="notes" className="text-right">
                    Notes
                  </Label>
                  <div className="col-span-3">
                    <Textarea
                      id="notes"
                      placeholder="Additional notes (optional)"
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowPaymentModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handlePaymentSubmit} disabled={isProcessingPayment}>
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Record Payment
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}

