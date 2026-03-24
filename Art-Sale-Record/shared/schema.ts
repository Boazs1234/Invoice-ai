import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

export const invoices = sqliteTable("invoices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id),
  invoiceNumber: text("invoice_number").notNull(),
  invoiceDate: text("invoice_date").notNull(),
  paymentDueDate: text("payment_due_date"),
  
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
  
  price: text("price").notNull(),
  taxRate: text("tax_rate").default("0"),
  taxAmount: text("tax_amount").default("0"),
  shippingFees: text("shipping_fees").default("0"),
  totalAmount: text("total_amount").notNull(),
  currency: text("currency").default("USD").notNull(),
  
  paymentTerms: text("payment_terms"),
  notes: text("notes"),
  
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
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
