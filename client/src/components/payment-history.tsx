import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, getPaymentStatusConfig } from "@/lib/utils";
import { Loader2, Receipt, CreditCard, Banknote, Smartphone, Building2, FileText, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import PaymentStatusBadge from "./ui/payment-status-badge";

interface PaymentRecord {
  id: number;
  orderId: number;
  amount: string;
  paymentDate: string;
  paymentMethod: string;
  notes?: string;
  receiptNumber?: string;
}

interface PaymentHistoryProps {
  orderId: number;
  orderTotal: string;
  amountPaid: string;
  amountDue: string;
  paymentStatus: string;
  payments?: PaymentRecord[];
}

export default function PaymentHistory({
  orderId,
  orderTotal,
  amountPaid,
  amountDue,
  paymentStatus,
  payments: initialPayments,
}: PaymentHistoryProps) {
  const { t } = useTranslation();
  // Fetch payments if not provided
  const { data: fetchedPayments, isLoading } = useQuery<PaymentRecord[]>({
    queryKey: [`/api/orders/${orderId}/payments`],
    enabled: !initialPayments, // Only fetch if payments not provided
    staleTime: 0, // Always refetch on mount
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  const payments = initialPayments || fetchedPayments || [];

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "cash":
        return t('paymentMethods.cash') || "Cash";
      case "card":
        return t('paymentMethods.card') || "Card";
      case "bank_transfer":
        return t('paymentMethods.bankTransfer') || "Bank Transfer";
      case "upi":
        return t('paymentMethods.upi') || "UPI";
      case "cheque":
        return t('paymentMethods.cheque') || "Cheque";
      default:
        return method.charAt(0).toUpperCase() + method.slice(1);
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "cash":
        return Banknote;
      case "card":
        return CreditCard;
      case "bank_transfer":
        return Building2;
      case "upi":
        return Smartphone;
      case "cheque":
        return FileText;
      default:
        return CreditCard;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "partial":
        return "bg-yellow-100 text-yellow-800";
      case "due":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="w-full border-0 shadow-none">
      <CardHeader className="px-0 pt-0 pb-4">
        <CardTitle className="flex items-center justify-between text-base">
          <span>{t('ordersList.paymentHistory') || 'Payment History'}</span>
          <PaymentStatusBadge
            status={paymentStatus}
            amountPaid={amountPaid}
            total={orderTotal}
            showProgress={false}
            size="sm"
          />
        </CardTitle>
        <CardDescription className="text-xs flex flex-wrap gap-x-2 mt-1">
          <span>{t('ordersList.total') || 'Total'}: {formatCurrency(parseFloat(orderTotal))}</span>
          <span>|</span>
          <span>{t('ordersList.paid') || 'Paid'}: {formatCurrency(parseFloat(amountPaid))}</span>
          <span>|</span>
          <span>{t('ordersList.due') || 'Due'}: {formatCurrency(parseFloat(amountDue))}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Receipt className="h-10 w-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm">{t('ordersList.noPaymentRecords') || 'No payment records found'}</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
            {payments.map((payment, index) => {
              const PaymentIcon = getPaymentMethodIcon(payment.paymentMethod);
              const isLatest = index === 0;

              return (
                <div
                  key={payment.id}
                  className="relative border rounded-lg p-4 bg-card hover:bg-accent/10 transition-colors"
                >
                  {/* Timeline connector */}
                  {index < payments.length - 1 && (
                    <div className="absolute left-6 top-12 w-0.5 h-6 bg-border"></div>
                  )}

                  <div className="flex items-start gap-3">
                    {/* Payment method icon */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      isLatest ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'
                    }`}>
                      <PaymentIcon className="h-4 w-4" />
                    </div>

                    {/* Payment details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-lg">
                            {formatCurrency(parseFloat(payment.amount))}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(payment.paymentDate)}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {getPaymentMethodLabel(payment.paymentMethod)}
                        </Badge>
                      </div>

                      {/* Additional details */}
                      {(payment.receiptNumber || payment.notes) && (
                        <div className="space-y-1 mt-3 pt-3 border-t border-border/50">
                          {payment.receiptNumber && (
                            <div className="flex items-center gap-2 text-xs">
                              <Receipt className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium">{t('ordersList.receipt') || 'Receipt'}:</span>
                              <span className="text-muted-foreground">{payment.receiptNumber}</span>
                            </div>
                          )}
                          {payment.notes && (
                            <p className="text-xs text-muted-foreground italic">
                              "{payment.notes}"
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}