import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as Indian Rupees (INR)
 * @param amount The amount to format
 * @param showDecimals Whether to show decimal places (default: false)
 * @returns Formatted currency string or "Free" for zero amounts
 */
export function formatCurrency(amount: number, showDecimals = false): string {
  // Ensure amount is a valid number
  const validAmount = Number(isNaN(amount) ? 0 : amount);

  // Always return "₹0" for zero or falsy amounts
  if (!validAmount) {
    return "₹0";
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(validAmount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date));
}

export function generateOrderId(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ACS${year}${random}`;
}

/**
 * Calculates the order summary with precise calculations
 * @param subtotal The subtotal amount
 * @param applyGST Whether to apply GST (default: true)
 * @returns Order summary with subtotal, GST, and total
 */
export function calculateOrderSummary(subtotal: number, applyGST = true) {
  // Ensure subtotal is a valid number and round to 2 decimal places for precision
  const validSubtotal = Number(parseFloat(subtotal.toString()).toFixed(2));
  
  // Service charge has been removed
  const serviceCharge = 0;
  
  // Calculate GST (18%) if applicable
  const gst = applyGST ? Number((validSubtotal * 0.18).toFixed(2)) : 0;
  
  // Calculate total
  const total = Number((validSubtotal + gst).toFixed(2));

  return {
    subtotal: validSubtotal,
    serviceCharge,
    gst,
    total,
  };
}

export function validateMobileNumber(mobile: string): boolean {
  const mobileRegex = /^[6-9]\d{9}$/;
  return mobileRegex.test(mobile);
}

// Payment Status Types and Utilities
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'refunded' | 'cancelled';

export interface PaymentStatusConfig {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  icon: string;
  priority: number; // For sorting
}

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, PaymentStatusConfig> = {
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-800',
    icon: 'Clock',
    priority: 1
  },
  partial: {
    label: 'Partial',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-800',
    icon: 'CreditCard',
    priority: 2
  },
  paid: {
    label: 'Paid',
    color: 'bg-green-100 text-green-800 border-green-200',
    bgColor: 'bg-green-50',
    textColor: 'text-green-800',
    icon: 'CheckCircle',
    priority: 5
  },
  overdue: {
    label: 'Overdue',
    color: 'bg-red-100 text-red-800 border-red-200',
    bgColor: 'bg-red-50',
    textColor: 'text-red-800',
    icon: 'AlertTriangle',
    priority: 0
  },
  refunded: {
    label: 'Refunded',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-800',
    icon: 'RotateCcw',
    priority: 4
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-800',
    icon: 'XCircle',
    priority: 3
  }
};

export function getPaymentStatusConfig(status: string): PaymentStatusConfig {
  const normalizedStatus = status.toLowerCase() as PaymentStatus;
  return PAYMENT_STATUS_CONFIG[normalizedStatus] || PAYMENT_STATUS_CONFIG.pending;
}

export function calculatePaymentProgress(amountPaid: string | number, total: string | number): number {
  const paid = typeof amountPaid === 'string' ? parseFloat(amountPaid) : amountPaid;
  const totalAmount = typeof total === 'string' ? parseFloat(total) : total;

  if (totalAmount <= 0) return 0;
  const progress = (paid / totalAmount) * 100;
  return Math.min(Math.max(progress, 0), 100);
}

export function determinePaymentStatus(
  amountPaid: string | number,
  total: string | number,
  eventDate?: string | Date
): PaymentStatus {
  const paid = typeof amountPaid === 'string' ? parseFloat(amountPaid) : amountPaid;
  const totalAmount = typeof total === 'string' ? parseFloat(total) : total;

  // Check if fully paid
  if (paid >= totalAmount) {
    return 'paid';
  }

  // Check if partially paid
  if (paid > 0) {
    // Check if overdue
    if (eventDate) {
      const event = new Date(eventDate);
      const now = new Date();
      if (event < now) {
        return 'overdue';
      }
    }
    return 'partial';
  }

  // No payment made - check if overdue
  if (eventDate) {
    const event = new Date(eventDate);
    const now = new Date();
    if (event < now) {
      return 'overdue';
    }
  }

  return 'pending';
}
