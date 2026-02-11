import { pgTable, text, serial, numeric, timestamp, date, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  invoiceNumber: text("invoice_number").notNull(),
  invoiceDate: date("invoice_date").notNull(),
  paymentDueDate: date("payment_due_date"),
  
  logoUrl: text("logo_url"),
  
  artistName: text("artist_name").notNull(),
  artistAddress: text("artist_address").notNull(),
  artistEmail: text("artist_email").notNull(),
  artistPhone: text("artist_phone"),
  
  buyerName: text("buyer_name").notNull(),
  buyerAddress: text("buyer_address").notNull(),
  buyerEmail: text("buyer_email"),
  buyerPhone: text("buyer_phone"),
  
  artworkTitle: text("artwork_title").notNull(),
  artworkYear: text("artwork_year").notNull(),
  artworkMedium: text("artwork_medium").notNull(),
  artworkDimensions: text("artwork_dimensions").notNull(),
  editionNumber: text("edition_number"),
  artworkImageUrl: text("artwork_image_url"),
  
  price: numeric("price").notNull(),
  taxRate: numeric("tax_rate").default("0"),
  taxAmount: numeric("tax_amount").default("0"),
  shippingFees: numeric("shipping_fees").default("0"),
  totalAmount: numeric("total_amount").notNull(),
  currency: text("currency").default("USD").notNull(),
  
  paymentTerms: text("payment_terms"),
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true 
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({ 
  id: true, 
  createdAt: true 
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
