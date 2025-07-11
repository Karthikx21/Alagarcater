import prisma from './prismaClient';
import { type IStorage, type TransformedOrder, type PaymentRecordData } from './storage';
import { Prisma } from '@prisma/client';
import { Customer as PrismaCustomer, MenuItem as PrismaMenuItem, Order as PrismaOrder, User as PrismaUser } from '@prisma/client';
import { type InsertCustomer, type InsertMenuItem, type InsertOrder } from '@shared/schema';
import { hash } from 'bcryptjs';

export class PrismaStorage implements IStorage {
  // User operations
  async createUser(username: string, password: string, name?: string): Promise<PrismaUser> {
    // Hash the password before storing
    const hashedPassword = await hash(password, 10);
    
    return await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name: name || null
      }
    });
  }
  
  async getUserByUsername(username: string): Promise<PrismaUser | null> {
    return await prisma.user.findUnique({
      where: { username }
    });
  }
  
  // Customer operations
  async createCustomer(customer: InsertCustomer): Promise<PrismaCustomer> {
    return await prisma.customer.create({ data: customer });
  }
  
  async getCustomer(id: number): Promise<PrismaCustomer | undefined> {
    const customer = await prisma.customer.findUnique({ where: { id } });
    return customer || undefined;
  }
  
  async getAllCustomers(): Promise<PrismaCustomer[]> {
    return await prisma.customer.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async updateCustomer(id: number, data: Partial<InsertCustomer>): Promise<PrismaCustomer | undefined> {
    try {
      return await prisma.customer.update({
        where: { id },
        data
      });
    } catch (error) {
      console.error("Error updating customer:", error);
      return undefined;
    }
  }

  // Menu operations
  async createMenuItem(item: InsertMenuItem): Promise<PrismaMenuItem> {
    return await prisma.menuItem.create({
      data: {
        ...item,
        price: new Prisma.Decimal(item.price),
        customizationOptions: item.customizationOptions ? JSON.parse(JSON.stringify(item.customizationOptions)) : undefined,
      }
    });
  }
  async getAllMenuItems(): Promise<PrismaMenuItem[]> {
    return await prisma.menuItem.findMany({ where: { isActive: true }, orderBy: { id: 'asc' } });
  }
  async getMenuItemsByCategory(category: string): Promise<PrismaMenuItem[]> {
    return await prisma.menuItem.findMany({
      where: { category, isActive: true },
      orderBy: { id: 'asc' }
    });
  }
  async getMenuItemsBySubcategory(category: string, subcategory: string): Promise<PrismaMenuItem[]> {
    return await prisma.menuItem.findMany({
      where: { category, subcategory, isActive: true },
      orderBy: { id: 'asc' }
    });
  }
  async updateMenuItem(id: number, data: Partial<InsertMenuItem>): Promise<PrismaMenuItem | undefined> {
    try {
      const updateData: Prisma.MenuItemUpdateInput = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.tamilName !== undefined) updateData.tamilName = data.tamilName;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.subcategory !== undefined) updateData.subcategory = data.subcategory;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.price !== undefined) updateData.price = new Prisma.Decimal(data.price);
      if (data.description !== undefined) updateData.description = data.description;
      if (data.customizationOptions !== undefined) updateData.customizationOptions = JSON.parse(JSON.stringify(data.customizationOptions));
      if (data.isActive !== undefined) updateData.isActive = data.isActive;

      return await prisma.menuItem.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      console.error("Error updating menu item:", error);
      return undefined;
    }
  }
  async deleteMenuItem(id: number): Promise<boolean> {
    try {
      await prisma.menuItem.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
  async toggleMenuItemAvailability(id: number, isActive: boolean): Promise<PrismaMenuItem | undefined> {
    try {
      return await prisma.menuItem.update({
        where: { id },
        data: { isActive }
      });
    } catch {
      return undefined;
    }
  }

  // Order operations
  async createOrder(order: InsertOrder): Promise<PrismaOrder> {
    // Use a transaction to ensure atomic orderId generation and order creation
    return await prisma.$transaction(async (tx) => {
      // Generate unique orderId (e.g., ACS2025001) by finding the highest numeric part
      const currentYear = new Date().getFullYear();
      const orderIdPrefix = `ACS${currentYear}`;
      
      // Find all orders for the current year and extract the highest number
      const ordersThisYear = await tx.order.findMany({
        where: {
          orderId: {
            startsWith: orderIdPrefix
          }
        },
        select: { orderId: true },
      });
      
      let maxNumber = 0;
      ordersThisYear.forEach(order => {
        const match = order.orderId.match(/ACS(\d{4})(\d{3})/);
        if (match && match[1] === currentYear.toString()) {
          const num = parseInt(match[2], 10);
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
      });
      
      const nextNumber = maxNumber + 1;
      const orderId = `${orderIdPrefix}${String(nextNumber).padStart(3, '0')}`;

      const orderCreateInput: Prisma.OrderCreateInput = {
        orderId,
        customer: { connect: { id: order.customerId } },
        guestCount: order.guestCount,
        eventDate: order.eventDate,
        selectedItems: JSON.parse(JSON.stringify(order.selectedItems)),
        subtotal: new Prisma.Decimal(order.subtotal),
        serviceCharge: new Prisma.Decimal(order.serviceCharge),
        gst: new Prisma.Decimal(order.gst),
        total: new Prisma.Decimal(order.total),
        status: order.status || "pending",
        paymentStatus: order.paymentStatus || "due",
        amountPaid: new Prisma.Decimal(order.amountPaid || "0"),
        amountDue: new Prisma.Decimal(order.amountDue || "0"),
      };

      return await tx.order.create({
        data: orderCreateInput,
      });
    });
  }
  async getOrder(id: number): Promise<TransformedOrder | undefined> {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true, // Include the entire customer object
        payments: true // Include payment records
      }
    });
    if (!order) return undefined;

    return {
      ...order,
      customerName: order.customer.name, // Extract customer name
      itemCount: Array.isArray(order.selectedItems) ? order.selectedItems.length : 0,
      subtotal: order.subtotal.toString(), // Convert Decimal to string
      serviceCharge: order.serviceCharge.toString(), // Convert Decimal to string
      gst: order.gst.toString(), // Convert Decimal to string
      total: order.total.toString(), // Convert Decimal to string
      amountPaid: order.amountPaid.toString(), // Convert Decimal to string
      amountDue: order.amountDue.toString(), // Convert Decimal to string
      customer: order.customer, // Directly assign the fetched customer object
      payments: order.payments // Include payment records
    };
  }
  async getOrderByOrderId(orderId: string): Promise<PrismaOrder | undefined> {
    return await prisma.order.findUnique({ where: { orderId } }) || undefined;
  }
  async getAllOrders(): Promise<TransformedOrder[]> {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true, // Include the entire customer object
        payments: true // Include payment records
      }
    });

    // Map over orders to add customerName and itemCount
    return orders.map(order => ({
      ...order,
      customerName: order.customer.name, // Extract customer name
      itemCount: Array.isArray(order.selectedItems) ? order.selectedItems.length : 0,
      subtotal: order.subtotal.toString(), // Convert Decimal to string
      serviceCharge: order.serviceCharge.toString(), // Convert Decimal to string
      gst: order.gst.toString(), // Convert Decimal to string
      total: order.total.toString(), // Convert Decimal to string
      amountPaid: order.amountPaid.toString(), // Convert Decimal to string
      amountDue: order.amountDue.toString(), // Convert Decimal to string
      customer: order.customer, // Directly assign the fetched customer object
      payments: order.payments // Include payment records
    }));
  }
  async getOrdersByCustomer(customerId: number): Promise<TransformedOrder[]> {
    const orders = await prisma.order.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true, // Include the entire customer object
        payments: true // Include payment records
      }
    });

    return orders.map(order => ({
      ...order,
      customerName: order.customer.name,
      itemCount: Array.isArray(order.selectedItems) ? order.selectedItems.length : 0,
      subtotal: order.subtotal.toString(),
      serviceCharge: order.serviceCharge.toString(),
      gst: order.gst.toString(),
      total: order.total.toString(),
      amountPaid: order.amountPaid.toString(),
      amountDue: order.amountDue.toString(),
      customer: order.customer, // Directly assign the fetched customer object
      payments: order.payments // Include payment records
    }));
  }
  async updateOrderStatus(id: number, status: string): Promise<PrismaOrder | undefined> {
    try {
      return await prisma.order.update({
        where: { id },
        data: { status }
      });
    } catch {
      return undefined;
    }
  }
  async bulkDeleteOrders(ids: number[]): Promise<number> {
    try {
      // Verify that all orders exist
      const existingOrders = await prisma.order.findMany({
        where: { id: { in: ids } },
        select: { id: true }
      });
      
      const existingIds = existingOrders.map(order => order.id);
      if (existingIds.length !== ids.length) {
        console.warn(`Some orders were not found. Requested: ${ids.length}, Found: ${existingIds.length}`);
      }
      
      if (existingIds.length === 0) {
        return 0;
      }
      
      // Use a transaction to ensure all related records are deleted
      return await prisma.$transaction(async (tx) => {
        // First, delete all payment records associated with these orders
        await tx.paymentRecord.deleteMany({
          where: { orderId: { in: existingIds } }
        });
        
        // Then delete the orders
        const result = await tx.order.deleteMany({ 
          where: { id: { in: existingIds } } 
        });
        
        console.log(`Successfully deleted ${result.count} orders`);
        return result.count;
      });
    } catch (error) {
      console.error(`Error bulk deleting orders:`, error);
      // Re-throw the error to be handled by the route handler
      throw error;
    }
  }

  async updateOrder(id: number, data: Partial<InsertOrder>): Promise<PrismaOrder | undefined> {
    try {
      const orderUpdateInput: Prisma.OrderUpdateInput = {};
      if (data.customerId !== undefined) orderUpdateInput.customer = { connect: { id: data.customerId } };
      if (data.guestCount !== undefined) orderUpdateInput.guestCount = data.guestCount;
      if (data.eventDate !== undefined) orderUpdateInput.eventDate = data.eventDate;
      if (data.selectedItems !== undefined) orderUpdateInput.selectedItems = JSON.parse(JSON.stringify(data.selectedItems));
      if (data.subtotal !== undefined) orderUpdateInput.subtotal = new Prisma.Decimal(data.subtotal);
      if (data.serviceCharge !== undefined) orderUpdateInput.serviceCharge = new Prisma.Decimal(data.serviceCharge);
      if (data.gst !== undefined) orderUpdateInput.gst = new Prisma.Decimal(data.gst);
      if (data.total !== undefined) orderUpdateInput.total = new Prisma.Decimal(data.total);
      if (data.status !== undefined) orderUpdateInput.status = data.status;
      if (data.paymentStatus !== undefined) orderUpdateInput.paymentStatus = data.paymentStatus;
      if (data.amountPaid !== undefined) orderUpdateInput.amountPaid = new Prisma.Decimal(data.amountPaid);
      if (data.amountDue !== undefined) orderUpdateInput.amountDue = new Prisma.Decimal(data.amountDue);

      return await prisma.order.update({
        where: { id },
        data: orderUpdateInput,
      });
    } catch {
      return undefined;
    }
  }

  async deleteOrder(id: number): Promise<boolean> {
    try {
      // First check if the order exists
      const orderExists = await prisma.order.findUnique({
        where: { id },
        include: { payments: true }
      });
      
      if (!orderExists) {
        console.log(`Order with ID ${id} not found`);
        return false;
      }
      
      // Use a transaction to ensure all related records are deleted
      return await prisma.$transaction(async (tx) => {
        // First, delete all payment records associated with this order
        await tx.paymentRecord.deleteMany({
          where: { orderId: id }
        });
        
        // Then delete the order itself
        await tx.order.delete({ 
          where: { id } 
        });
        
        console.log(`Successfully deleted order with ID ${id}`);
        return true;
      });
    } catch (error) {
      console.error(`Error deleting order with ID ${id}:`, error);
      // Re-throw the error to be handled by the route handler
      throw error;
    }
  }

  // New order filtering methods
  async getOrdersByDateRange(startDate: Date, endDate: Date): Promise<TransformedOrder[]> {
    const orders = await prisma.order.findMany({
      where: {
        eventDate: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { eventDate: 'asc' },
      include: {
        customer: true,
        payments: true
      }
    });

    return orders.map(order => ({
      ...order,
      customerName: order.customer.name,
      itemCount: Array.isArray(order.selectedItems) ? order.selectedItems.length : 0,
      subtotal: order.subtotal.toString(),
      serviceCharge: order.serviceCharge.toString(),
      gst: order.gst.toString(),
      total: order.total.toString(),
      amountPaid: order.amountPaid.toString(),
      amountDue: order.amountDue.toString(),
      customer: order.customer,
      payments: order.payments
    }));
  }

  async getTodaysOrders(): Promise<TransformedOrder[]> {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    return this.getOrdersByDateRange(startOfDay, endOfDay);
  }

  async getTomorrowsOrders(): Promise<TransformedOrder[]> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startOfDay = new Date(tomorrow.setHours(0, 0, 0, 0));
    const endOfDay = new Date(tomorrow.setHours(23, 59, 59, 999));
    
    return this.getOrdersByDateRange(startOfDay, endOfDay);
  }

  async getOrdersByStatus(status: string): Promise<TransformedOrder[]> {
    const orders = await prisma.order.findMany({
      where: { status },
      orderBy: { eventDate: 'asc' },
      include: {
        customer: true,
        payments: true
      }
    });

    return orders.map(order => ({
      ...order,
      customerName: order.customer.name,
      itemCount: Array.isArray(order.selectedItems) ? order.selectedItems.length : 0,
      subtotal: order.subtotal.toString(),
      serviceCharge: order.serviceCharge.toString(),
      gst: order.gst.toString(),
      total: order.total.toString(),
      amountPaid: order.amountPaid.toString(),
      amountDue: order.amountDue.toString(),
      customer: order.customer,
      payments: order.payments
    }));
  }

  async canEditOrder(orderId: number): Promise<boolean> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { eventDate: true, status: true }
    });
    
    if (!order) return false;
    
    // Can't edit cancelled or completed orders
    if (order.status === 'cancelled' || order.status === 'delivered') {
      return false;
    }
    
    // Can't edit orders past their event date
    const now = new Date();
    if (order.eventDate < now) {
      return false;
    }
    
    return true;
  }

  // Payment operations
  async addPayment(orderId: number, paymentData: PaymentRecordData): Promise<unknown> {
    try {
      const payment = await prisma.paymentRecord.create({
        data: {
          orderId,
          amount: new Prisma.Decimal(paymentData.amount.toString()),
          paymentMethod: paymentData.paymentMethod,
          notes: paymentData.notes,
          receiptNumber: paymentData.receiptNumber,
          paymentDate: paymentData.paymentDate || new Date()
        }
      });
      return payment;
    } catch (error) {
      console.error("Error adding payment:", error);
      throw error;
    }
  }

  async getPaymentsByOrderId(orderId: number): Promise<unknown[]> {
    try {
      const payments = await prisma.paymentRecord.findMany({
        where: { orderId },
        orderBy: { paymentDate: 'desc' }
      });
      return payments;
    } catch (error) {
      console.error("Error fetching payments:", error);
      return [];
    }
  }

  async updatePaymentStatus(orderId: number): Promise<PrismaOrder | undefined> {
    try {
      // Get the order and its payments
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { payments: true }
      });

      if (!order) return undefined;

      // Calculate total amount paid
      const totalPaid = order.payments.reduce((sum, payment) => {
        return sum.add(payment.amount);
      }, new Prisma.Decimal(0));

      const orderTotal = order.total;
      let paymentStatus = 'due';
      let amountDue = orderTotal.sub(totalPaid);

      if (totalPaid.gte(orderTotal)) {
        paymentStatus = 'paid';
        amountDue = new Prisma.Decimal(0);
      } else if (totalPaid.gt(0)) {
        paymentStatus = 'partial';
      }

      // Update the order
      return await prisma.order.update({
        where: { id: orderId },
        data: {
          amountPaid: totalPaid,
          amountDue: amountDue,
          paymentStatus
        }
      });
    } catch (error) {
      console.error("Error updating payment status:", error);
      return undefined;
    }
  }
}

export const storage = new PrismaStorage();
