import { type InsertCustomer, type InsertMenuItem, type InsertOrder, CustomerData } from "@shared/schema";
import { Customer as PrismaCustomer, MenuItem as PrismaMenuItem, Order as PrismaOrder, User as PrismaUser } from "@prisma/client";
import { JsonValue } from "@prisma/client/runtime/library";

// Define PaymentRecord interface
export interface PaymentRecordData {
  amount: string | number;
  paymentMethod: string;
  notes?: string;
  receiptNumber?: string;
  paymentDate?: Date;
}

// Define TransformedOrder interface to include customerName, itemCount, and string-converted monetary values
export interface TransformedOrder {
  id: number;
  orderId: string;
  customerId: number;
  guestCount: number;
  eventDate: Date;
  selectedItems: JsonValue;
  subtotal: string;
  serviceCharge: string;
  gst: string;
  total: string;
  status: string;
  paymentStatus: string;
  amountPaid: string;
  amountDue: string;
  createdAt: Date;
  customerName: string;
  itemCount: number;
  customer: CustomerData;
  payments?: unknown[];
}

export interface IStorage {
  // User operations
  createUser(username: string, password: string, name?: string): Promise<PrismaUser>;
  getUserByUsername(username: string): Promise<PrismaUser | null>;
  
  // Customer operations
  createCustomer(customer: InsertCustomer): Promise<PrismaCustomer>;
  getCustomer(id: number): Promise<PrismaCustomer | undefined>;
  getAllCustomers(): Promise<PrismaCustomer[]>;
  updateCustomer(id: number, data: Partial<InsertCustomer>): Promise<PrismaCustomer | undefined>;

  // Menu operations
  createMenuItem(item: InsertMenuItem): Promise<PrismaMenuItem>;
  getAllMenuItems(): Promise<PrismaMenuItem[]>;
  getMenuItemsByCategory(category: string): Promise<PrismaMenuItem[]>;
  getMenuItemsBySubcategory(category: string, subcategory: string): Promise<PrismaMenuItem[]>;
  updateMenuItem(id: number, data: Partial<InsertMenuItem>): Promise<PrismaMenuItem | undefined>;
  deleteMenuItem(id: number): Promise<boolean>;
  toggleMenuItemAvailability(id: number, isActive: boolean): Promise<PrismaMenuItem | undefined>;

  // Order operations
  createOrder(order: InsertOrder): Promise<PrismaOrder>;
  getOrder(id: number): Promise<TransformedOrder | undefined>;
  getOrderByOrderId(orderId: string): Promise<PrismaOrder | undefined>;
  getAllOrders(): Promise<TransformedOrder[]>;
  getOrdersByCustomer(customerId: number): Promise<TransformedOrder[]>;
  getOrdersByDateRange(startDate: Date, endDate: Date): Promise<TransformedOrder[]>;
  getTodaysOrders(): Promise<TransformedOrder[]>;
  getTomorrowsOrders(): Promise<TransformedOrder[]>;
  getOrdersByStatus(status: string): Promise<TransformedOrder[]>;
  updateOrderStatus(id: number, status: string): Promise<PrismaOrder | undefined>;
  updateOrder(id: number, data: Partial<InsertOrder>): Promise<PrismaOrder | undefined>;
  deleteOrder(id: number): Promise<boolean>;
  canEditOrder(orderId: number): Promise<boolean>;
  
  // Payment operations
  addPayment(orderId: number, paymentData: PaymentRecordData): Promise<unknown>;
  getPaymentsByOrderId(orderId: number): Promise<unknown[]>;
  updatePaymentStatus(orderId: number): Promise<PrismaOrder | undefined>;
}

// Prisma-based storage implementation
export { PrismaStorage, storage } from './storage-prisma';
