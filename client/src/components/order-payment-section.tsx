import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import { CreditCard, Receipt, DollarSign, Loader2 } from "lucide-react";
import PaymentForm from "./payment-form";
import PaymentHistory from "./payment-history";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Define interfaces for API responses
interface OrderData {
  total: string;
  amountPaid: string;
  amountDue: string;
  paymentStatus: string;
  [key: string]: any; // For any other properties that might be in the response
}

interface Payment {
  id: number;
  amount: string;
  paymentDate: string;
  paymentMethod: string;
  [key: string]: any; // For any other properties
}

interface OrderPaymentSectionProps {
  orderId: number;
  orderTotal: string;
  amountPaid: string;
  amountDue: string;
  paymentStatus: string;
  payments?: any[];
  onPaymentAdded?: () => void;
}

export default function OrderPaymentSection({
  orderId,
  orderTotal: initialOrderTotal,
  amountPaid: initialAmountPaid,
  amountDue: initialAmountDue,
  paymentStatus: initialPaymentStatus,
  payments: initialPayments,
  onPaymentAdded
}: OrderPaymentSectionProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("history");
  
  // State to track the latest order data
  const [orderData, setOrderData] = useState({
    orderTotal: initialOrderTotal,
    amountPaid: initialAmountPaid,
    amountDue: initialAmountDue,
    paymentStatus: initialPaymentStatus
  });
  
  // Fetch the latest order data
  const { data: latestOrder, isLoading: isLoadingOrder } = useQuery<OrderData>({
    queryKey: [`/api/orders/${orderId}`],
    refetchOnWindowFocus: true,
    staleTime: 0
  });
  
  // Fetch the latest payments
  const { data: latestPayments, isLoading: isLoadingPayments } = useQuery<Payment[]>({
    queryKey: [`/api/orders/${orderId}/payments`],
    refetchOnWindowFocus: true,
    staleTime: 0
  });
  
  // Update the order data when the latest data is fetched
  useEffect(() => {
    if (latestOrder) {
      console.log("Latest order data:", latestOrder);
      console.log("Payment data:", {
        total: latestOrder.total,
        amountPaid: latestOrder.amountPaid,
        amountDue: latestOrder.amountDue,
        paymentStatus: latestOrder.paymentStatus
      });
      
      setOrderData({
        orderTotal: latestOrder.total,
        amountPaid: latestOrder.amountPaid,
        amountDue: latestOrder.amountDue,
        paymentStatus: latestOrder.paymentStatus
      });
    }
  }, [latestOrder]);
  
  const handlePaymentSuccess = async () => {
    console.log("Payment added successfully, switching to history tab");

    try {
      // Invalidate and refetch queries to ensure data is refreshed
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] }),
        queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/payments`] }),
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] })
      ]);

      // Force refetch to get the latest data immediately
      await Promise.all([
        queryClient.refetchQueries({ queryKey: [`/api/orders/${orderId}`] }),
        queryClient.refetchQueries({ queryKey: [`/api/orders/${orderId}/payments`] })
      ]);

      console.log("Order data successfully refreshed after payment");
    } catch (error) {
      console.error("Error refreshing data after payment:", error);
    }

    // Switch to history tab after successful payment
    setActiveTab("history");
    if (onPaymentAdded) onPaymentAdded();
  };

  return (
    <Card className="w-full border-2 border-primary/20 shadow-md h-full">
      <CardHeader className="bg-muted/50 pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <span>{t('ordersList.paymentManagement') || 'Payment Management'}</span>
          </div>
          <div className="text-sm font-normal">
            <span className="text-muted-foreground mr-2">{t('ordersList.balance') || 'Balance'}:</span>
            {isLoadingOrder ? (
              <Loader2 className="h-4 w-4 animate-spin inline mr-1" />
            ) : (
              <span className={orderData.paymentStatus === "paid" ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                {formatCurrency(parseFloat(orderData.amountDue))}
              </span>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              {t('ordersList.paymentHistory') || 'Payment History'}
            </TabsTrigger>
            <TabsTrigger value="add" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              {t('ordersList.addPayment') || 'Add Payment'}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="history" className="mt-0">
            <PaymentHistory
              orderId={orderId}
              orderTotal={orderData.orderTotal}
              amountPaid={orderData.amountPaid}
              amountDue={orderData.amountDue}
              paymentStatus={orderData.paymentStatus}
              payments={latestPayments || initialPayments}
            />
          </TabsContent>
          <TabsContent value="add" className="mt-0">
            <PaymentForm
              orderId={orderId}
              orderTotal={orderData.orderTotal}
              amountDue={orderData.amountDue}
              onSuccess={handlePaymentSuccess}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}