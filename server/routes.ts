import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCustomerSchema, insertOrderSchema } from "@shared/schema";
import { z } from "zod";
import cookieParser from "cookie-parser";
import { login, logout, getSession, requireAuth } from "./auth";
import { register } from "./user";

export async function registerRoutes(app: Express): Promise<Server> {
  // Add cookie parser middleware
  app.use(cookieParser());
  
  // Authentication routes
  app.post("/api/auth/register", register);
  app.post("/api/auth/login", login);
  app.post("/api/auth/logout", logout);
  app.get("/api/auth/session", getSession);
  
  // Protected routes middleware
  const protectedRoutes = [
    "/api/customers",
    "/api/orders",
    "/api/menu"
  ];
  
  app.use(protectedRoutes, requireAuth);
  // Customer routes
  app.post("/api/customers", async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validatedData);
      res.json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.get("/api/customers", async (req, res) => {
    try {
      const customers = await storage.getAllCustomers();
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/customers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await storage.getCustomer(id);
      if (!customer) {
        res.status(404).json({ message: "Customer not found" });
        return;
      }
      res.json(customer);
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });



  // Update customer
  app.patch("/api/customers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await storage.updateCustomer(id, req.body);
      if (!customer) {
        res.status(404).json({ message: "Customer not found" });
        return;
      }
      res.json(customer);
    } catch (error) {
      console.error("Error updating customer:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Menu routes
  app.get("/api/menu", async (req, res) => {
    try {
      const menuItems = await storage.getAllMenuItems();
      res.json(menuItems);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/menu", async (req, res) => {
    try {
      const { name, tamilName, category, subcategory, type, price, description, customizationOptions, isActive } = req.body;
      if (!name || !tamilName || !category || !type || !price) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const menuItem = await storage.createMenuItem({
        name,
        tamilName,
        category,
        subcategory: subcategory || null,
        type,
        price,
        description: description || '',
        customizationOptions: customizationOptions || [],
        isActive: typeof isActive === 'boolean' ? isActive : true
      });
      res.status(201).json(menuItem);
    } catch (error) {
      console.error("Error creating menu item:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/menu/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateMenuItem(id, req.body);
      if (!updated) return res.status(404).json({ message: "Menu item not found" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating menu item:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/menu/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteMenuItem(id);
      if (!deleted) return res.status(404).json({ message: "Menu item not found" });
      res.json({ deleted: true });
    } catch (error) {
      console.error("Error deleting menu item:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/menu/:id/availability", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isActive } = req.body;
      if (typeof isActive !== 'boolean') return res.status(400).json({ message: "isActive must be boolean" });
      const updated = await storage.toggleMenuItemAvailability(id, isActive);
      if (!updated) return res.status(404).json({ message: "Menu item not found" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating menu item availability:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/menu/category/:category", async (req, res) => {
    try {
      const category = req.params.category;
      const menuItems = await storage.getMenuItemsByCategory(category);
      res.json(menuItems);
    } catch (error) {
      console.error("Error fetching menu items by category:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Order routes
  app.delete("/api/orders/bulk", async (req, res) => {
    try {
      const ids = Array.isArray(req.body.ids) ? req.body.ids.map(Number) : [];
      if (!ids.length) {
        return res.status(400).json({ message: "No order IDs provided" });
      }
      const deleted = await storage.bulkDeleteOrders(ids);
      res.json({ deleted });
    } catch (error) {
      console.error("Error in bulk delete orders:", error);
      res.status(500).json({ message: "Internal server error", details: error instanceof Error ? error.message : String(error) });
    }
  });
  
  // Add endpoint for deleting a single order
  app.delete("/api/orders/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      const success = await storage.deleteOrder(id);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: "Order not found" });
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      res.status(500).json({ 
        message: "Internal server error", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const validatedData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(validatedData);
      res.json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error details:", error.errors);
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        console.error("Unique constraint violation:", error);
        res.status(409).json({ message: "Order ID already exists. Please try again." });
      } else {
        console.error("Unexpected error:", error);
        res.status(500).json({ 
          message: "Internal server error", 
          details: error instanceof Error ? error.message : String(error) 
        });
      }
    }
  });

  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Today's orders
  app.get("/api/orders/today", async (req, res) => {
    try {
      const orders = await storage.getTodaysOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching today's orders:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Tomorrow's orders
  app.get("/api/orders/tomorrow", async (req, res) => {
    try {
      const orders = await storage.getTomorrowsOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching tomorrow's orders:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Orders by status
  app.get("/api/orders/status/:status", async (req, res) => {
    try {
      const status = req.params.status;
      const orders = await storage.getOrdersByStatus(status);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders by status:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Orders by date range
  app.get("/api/orders/date-range", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      const orders = await storage.getOrdersByDateRange(start, end);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders by date range:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Check if order can be edited
  app.get("/api/orders/:id/can-edit", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const canEdit = await storage.canEditOrder(id);
      res.json({ canEdit });
    } catch (error) {
      console.error("Error checking if order can be edited:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Check if order is editable (alternative endpoint name)
  app.get("/api/orders/:id/editable", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const canEdit = await storage.canEditOrder(id);
      res.json({ editable: canEdit });
    } catch (error) {
      console.error("Error checking if order is editable:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get single order by ID
  app.get("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update order
  app.put("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const orderData = req.body;
      
      // Update the order
      const updatedOrder = await storage.updateOrder(id, orderData);
      if (!updatedOrder) {
        res.status(404).json({ message: "Order not found" });
        return;
      }
      
      res.json(updatedOrder);
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update customer (PUT method for consistency)
  app.put("/api/customers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await storage.updateCustomer(id, req.body);
      if (!customer) {
        res.status(404).json({ message: "Customer not found" });
        return;
      }
      res.json(customer);
    } catch (error) {
      console.error("Error updating customer:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Payment routes
  app.post("/api/orders/:id/payments", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { amount, paymentMethod, notes, receiptNumber, paymentDate } = req.body;
      
      console.log(`Processing payment for order ${orderId}:`, req.body);
      
      if (!amount || !paymentMethod) {
        return res.status(400).json({ message: "Amount and payment method are required" });
      }
      
      // Validate amount is a positive number
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ message: "Amount must be a positive number" });
      }
      
      // Create payment record and update order status
      const result = await storage.addPayment(orderId, {
        amount,
        paymentMethod,
        notes,
        receiptNumber,
        paymentDate: paymentDate ? new Date(paymentDate) : undefined
      });
      
      // Force refresh the order data to ensure we have the latest
      await storage.updatePaymentStatus(orderId);
      
      // Transform the order data for the response
      const transformedOrder = await storage.getOrder(orderId);
      
      if (!transformedOrder) {
        throw new Error(`Failed to retrieve updated order ${orderId}`);
      }
      
      console.log(`Payment processed successfully for order ${orderId}:`, {
        amountPaid: transformedOrder.amountPaid,
        amountDue: transformedOrder.amountDue,
        paymentStatus: transformedOrder.paymentStatus
      });
      
      res.status(201).json({
        payment: result,
        order: transformedOrder
      });
    } catch (error) {
      console.error("Payment error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to process payment";
      res.status(500).json({ 
        message: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      });
    }
  });
  
  app.get("/api/orders/:id/payments", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const payments = await storage.getPaymentsByOrderId(orderId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Failed to fetch payment records" });
    }
  });

  // Translation endpoint (mock implementation)
  app.post("/api/translate", async (req, res) => {
    try {
      const { text, from = "en", to = "ta" } = req.body;
      
      // Mock translation mappings
      const translations: Record<string, string> = {
        "rajesh": "ராஜேஷ்",
        "kumar": "குமார்",
        "priya": "பிரியா", 
        "sharma": "ஷர்மா",
        "suresh": "சுரேஷ்",
        "lakshmi": "லக்ஷ்மி",
        "krishna": "கிருஷ்ணா",
        "ravi": "ரவி",
        "deepa": "தீபா",
        "anand": "ஆனந்த்"
      };

      if (to === "ta" && from === "en") {
        const lowerText = text.toLowerCase();
        const translated = Object.keys(translations).reduce((acc, key) => {
          return acc.replace(new RegExp(key, 'gi'), translations[key]);
        }, lowerText);
        
        res.json({ translatedText: translated });
      } else {
        res.json({ translatedText: text });
      }
    } catch (error) {
      console.error("Translation error:", error);
      res.status(500).json({ message: "Translation error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
