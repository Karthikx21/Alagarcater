import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getPaymentStatusConfig, calculatePaymentProgress, type PaymentStatus } from "@/lib/utils";
import { Clock, CreditCard, CheckCircle, AlertTriangle, RotateCcw, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface PaymentStatusBadgeProps {
  status: string;
  amountPaid?: string | number;
  total?: string | number;
  showProgress?: boolean;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'minimal';
}

const iconMap = {
  Clock,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  XCircle,
};

export default function PaymentStatusBadge({
  status,
  amountPaid,
  total,
  showProgress = false,
  showIcon = true,
  size = 'md',
  variant = 'default'
}: PaymentStatusBadgeProps) {
  const { t } = useTranslation();
  const config = getPaymentStatusConfig(status);
  const IconComponent = iconMap[config.icon as keyof typeof iconMap];
  
  const progress = amountPaid && total ? calculatePaymentProgress(amountPaid, total) : 0;
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1.5',
    lg: 'text-base px-3 py-2'
  };
  
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'outline':
        return `border ${config.color.replace('bg-', 'border-').replace('text-', 'text-')} bg-transparent`;
      case 'minimal':
        return `${config.textColor} bg-transparent border-none`;
      default:
        return config.color;
    }
  };

  const getStatusLabel = () => {
    switch (status.toLowerCase()) {
      case 'paid':
        return t('paid') || 'Paid';
      case 'partial':
        return t('partial') || 'Partial';
      case 'pending':
        return t('pending') || 'Pending';
      case 'overdue':
        return t('overdue') || 'Overdue';
      case 'refunded':
        return t('refunded') || 'Refunded';
      case 'cancelled':
        return t('cancelled') || 'Cancelled';
      default:
        return config.label;
    }
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      <Badge className={`${getVariantClasses()} ${sizeClasses[size]} flex items-center gap-1.5 font-medium w-fit`}>
        {showIcon && IconComponent && (
          <IconComponent className={iconSizes[size]} />
        )}
        <span className="truncate">{getStatusLabel()}</span>
      </Badge>

      {showProgress && amountPaid && total && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
          <Progress value={progress} className="h-1.5 flex-1 min-w-0" />
          <span className="whitespace-nowrap text-xs">
            {Math.round(progress)}%
          </span>
        </div>
      )}
    </div>
  );
}
