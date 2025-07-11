import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface PaymentFormProps {
  orderId: number;
  orderTotal: string;
  amountDue: string;
  onSuccess?: () => void;
}

export default function PaymentForm({ orderId, orderTotal, amountDue, onSuccess }: PaymentFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());

  const paymentMutation = useMutation({
    mutationFn: async () => {
      console.log(`Submitting payment for order ${orderId}:`, {
        amount,
        paymentMethod,
        notes,
        receiptNumber,
        paymentDate: paymentDate?.toISOString(),
      });
      
      const response = await fetch(`/api/orders/${orderId}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          paymentMethod,
          notes,
          receiptNumber,
          paymentDate: paymentDate?.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to process payment");
      }

      const result = await response.json();
      console.log("Payment response:", result);
      return result;
    },
    onSuccess: (data) => {
      console.log("Payment successful, received data:", data);
      
      toast({
        title: t('ordersList.paymentRecorded') || "Payment Recorded",
        description: `${t('ordersList.paymentOf') || 'Payment of'} ${formatCurrency(parseFloat(amount))} ${t('ordersList.hasBeenRecorded') || 'has been recorded successfully'}.`,
      });
      
      // Reset form
      setAmount("");
      setNotes("");
      setReceiptNumber("");
      
      // Force invalidate all related queries to ensure data is refreshed
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/payments`] });
      
      // Force refetch to ensure we have the latest data
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: [`/api/orders/${orderId}`] });
        queryClient.refetchQueries({ queryKey: ["/api/orders"] });
        queryClient.refetchQueries({ queryKey: [`/api/orders/${orderId}/payments`] });
        console.log("Order data forcefully refreshed after payment");
      }, 300);
      
      // Call onSuccess callback if provided
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: t('ordersList.paymentFailed') || "Payment Failed",
        description: error.message || t('ordersList.failedToRecord') || "Failed to record payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate amount
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({
        title: t('ordersList.invalidAmount') || "Invalid Amount",
        description: t('ordersList.enterValidAmount') || "Please enter a valid payment amount.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate payment method
    if (!paymentMethod) {
      toast({
        title: t('ordersList.paymentMethodRequired') || "Payment Method Required",
        description: t('ordersList.selectPaymentMethodError') || "Please select a payment method.",
        variant: "destructive",
      });
      return;
    }
    
    paymentMutation.mutate();
  };

  return (
    <Card className="w-full border-0 shadow-none">
      <CardHeader className="px-0 pt-0 pb-4">
        <CardTitle className="text-base">{t('ordersList.recordPayment') || 'Record Payment'}</CardTitle>
        <CardDescription className="text-xs">
          {t('ordersList.enterPaymentDetails') || 'Enter payment details for order'} #{orderId}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-medium">
                  {t('ordersList.paymentAmount') || 'Payment Amount'}
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    max="999999"
                    placeholder="0.00"
                    className="pl-8 h-11"
                    value={amount}
                    onChange={(e) => {
                      console.log('Amount input changed:', e.target.value);
                      setAmount(e.target.value);
                    }}
                    onFocus={() => console.log('Amount input focused')}
                    onBlur={() => console.log('Amount input blurred')}
                    required
                    autoComplete="off"
                  />
                </div>
                <p className="text-xs text-muted-foreground flex flex-wrap gap-x-2">
                  <span>{t('ordersList.total') || 'Total'}: {formatCurrency(parseFloat(orderTotal))}</span>
                  <span>|</span>
                  <span>{t('ordersList.due') || 'Due'}: {formatCurrency(parseFloat(amountDue))}</span>
                </p>
              </div>
            
            <div className="space-y-2">
              <Label htmlFor="paymentMethod" className="text-sm font-medium">
                {t('ordersList.paymentMethod') || 'Payment Method'}
              </Label>
              <Select 
                value={paymentMethod} 
                onValueChange={(value) => {
                  console.log('Payment method changed:', value);
                  setPaymentMethod(value);
                }} 
                required
              >
                <SelectTrigger id="paymentMethod" className="h-11">
                  <SelectValue placeholder={t('ordersList.selectPaymentMethod') || "Select payment method"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">{t('paymentMethods.cash') || 'Cash'}</SelectItem>
                  <SelectItem value="card">{t('paymentMethods.card') || 'Card'}</SelectItem>
                  <SelectItem value="bank_transfer">{t('paymentMethods.bankTransfer') || 'Bank Transfer'}</SelectItem>
                  <SelectItem value="upi">{t('paymentMethods.upi') || 'UPI'}</SelectItem>
                  <SelectItem value="cheque">{t('paymentMethods.cheque') || 'Cheque'}</SelectItem>
                  <SelectItem value="other">{t('paymentMethods.other') || 'Other'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="receiptNumber" className="text-sm font-medium">
                {t('ordersList.receiptNumber') || 'Receipt Number (Optional)'}
              </Label>
              <Input
                id="receiptNumber"
                name="receiptNumber"
                placeholder={t('ordersList.receiptPlaceholder') || "Receipt or transaction ID"}
                className="h-11"
                value={receiptNumber}
                onChange={(e) => {
                  console.log('Receipt number changed:', e.target.value);
                  setReceiptNumber(e.target.value);
                }}
                autoComplete="off"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('ordersList.paymentDate') || 'Payment Date'}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full h-11 justify-start text-left font-normal",
                      !paymentDate && "text-muted-foreground"
                    )}
                    onClick={() => console.log('Date picker clicked')}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {paymentDate ? format(paymentDate, "PPP") : <span>{t('ordersList.pickDate') || 'Pick a date'}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={paymentDate}
                    onSelect={(date) => {
                      console.log('Date selected:', date);
                      setPaymentDate(date);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              {t('ordersList.notes') || 'Notes (Optional)'}
            </Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder={t('ordersList.notesPlaceholder') || "Add any additional payment details here"}
              className="min-h-[80px]"
              value={notes}
              onChange={(e) => {
                console.log('Notes changed:', e.target.value);
                setNotes(e.target.value);
              }}
              rows={3}
            />
          </div>
          
          <div className="flex justify-end pt-2">
            <Button 
              type="submit" 
              onClick={handleSubmit}
              disabled={paymentMutation.isPending}
              size="sm"
            >
              {paymentMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t('ordersList.recordPayment') || 'Record Payment'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}