import { db } from "./db";
import { invoices, users, type InsertInvoice, type Invoice, type InsertUser, type User } from "@shared/schema";
import { eq, desc, and, isNull } from "drizzle-orm";

export interface IStorage {
  getInvoices(userId?: number): Promise<Invoice[]>;
  getInvoice(id: number, userId?: number): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, invoice: Partial<InsertInvoice>, userId?: number): Promise<Invoice>;
  deleteInvoice(id: number, userId?: number): Promise<void>;
  
  createUser(user: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getInvoices(userId?: number): Promise<Invoice[]> {
    if (userId) {
      return await db.select().from(invoices).where(eq(invoices.userId, userId)).orderBy(desc(invoices.createdAt));
    }
    return await db.select().from(invoices).where(isNull(invoices.userId)).orderBy(desc(invoices.createdAt));
  }

  async getInvoice(id: number, userId?: number): Promise<Invoice | undefined> {
    if (userId) {
      const [invoice] = await db.select().from(invoices).where(and(eq(invoices.id, id), eq(invoices.userId, userId)));
      return invoice;
    }
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice;
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const [invoice] = await db.insert(invoices).values(insertInvoice).returning();
    return invoice;
  }

  async updateInvoice(id: number, updateData: Partial<InsertInvoice>, userId?: number): Promise<Invoice> {
    if (userId) {
      const [invoice] = await db
        .update(invoices)
        .set(updateData)
        .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
        .returning();
      return invoice;
    }
    const [invoice] = await db
      .update(invoices)
      .set(updateData)
      .where(eq(invoices.id, id))
      .returning();
    return invoice;
  }

  async deleteInvoice(id: number, userId?: number): Promise<void> {
    if (userId) {
      await db.delete(invoices).where(and(eq(invoices.id, id), eq(invoices.userId, userId)));
      return;
    }
    await db.delete(invoices).where(eq(invoices.id, id));
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
}

export const storage = new DatabaseStorage();
