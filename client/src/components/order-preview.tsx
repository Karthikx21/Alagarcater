import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, PrinterCheck, Save, FileText, Loader2, List, FileBarChart, FileSpreadsheet, DollarSign } from "lucide-react";
import { CustomerData, SelectedMenuItem, OrderData } from "@/types";
import { formatCurrency, formatDate, calculateOrderSummary, generateOrderId } from "@/lib/utils";
import { printOrder, generateMenuList, generateCategoryInvoice, generateItemizedInvoice } from "@/lib/pdf-generator";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import OrderPaymentSection from "./order-payment-section";

interface OrderPreviewProps {
  customerData: CustomerData;
  selectedItems: SelectedMenuItem[];
  onBack: () => void;
  onComplete: () => void;
}

export default function OrderPreview({ customerData, selectedItems, onBack, onComplete }: OrderPreviewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  /**
   * Calculate order summary with precise calculations
   */
  const summary = useMemo(() => {
    // Ensure guest count is a valid number
    const guestCount = Math.max(1, Number(customerData.guestCount) || 0);
    
    // Calculate subtotal with precise calculations
    const itemsSubtotal = selectedItems.reduce((acc, item) => {
      // Ensure price is a valid number
      const itemPrice = Number(parseFloat(item.price.toString()).toFixed(2));
      
      // Use item quantity if available, otherwise use guest count
      const quantity = Number(item.quantity || guestCount);
      
      // Calculate item total (price * quantity)
      const itemTotal = Number((itemPrice * quantity).toFixed(2));
      
      // Add to running total
      return Number((acc + itemTotal).toFixed(2));
    }, 0);
    
    // Return order summary
    return calculateOrderSummary(itemsSubtotal);
  }, [selectedItems, customerData.guestCount]);

  const orderId = useMemo(() => generateOrderId(), []);

  const orderData = useMemo<OrderData>(() => ({
    customer: customerData,
    selectedItems: selectedItems.map(item => ({
      ...item,
      quantity: item.quantity || customerData.guestCount
    })),
    guestCount: customerData.guestCount,
    eventDate: customerData.eventDate,
    summary: summary,
    orderId: orderId,
    paymentStatus: "due",
    amountPaid: "0.00",
    amountDue: summary.total.toFixed(2)
  }), [customerData, selectedItems, summary, orderId]);

  const saveOrderMutation = useMutation({
    mutationFn: async () => {
      try {
        // First create customer
        const customerResponse = await apiRequest("POST", "/api/customers", {
          name: customerData.name,
          tamilName: customerData.tamilName,
          mobile: customerData.mobile,
          address: customerData.address
        });
        const customer = await customerResponse.json();
        if (!customer || !customer.id) {
          throw new Error("Failed to create customer: Invalid response from server");
        }

        // Then create order
        const orderPayload = {
          customerId: customer.id,
          guestCount: customerData.guestCount,
          eventDate: new Date(customerData.eventDate).toISOString(),
          selectedItems: selectedItems.map(item => ({
            menuItemId: item.id,
            quantity: customerData.guestCount,
            price: Number(item.price)
          })),
          subtotal: summary.subtotal.toFixed(2),
          serviceCharge: "0.00", // Service charge has been removed
          gst: summary.gst.toFixed(2),
          total: summary.total.toFixed(2),
          status: "pending",
          paymentStatus: "due",
          amountPaid: "0.00",
          amountDue: summary.total.toFixed(2),
          orderId: orderId,
          summary: summary,
        };
        
        const orderResponse = await apiRequest("POST", "/api/orders", orderPayload);
        
        const responseText = await orderResponse.text();
        
        if (!orderResponse.ok) {
          let errorMessage = "Order creation failed";
          try {
            const errorData = JSON.parse(responseText);
            if (errorData.errors) {
              // Format validation errors
              errorMessage = "Validation errors:\n" + errorData.errors.map((err: any) => 
                `${err.path.join('.')}: ${err.message}`
              ).join('\n');
            } else {
              errorMessage = errorData.message || errorData.error || responseText;
            }
          } catch {
            errorMessage = responseText;
          }
          throw new Error(errorMessage);
        }
        
        const orderData = JSON.parse(responseText);
        if (!orderData || !orderData.orderId) {
          throw new Error("Failed to create order: Invalid response from server");
        }
        return orderData;
      } catch (error: any) {
        console.error("Detailed error in saveOrderMutation:", {
          error,
          message: error?.message,
          stack: error?.stack,
          response: error?.response
        });
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Order Saved",
        description: `Order #${data.orderId} has been successfully saved.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      onComplete();
    },
    onError: (error: any) => {
      console.error("Order save error details:", {
        error,
        message: error?.message,
        stack: error?.stack,
        response: error?.response
      });
      toast({
        title: "Error Saving Order",
        description: error?.message || "Failed to save order. Please check the console for details.",
        variant: "destructive",
      });
    },
  });

  /**
   * Handles printing the order
   */
  const handlePrint = () => {
    printOrder(orderData);
  };

  
  /**
   * Handles downloading the menu list without prices
   */
  const handleDownloadMenuList = () => {
    generateMenuList(orderData);
  };
  
  /**
   * Handles generating a category-wise invoice (Format A)
   * @param forPrint Whether to print or download
   */
  const handleCategoryInvoice = (forPrint: boolean = false) => {
    generateCategoryInvoice(orderData, forPrint);
  };
  
  /**
   * Handles generating an itemized invoice (Format B)
   * @param forPrint Whether to print or download
   */
  const handleItemizedInvoice = (forPrint: boolean = false) => {
    generateItemizedInvoice(orderData, forPrint);
  };

  const handleSaveOrder = () => {
    saveOrderMutation.mutate();
  };

  return (
    <div className="w-full max-w-7xl mx-auto animate-in">
      <Card className="border-2 border-primary/30 shadow-card bg-gradient-to-br from-card to-primary-light/10 overflow-hidden">
        <CardContent className="p-8">
          <div className="flex items-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-r from-primary to-primary-dark rounded-full flex items-center justify-center mr-4 shadow-lg">
              <span className="text-white font-bold text-xl">3</span>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-foreground">Order Preview</h2>
              <h3 className="text-lg text-muted-foreground font-tamil mt-1">ஆர்டர் முன்னோட்டம்</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Customer Details and Payment */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              {/* Customer Details Card */}
              <div className="bg-card rounded-lg border-2 border-border p-5 shadow-card">
                <h3 className="text-lg font-bold mb-4 pb-2 border-b-2 border-border text-primary flex items-center">
                  <span className="mr-2">👤</span> Customer Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Name</p>
                    <p className="font-semibold text-foreground">{customerData.name}</p>
                    {customerData.tamilName && (
                      <p className="text-sm font-tamil text-muted-foreground mt-1">{customerData.tamilName}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Mobile</p>
                    <p className="font-semibold text-foreground">{customerData.mobile}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Address</p>
                    <p className="font-semibold text-foreground">{customerData.address}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Event Date</p>
                    <p className="font-semibold text-foreground">{formatDate(customerData.eventDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Guest Count</p>
                    <p className="font-semibold text-foreground bg-accent/50 px-3 py-1 rounded-md inline-block">{customerData.guestCount}</p>
                  </div>
                </div>
              </div>
              
              {/* Payment Section Card */}
              {saveOrderMutation.isSuccess && saveOrderMutation.data ? (
                <OrderPaymentSection 
                  orderId={saveOrderMutation.data.id}
                  orderTotal={summary.total.toFixed(2)}
                  amountPaid={saveOrderMutation.data.amountPaid || "0.00"}
                  amountDue={saveOrderMutation.data.amountDue || summary.total.toFixed(2)}
                  paymentStatus={saveOrderMutation.data.paymentStatus || "due"}
                  payments={saveOrderMutation.data.payments}
                  onPaymentAdded={() => {
                    // Invalidate all related queries to ensure data is refreshed
                    queryClient.invalidateQueries({ queryKey: [`/api/orders/${saveOrderMutation.data.id}`] });
                    queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
                    
                    // Force refetch after a short delay
                    setTimeout(() => {
                      queryClient.refetchQueries({ queryKey: [`/api/orders/${saveOrderMutation.data.id}`] });
                      queryClient.refetchQueries({ queryKey: ["/api/orders"] });
                    }, 300);
                  }}
                />
              ) : (
                <Card className="border-2 border-primary/20 shadow-md">
                  <CardHeader className="bg-muted/50 pb-3">
                    <CardTitle className="flex items-center justify-between text-base">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-primary" />
                        <span>Payment Information</span>
                      </div>
                      <div className="text-sm font-normal">
                        <span className="text-muted-foreground mr-2">Balance:</span>
                        <span className="text-red-600 font-bold">
                          {formatCurrency(summary.total)}
                        </span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4 text-amber-800 text-sm">
                      <p className="flex items-center">
                        <span className="mr-2">ℹ️</span>
                        Save the order first to enable payment tracking
                      </p>
                    </div>
                    
                    <div className="space-y-3 mt-4">
                      <div className="flex justify-between items-center border-t border-border pt-3">
                        <span className="font-medium text-sm">Payment Status:</span>
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">Due</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">Amount Paid:</span>
                        <span className="font-semibold">{formatCurrency(0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">Amount Due:</span>
                        <span className="font-semibold text-red-600">{formatCurrency(summary.total)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column: Order Summary */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-lg border-2 border-border p-5 shadow-card h-full">
                <div className="flex justify-between items-center mb-4 pb-2 border-b-2 border-border">
                  <h3 className="text-lg font-bold text-primary flex items-center">
                    <span className="mr-2">📋</span> Order Summary
                  </h3>
                  <div className="text-sm font-medium bg-accent/50 px-3 py-1 rounded-md">
                    Order ID: <span className="font-bold">{orderId}</span>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {/* Menu Items */}
                  <div>
                    <h4 className="text-base font-semibold mb-3 flex items-center">
                      <List className="mr-2 h-4 w-4 text-primary" />
                      Selected Menu Items <span className="ml-2 text-xs text-muted-foreground">({selectedItems.length} items)</span>
                    </h4>
                    <div className="overflow-auto max-h-[250px] pr-2 scrollbar-thin border border-border rounded-md">
                      <table className="w-full">
                        <thead className="bg-muted sticky top-0 shadow-sm">
                          <tr>
                            <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Item</th>
                            <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Price</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {selectedItems.map((item) => (
                            <tr key={item.id.toString()} className="hover:bg-accent/20 transition-colors">
                              <td className="py-2 px-3">
                                <div className="font-medium text-sm text-foreground">{item.name}</div>
                                {item.tamilName && (
                                  <div className="text-xs text-muted-foreground font-tamil mt-0.5">{item.tamilName}</div>
                                )}
                                <div className="text-xs text-muted-foreground mt-1">
                                  {item.type === 'veg' ? (
                                    <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded-full">Veg</span>
                                  ) : (
                                    <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-0.5 rounded-full">Non-Veg</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2 px-3 text-right">
                                <div className="font-medium text-sm text-primary">{formatCurrency(item.price)}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  × {customerData.guestCount} guests
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Pricing Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Invoice Summary */}
                    <div className="bg-accent/20 rounded-lg p-4 border border-border">
                      <h4 className="text-base font-semibold mb-3 pb-1 border-b border-border flex items-center">
                        <FileText className="mr-2 h-4 w-4 text-primary" />
                        Invoice Summary
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground text-sm">Subtotal</span>
                          <span className="font-medium text-sm">{formatCurrency(summary.subtotal)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground text-sm">Guest Count</span>
                          <span className="font-medium text-sm">{customerData.guestCount}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground text-sm">Total Items</span>
                          <span className="font-medium text-sm">{selectedItems.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground text-sm">GST (18%)</span>
                          <span className="font-medium text-sm">{formatCurrency(summary.gst)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 mt-1 border-t border-border">
                          <span className="font-bold text-sm">Total</span>
                          <span className="font-bold text-base text-primary">{formatCurrency(summary.total)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Payment Status */}
                    <div className="bg-accent/20 rounded-lg p-4 border border-border">
                      <h4 className="text-base font-semibold mb-3 pb-1 border-b border-border flex items-center">
                        <DollarSign className="mr-2 h-4 w-4 text-primary" />
                        Payment Status
                      </h4>
                      
                      {saveOrderMutation.isSuccess && saveOrderMutation.data ? (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground text-sm">Status</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              saveOrderMutation.data.paymentStatus === "paid" 
                                ? "bg-green-100 text-green-800" 
                                : saveOrderMutation.data.paymentStatus === "partial" 
                                  ? "bg-amber-100 text-amber-800" 
                                  : "bg-red-100 text-red-800"
                            }`}>
                              {saveOrderMutation.data.paymentStatus === "paid" 
                                ? "Paid" 
                                : saveOrderMutation.data.paymentStatus === "partial" 
                                  ? "Partial" 
                                  : "Due"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground text-sm">Amount Paid</span>
                            <span className="font-medium text-sm text-green-600">{formatCurrency(parseFloat(saveOrderMutation.data.amountPaid || "0"))}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground text-sm">Amount Due</span>
                            <span className="font-medium text-sm text-red-600">{formatCurrency(parseFloat(saveOrderMutation.data.amountDue || "0"))}</span>
                          </div>
                          <div className="flex justify-between items-center pt-2 mt-1 border-t border-border">
                            <span className="font-bold text-sm">Balance</span>
                            <span className={`font-bold text-base ${saveOrderMutation.data.paymentStatus === "paid" ? "text-green-600" : "text-red-600"}`}>
                              {formatCurrency(parseFloat(saveOrderMutation.data.amountDue || "0"))}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground text-sm">Status</span>
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">Due</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground text-sm">Amount Paid</span>
                            <span className="font-medium text-sm">{formatCurrency(0)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground text-sm">Amount Due</span>
                            <span className="font-medium text-sm text-red-600">{formatCurrency(summary.total)}</span>
                          </div>
                          <div className="flex justify-between items-center pt-2 mt-1 border-t border-border">
                            <span className="font-bold text-sm">Balance</span>
                            <span className="font-bold text-base text-red-600">{formatCurrency(summary.total)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 border-t border-border pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Back Button */}
              <div className="lg:col-span-1">
                <Button
                  variant="outline"
                  onClick={onBack}
                  className="flex items-center gap-2 w-full mb-4 lg:mb-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Menu Selection
                </Button>
              </div>
              
              {/* Document Options */}
              <div className="lg:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Menu Options */}
                  <div className="bg-muted/30 rounded-lg p-4 border border-border">
                    <h4 className="text-sm font-semibold text-primary mb-3 pb-1 border-b border-border flex items-center">
                      <List className="w-4 h-4 mr-2" />
                      Menu Options
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        onClick={handlePrint}
                        className="flex items-center gap-1 text-xs h-8"
                        size="sm"
                      >
                        <PrinterCheck className="w-3 h-3" />
                        Print Menu
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleDownloadMenuList}
                        className="flex items-center gap-1 text-xs h-8"
                        size="sm"
                      >
                        <List className="w-3 h-3" />
                        Download List
                      </Button>
                    </div>
                  </div>
                  
                  {/* Invoice Options */}
                  <div className="bg-muted/30 rounded-lg p-4 border border-border">
                    <h4 className="text-sm font-semibold text-primary mb-3 pb-1 border-b border-border flex items-center">
                      <FileBarChart className="w-4 h-4 mr-2" />
                      Invoice Options
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleCategoryInvoice(false)}
                        className="flex items-center gap-1 text-xs h-8"
                        size="sm"
                      >
                        <FileBarChart className="w-3 h-3" />
                        Format A
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleCategoryInvoice(true)}
                        className="flex items-center gap-1 text-xs h-8"
                        size="sm"
                      >
                        <PrinterCheck className="w-3 h-3" />
                        Print A
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleItemizedInvoice(false)}
                        className="flex items-center gap-1 text-xs h-8"
                        size="sm"
                      >
                        <FileSpreadsheet className="w-3 h-3" />
                        Format B
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleItemizedInvoice(true)}
                        className="flex items-center gap-1 text-xs h-8"
                        size="sm"
                      >
                        <PrinterCheck className="w-3 h-3" />
                        Print B
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Save Order Button */}
                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={handleSaveOrder}
                    disabled={saveOrderMutation.isPending}
                    className="flex items-center gap-2"
                    size="lg"
                  >
                    {saveOrderMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving Order...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Save Order
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
