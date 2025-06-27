import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  mobile: text("mobile").notNull(),
  address: text("address"),
  notes: text("notes"), // Customer preferences, allergies, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export interface CustomerData {
  name: string;
  mobile: string;
  address?: string | null;
  notes?: string | null; // Add notes field
  guestCount?: number; // Optional as it's not always available directly from customer
  eventDate?: string; // Optional as it's not always available directly from customer
}

export const menuItems = pgTable("MenuItem", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  tamilName: text("tamilName").notNull(),
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  type: text("type").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  customizationOptions: jsonb("customizationOptions").$type<{
    name: string;
    options: Array<{
      name: string;
      priceAdjustment: number;
    }>;
  }[]>(),
  isActive: boolean("isActive").default(true).notNull(),
});

export const orders = pgTable("Order", {
  id: serial("id").primaryKey(),
  orderId: text("orderId").notNull().unique(),
  customerId: integer("customerId").references(() => customers.id).notNull(),
  guestCount: integer("guestCount").notNull(),
  eventDate: timestamp("eventDate").notNull(),
  selectedItems: jsonb("selectedItems").notNull(), // Array of {menuItemId, quantity, price}
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  serviceCharge: decimal("serviceCharge", { precision: 10, scale: 2 }).notNull(),
  gst: decimal("gst", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").default("new").notNull(), // new, confirmed, preparing, ready, delivered, cancelled
  paymentStatus: text("paymentStatus").default("due").notNull(), // due, partial, paid
  amountPaid: decimal("amountPaid", { precision: 10, scale: 2 }).default("0").notNull(),
  amountDue: decimal("amountDue", { precision: 10, scale: 2 }).default("0").notNull(),
  notes: text("notes"), // Special instructions for this order
  lastModified: timestamp("lastModified").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

export const insertMenuItemSchema = createInsertSchema(menuItems).omit({
  id: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  orderId: true,
  createdAt: true,
}).extend({
  eventDate: z.preprocess((arg) => typeof arg === 'string' ? new Date(arg) : arg, z.date()),
  paymentStatus: z.string().optional(),
  amountPaid: z.string().optional(),
  amountDue: z.string().optional(),
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
