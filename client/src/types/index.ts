export interface CustomerData {
  name: string;
  tamilName?: string;
  mobile: string;
  address: string;
  notes?: string;
  guestCount: number;
  eventDate: string;
}

export interface SelectedMenuItem {
  id: number;
  name: string;
  tamilName: string;
  category: string;
  subcategory?: string;
  type: string;
  price: number;
  quantity: number;
  isCustom?: boolean;
}

export interface OrderSummary {
  subtotal: number;
  serviceCharge: number;
  gst: number;
  total: number;
}

export interface OrderData {
  customer: CustomerData;
  selectedItems: SelectedMenuItem[];
  guestCount: number;
  eventDate: string;
  summary: OrderSummary;
  orderId?: string;
  paymentStatus?: 'due' | 'partial' | 'paid';
  amountPaid?: string;
  amountDue?: string;
}

export interface Order extends OrderData {
  id: number;
  status: string;
  createdAt: string;
  total: string;
  paymentStatus: 'due' | 'partial' | 'paid';
  amountPaid: string;
  amountDue: string;
}

export interface TransformedOrder extends Omit<Order, 'total' | 'amountPaid' | 'amountDue' | 'subtotal' | 'serviceCharge' | 'gst'> {
  customerName: string;
  itemCount: number;
  subtotal: string; // Monetary fields as strings for display
  serviceCharge: string;
  gst: string;
  total: string;
  amountPaid: string;
  amountDue: string;
  payments?: unknown[]; // Optional payments array
}
