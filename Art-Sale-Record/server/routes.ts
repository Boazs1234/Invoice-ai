import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { api, registerSchema, loginSchema } from "@shared/routes";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { pool } from "./db";

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

const uploadDir = path.join(process.cwd(), "client/public/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: fileStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const PgSession = connectPgSimple(session);
  
  app.use(
    session({
      store: new PgSession({
        pool: pool,
        tableName: "session",
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "dev-secret-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: "lax",
      },
    })
  );

  app.post(api.auth.register.path, async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      const hashedPassword = await bcrypt.hash(data.password, 10);
      const user = await storage.createUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email.toLowerCase(),
        password: hashedPassword,
      });
      
      req.session.userId = user.id;
      
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  app.post(api.auth.login.path, async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      const validPassword = await bcrypt.compare(data.password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      req.session.userId = user.id;
      
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get(api.auth.me.path, async (req, res) => {
    if (!req.session.userId) {
      return res.json({ user: null });
    }
    
    const user = await storage.getUserById(req.session.userId);
    if (!user) {
      return res.json({ user: null });
    }
    
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  });

  app.post(api.upload.image.path, upload.single("file"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
  });

  app.get(api.invoices.list.path, async (req, res) => {
    const userId = req.session.userId;
    const invoices = await storage.getInvoices(userId);
    res.json(invoices);
  });

  app.get(api.invoices.get.path, async (req, res) => {
    const userId = req.session.userId;
    const invoice = await storage.getInvoice(Number(req.params.id), userId);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    res.json(invoice);
  });

  app.post(api.invoices.create.path, async (req, res) => {
    try {
      const input = api.invoices.create.input.parse(req.body);
      const userId = req.session.userId;
      const invoice = await storage.createInvoice({ ...input, userId });
      res.status(201).json(invoice);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  app.put(api.invoices.update.path, async (req, res) => {
    try {
      const input = api.invoices.update.input.parse(req.body);
      const userId = req.session.userId;
      const invoice = await storage.updateInvoice(Number(req.params.id), input, userId);
      res.json(invoice);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  app.delete(api.invoices.delete.path, async (req, res) => {
    const userId = req.session.userId;
    const invoiceId = Number(req.params.id);
    
    // Check if this is an example invoice (userId = null) - these are locked
    const invoice = await storage.getInvoice(invoiceId);
    if (invoice && invoice.userId === null) {
      return res.status(403).json({ message: "Example invoices cannot be deleted" });
    }
    
    await storage.deleteInvoice(invoiceId, userId);
    res.status(204).send();
  });

  return httpServer;
}

async function seedDatabase() {
  try {
    await storage.createInvoice({
      invoiceNumber: "0001",
      invoiceDate: "2024-01-15",
      paymentDueDate: "2024-02-15",
      artistName: "Elena Vlasenko",
      artistAddress: "123 Art Studio Way\nBerlin, Germany 10115",
      artistEmail: "elena@vlasenko-art.com",
      artistPhone: "+49 123 456 789",
      buyerName: "James Thompson",
      buyerAddress: "456 Collector Avenue\nNew York, NY 10012\nUSA",
      buyerEmail: "j.thompson@example.com",
      buyerPhone: "+1 212 555 0123",
      artworkTitle: "Silent Horizon No. 4",
      artworkYear: "2023",
      artworkMedium: "Oil on Linen",
      artworkDimensions: "120 x 150 cm",
      price: "12000.00",
      taxRate: "8",
      taxAmount: "960.00",
      shippingFees: "500.00",
      totalAmount: "13460.00",
      currency: "USD",
      paymentTerms: "Payment is due within 30 days of receiving this invoice by bank transfer or check. Copyright retained by artist.",
      notes: "Certificate of Authenticity included. Thank you for your business!",
    });
    
    await storage.createInvoice({
      invoiceNumber: "0002",
      invoiceDate: "2024-02-20",
      paymentDueDate: "2024-03-20",
      artistName: "Marcus Chen",
      artistAddress: "789 Gallery Row\nLos Angeles, CA 90012",
      artistEmail: "marcus@chenart.com",
      artistPhone: "+1 310 555 8899",
      buyerName: "Sophia Williams",
      buyerAddress: "321 Park Avenue\nSan Francisco, CA 94102",
      buyerEmail: "s.williams@example.com",
      buyerPhone: "+1 415 555 7766",
      artworkTitle: "Urban Reflections",
      artworkYear: "2024",
      artworkMedium: "Acrylic on Canvas",
      artworkDimensions: "90 x 120 cm",
      price: "8500.00",
      taxRate: "9.5",
      taxAmount: "807.50",
      shippingFees: "350.00",
      totalAmount: "9657.50",
      currency: "USD",
      paymentTerms: "Net 30. Wire transfer preferred.",
      notes: "Includes custom framing. Installation services available upon request.",
    });
    
    console.log("Database seeded with 2 example invoices");
  } catch (e) {
    console.error("Failed to seed database:", e);
  }
}

let seeded = false;
const originalGetInvoices = storage.getInvoices.bind(storage);
storage.getInvoices = async function (userId?: number) {
  const result = await originalGetInvoices(userId);
  if (result.length === 0 && !seeded && !userId) {
    seeded = true;
    await seedDatabase();
    return await originalGetInvoices(userId);
  }
  return result;
};
