import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { PaymentServiceFactory } from "./paymentService";
import { db } from "./db";
import { processedWebhookEvents, subscriptions, licenses } from "@shared/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import fs from "fs";
import path from "path";

const app = express();

// Stripe webhook MUST come before express.json() to preserve raw body for signature verification
app.post('/api/checkout/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const providers = await storage.getAllPaymentProviders();
    const stripeProvider = providers.find(p => p.type.toLowerCase() === 'stripe');
    
    if (!stripeProvider) {
      return res.status(404).json({ message: "Stripe provider not configured" });
    }

    const paymentService = PaymentServiceFactory.createService(stripeProvider);
    const signature = req.headers['stripe-signature'] as string;
    
    const webhookData = await paymentService.verifyWebhook(req.body, signature);

    // Check if event already processed (idempotency with database)
    const existingEvent = await db.select()
      .from(processedWebhookEvents)
      .where(eq(processedWebhookEvents.id, webhookData.paymentId))
      .limit(1);

    if (existingEvent.length > 0) {
      console.log(`Stripe event ${webhookData.paymentId} already processed, skipping`);
      return res.json({ received: true });
    }

    if (webhookData.status === 'success' && webhookData.userId && webhookData.pluginId) {
      // Extract actual amount from Stripe payload (amount is in cents)
      const amount = webhookData.metadata?.amount_received || 
                     webhookData.metadata?.amount || 
                     0;
      const price = (amount / 100).toFixed(2); // Convert cents to dollars

      // Use transaction to ensure atomicity - all or nothing
      await db.transaction(async (tx) => {
        // Create subscription within transaction
        const [subscription] = await tx.insert(subscriptions).values({
          userId: webhookData.userId!,
          pluginId: webhookData.pluginId!,
          planType: webhookData.metadata?.planType || 'monthly',
          status: 'active',
          price,
          autoRenew: true,
        }).returning();

        // Generate license key
        const licenseKey = `${randomBytes(8).toString('hex')}-${randomBytes(8).toString('hex')}-${randomBytes(8).toString('hex')}`.toUpperCase();

        // Create license within transaction
        await tx.insert(licenses).values({
          userId: webhookData.userId!,
          pluginId: webhookData.pluginId!,
          subscriptionId: subscription.id,
          licenseKey,
          maxDomains: 1,
          status: 'active',
        });

        // Mark event as processed - part of transaction
        await tx.insert(processedWebhookEvents).values({
          id: webhookData.paymentId,
          provider: 'stripe',
          eventType: webhookData.event,
        });
        
        console.log(`Stripe payment ${webhookData.paymentId} processed: user ${webhookData.userId}, amount $${price}`);
      });
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Error processing Stripe webhook:", error);
    res.status(400).json({ message: "Stripe webhook processing failed" });
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve uploaded files (images and plugin archives) from /uploads
// This makes URLs like /uploads/images/<file> and /uploads/plugins/<file> accessible
// Ensure upload directories exist when container starts (especially with empty volumes)
try {
  const uploadsRoot = path.join(process.cwd(), 'uploads');
  const pluginsDir = path.join(uploadsRoot, 'plugins');
  const imagesDir = path.join(uploadsRoot, 'images');
  if (!fs.existsSync(uploadsRoot)) fs.mkdirSync(uploadsRoot, { recursive: true });
  if (!fs.existsSync(pluginsDir)) fs.mkdirSync(pluginsDir, { recursive: true });
  if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });
} catch (e) {
  console.warn('Could not ensure upload directories:', e);
}
app.use('/uploads', express.static(process.cwd() + '/uploads'));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  const host = process.env.HOST || '0.0.0.0';
  server.listen({
    port,
    host,
  }, () => {
    log(`serving on ${host}:${port}`);
  });
})();