import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./auth";
import { upload } from "./upload";
import { uploadImage } from "./uploadImage";
import { insertPluginSchema, insertSubscriptionSchema, insertLicenseSchema, insertPaymentProviderSchema, insertCouponSchema } from "@shared/schema";
import path from "path";
import fs from "fs/promises";
import express from "express";
import { PaymentServiceFactory } from "./paymentService";
import { z } from "zod";

// Coupons feature reintegrado: rotas públicas de validação e rotas de admin

export function registerRoutes(app: Express): Server {
  // Note: Stripe webhook route is registered in server/index.ts before express.json()
  // to preserve raw body for signature verification
  
  // Auth middleware
  setupAuth(app);

  // ==================== HEALTHCHECK ROUTE ====================
  app.get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // ==================== AUTH ROUTES ====================
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ==================== PLUGIN ROUTES ====================
  app.get('/api/plugins', async (_req, res) => {
    try {
      const plugins = await storage.getActivePlugins();
      res.json(plugins);
    } catch (error) {
      console.error("Error fetching plugins:", error);
      res.status(500).json({ message: "Failed to fetch plugins" });
    }
  });

  app.get('/api/plugins/:slug', async (req, res) => {
    try {
      const plugin = await storage.getPluginBySlug(req.params.slug);
      if (!plugin) {
        return res.status(404).json({ message: "Plugin not found" });
      }
      res.json(plugin);
    } catch (error) {
      console.error("Error fetching plugin:", error);
      res.status(500).json({ message: "Failed to fetch plugin" });
    }
  });

  // ==================== SUBSCRIPTION ROUTES ====================
  app.get('/api/subscriptions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const subscriptions = await storage.getUserSubscriptions(userId);
      res.json(subscriptions);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });

  app.post('/api/subscriptions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const data = insertSubscriptionSchema.parse({
        ...req.body,
        userId,
      });

      const subscription = await storage.createSubscription(data);

      // Create license for the subscription
      const licenseKey = storage.generateLicenseKey();
      await storage.createLicense({
        userId,
        pluginId: data.pluginId,
        subscriptionId: subscription.id,
        licenseKey,
        maxDomains: 1,
        status: 'active',
      });

      res.json(subscription);
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  app.delete('/api/subscriptions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const subscription = await storage.getSubscriptionById(req.params.id);
      
      if (!subscription || subscription.userId !== userId) {
        return res.status(404).json({ message: "Subscription not found" });
      }

      await storage.deleteSubscription(req.params.id);
      res.json({ message: "Subscription cancelled" });
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ message: "Failed to cancel subscription" });
    }
  });

  // ==================== LICENSE ROUTES ====================
  app.get('/api/licenses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const licenses = await storage.getUserLicenses(userId);
      res.json(licenses);
    } catch (error) {
      console.error("Error fetching licenses:", error);
      res.status(500).json({ message: "Failed to fetch licenses" });
    }
  });

  app.post('/api/licenses/validate', async (req, res) => {
    try {
      const { licenseKey, domain } = req.body;
      
      if (!licenseKey) {
        return res.status(400).json({ valid: false, message: "License key is required" });
      }

      const license = await storage.getLicenseByKey(licenseKey);
      
      if (!license) {
        return res.status(404).json({ valid: false, message: "Invalid license key" });
      }

      if (license.status !== 'active') {
        return res.json({ valid: false, message: `License is ${license.status}` });
      }

      if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
        return res.json({ valid: false, message: "License has expired" });
      }

      // Check domain activation if domain is provided
      if (domain) {
        const activatedDomains = license.activatedDomains || [];
        const isActivated = activatedDomains.includes(domain);
        const canActivate = activatedDomains.length < (license.maxDomains || 1);

        if (!isActivated && !canActivate) {
          return res.json({ 
            valid: false, 
            message: `Maximum domains (${license.maxDomains}) reached` 
          });
        }
      }

      res.json({ 
        valid: true, 
        license: {
          pluginId: license.pluginId,
          status: license.status,
          expiresAt: license.expiresAt,
          activatedDomains: license.activatedDomains,
          maxDomains: license.maxDomains,
        }
      });
    } catch (error) {
      console.error("Error validating license:", error);
      res.status(500).json({ valid: false, message: "Failed to validate license" });
    }
  });

  app.post('/api/licenses/activate', async (req, res) => {
    try {
      const { licenseKey, domain } = req.body;
      
      if (!licenseKey || !domain) {
        return res.status(400).json({ success: false, message: "License key and domain are required" });
      }

      const license = await storage.getLicenseByKey(licenseKey);
      
      if (!license) {
        return res.status(404).json({ success: false, message: "Invalid license key" });
      }

      if (license.status !== 'active') {
        return res.json({ success: false, message: `License is ${license.status}` });
      }

      if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
        return res.json({ success: false, message: "License has expired" });
      }

      const updatedLicense = await storage.activateLicenseDomain(licenseKey, domain);
      
      if (!updatedLicense) {
        return res.json({ 
          success: false, 
          message: `Maximum domains (${license.maxDomains}) reached` 
        });
      }

      res.json({ 
        success: true, 
        message: "Domain activated successfully",
        license: {
          pluginId: updatedLicense.pluginId,
          activatedDomains: updatedLicense.activatedDomains,
          maxDomains: updatedLicense.maxDomains,
        }
      });
    } catch (error) {
      console.error("Error activating license:", error);
      res.status(500).json({ success: false, message: "Failed to activate license" });
    }
  });

  // ==================== DOWNLOAD ROUTES ====================
  app.get('/api/downloads/:pluginId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { pluginId } = req.params;

      // Get plugin by ID
      const plugin = await storage.getPluginById(pluginId);
      if (!plugin || !plugin.downloadUrl) {
        return res.status(404).json({ message: "Plugin file not found" });
      }

      // Check if user has active subscription for this plugin
      const subscriptions = await storage.getUserSubscriptions(userId);
      const hasActiveSubscription = subscriptions.some(
        s => s.pluginId === pluginId && s.status === 'active'
      );

      if (!hasActiveSubscription) {
        return res.status(403).json({ message: "No active subscription for this plugin" });
      }

      // Record download
      await storage.recordDownload({ userId, pluginId: plugin.id, version: plugin.version });

      // Serve file - normalize path by removing leading slash if present
      const normalizedPath = plugin.downloadUrl.startsWith('/') 
        ? plugin.downloadUrl.substring(1) 
        : plugin.downloadUrl;
      const filePath = path.join(process.cwd(), normalizedPath);
      
      try {
        await fs.access(filePath);
        res.download(filePath, `${plugin.slug}-v${plugin.version}.zip`);
      } catch {
        res.status(404).json({ message: "File not found on server" });
      }
    } catch (error) {
      console.error("Error downloading plugin:", error);
      res.status(500).json({ message: "Failed to download plugin" });
    }
  });

  // ==================== ADMIN PLUGIN ROUTES ====================
  app.get('/api/admin/plugins', isAuthenticated, isAdmin, async (_req, res) => {
    try {
      const plugins = await storage.getAllPlugins();
      res.json(plugins);
    } catch (error) {
      console.error("Error fetching plugins:", error);
      res.status(500).json({ message: "Failed to fetch plugins" });
    }
  });

  app.post('/api/admin/plugins/upload', isAuthenticated, isAdmin, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Store relative path without leading slash for path.join to work correctly
      const fileUrl = `uploads/plugins/${req.file.filename}`;
      res.json({ downloadUrl: fileUrl, filename: req.file.filename });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Upload plugin image (admin only)
  app.post('/api/admin/plugins/upload-image', isAuthenticated, isAdmin, uploadImage.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image uploaded" });
      }

      // Return relative URL that works with /uploads static route
      const imageUrl = `uploads/images/${req.file.filename}`;
      res.json({ imageUrl, filename: req.file.filename });
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  app.post('/api/admin/plugins', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const data = insertPluginSchema.parse(req.body);
      const plugin = await storage.createPlugin(data);
      res.json(plugin);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.warn("Validation error creating plugin:", error.errors);
        return res.status(422).json({ message: "Invalid plugin data", errors: error.errors });
      }
      console.error("Error creating plugin:", error);
      res.status(500).json({ message: "Failed to create plugin" });
    }
  });

  app.put('/api/admin/plugins/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const plugin = await storage.updatePlugin(req.params.id, req.body);
      if (!plugin) {
        return res.status(404).json({ message: "Plugin not found" });
      }
      res.json(plugin);
    } catch (error) {
      console.error("Error updating plugin:", error);
      res.status(500).json({ message: "Failed to update plugin" });
    }
  });

  app.delete('/api/admin/plugins/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deletePlugin(req.params.id);
      res.json({ message: "Plugin deleted successfully" });
    } catch (error) {
      console.error("Error deleting plugin:", error);
      res.status(500).json({ message: "Failed to delete plugin" });
    }
  });

  // ==================== ADMIN USER ROUTES ====================
  app.get('/api/admin/users', isAuthenticated, isAdmin, async (_req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.put('/api/admin/users/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { isAdmin: newAdminStatus } = req.body;
      const user = await storage.updateUser(req.params.id, { isAdmin: newAdminStatus });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // ==================== ADMIN SETTINGS ROUTES ====================
  app.get('/api/admin/settings', isAuthenticated, isAdmin, async (_req, res) => {
    try {
      const settings = await storage.getAllSettings();
      // Mask secret values
      const maskedSettings = settings.map(s => ({
        ...s,
        value: s.isSecret ? '••••••••' : s.value,
      }));
      res.json(maskedSettings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.post('/api/admin/settings', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { settings: settingsData } = req.body;
      
      if (!Array.isArray(settingsData)) {
        return res.status(400).json({ message: "Settings must be an array" });
      }

      await storage.upsertSettings(settingsData);
      res.json({ message: "Settings saved successfully" });
    } catch (error) {
      console.error("Error saving settings:", error);
      res.status(500).json({ message: "Failed to save settings" });
    }
  });

  // ==================== PAYMENT CHECKOUT ROUTES ====================

  // ==================== PAYMENT CHECKOUT ROUTES ====================
  app.post('/api/checkout/create-payment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { pluginId, planType } = req.body;
      
      if (!pluginId || !planType) {
        return res.status(400).json({ message: "Plugin ID and plan type are required" });
      }

      const plugin = await storage.getPluginById(pluginId);
      if (!plugin) {
        return res.status(404).json({ message: "Plugin not found" });
      }

      // Get default payment provider
      const provider = await storage.getDefaultPaymentProvider();
      
      if (!provider) {
        return res.status(400).json({ 
          message: "No payment provider configured. Please contact support or configure a payment provider in admin settings." 
        });
      }

      // Calculate price based on plan type
      let originalAmount = 0;
      if (planType === 'monthly' && plugin.monthlyPrice) {
        originalAmount = parseFloat(plugin.monthlyPrice);
      } else if (planType === 'yearly' && plugin.yearlyPrice) {
        originalAmount = parseFloat(plugin.yearlyPrice);
      } else if (planType === 'lifetime' && plugin.price) {
        originalAmount = parseFloat(plugin.price);
      } else {
        return res.status(400).json({ message: "Invalid plan type or price not available" });
      }

      let finalAmount = originalAmount;

      // Create payment service instance
      const paymentService = PaymentServiceFactory.createService(provider);

      // Create payment request
      const paymentRequest = {
        amount: finalAmount,
        currency: 'BRL',
        description: `${plugin.name} - ${planType} plan`,
        userId: user.id,
        userEmail: user.email || '',
        pluginId: plugin.id,
        planType: planType as 'monthly' | 'yearly' | 'lifetime',
        metadata: {
          pluginSlug: plugin.slug,
          planType,
          originalAmount: originalAmount.toString(),
        }
      };

      // Process payment
      const paymentResponse = await paymentService.createPayment(paymentRequest);

      if (!paymentResponse.success) {
        return res.status(400).json({ 
          message: paymentResponse.error || "Failed to create payment" 
        });
      }

      res.json({
        ...paymentResponse,
        provider: provider.type,
        providerName: provider.displayName,
        pricing: {
          originalAmount,
          finalAmount,
          // Coupons removed: no discount fields
        }
      });
    } catch (error) {
      console.error("Error creating payment:", error);
      res.status(500).json({ message: "Failed to create payment" });
    }
  });

  // Subscribe endpoint with coupon support
  app.post('/api/checkout/subscribe', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { pluginId, planType, couponCode } = req.body;
      
      if (!pluginId || !planType) {
        return res.status(400).json({ message: "Plugin ID and plan type are required" });
      }

      const plugin = await storage.getPluginById(pluginId);
      if (!plugin) {
        return res.status(404).json({ message: "Plugin not found" });
      }

      // Get default payment provider
      const provider = await storage.getDefaultPaymentProvider();
      
      if (!provider) {
        return res.status(400).json({ 
          message: "No payment provider configured. Please contact support or configure a payment provider in admin settings." 
        });
      }

      // Calculate price based on plan type
      let originalAmount = 0;
      if (planType === 'monthly' && plugin.monthlyPrice) {
        originalAmount = parseFloat(plugin.monthlyPrice);
      } else if (planType === 'yearly' && plugin.yearlyPrice) {
        originalAmount = parseFloat(plugin.yearlyPrice);
      } else if (planType === 'lifetime' && plugin.price) {
        originalAmount = parseFloat(plugin.price);
      } else {
        return res.status(400).json({ message: "Invalid plan type or price not available" });
      }

      let finalAmount = originalAmount;
      let discountAmount = 0;
      let couponData = null;

      // Validate and apply coupon if provided
      if (couponCode && typeof couponCode === 'string' && couponCode.trim()) {
        const couponResult = await storage.validateCoupon({
          code: couponCode.trim(),
          userId,
          amount: originalAmount,
          pluginId: plugin.id
        });

        if (!couponResult.valid) {
          return res.status(400).json({ 
            message: couponResult.reason || "Cupom inválido" 
          });
        }

        finalAmount = couponResult.finalAmount || originalAmount;
        discountAmount = couponResult.discountAmount || 0;
        couponData = couponResult.coupon;
      }

      // Create payment service instance
      const paymentService = PaymentServiceFactory.createService(provider);

      // Create payment request
      const paymentRequest = {
        amount: finalAmount,
        currency: 'BRL',
        description: `${plugin.name} - ${planType} plan`,
        userId: user.id,
        userEmail: user.email || '',
        pluginId: plugin.id,
        planType: planType as 'monthly' | 'yearly' | 'lifetime',
        metadata: {
          pluginSlug: plugin.slug,
          planType,
          originalAmount: originalAmount.toString(),
          finalAmount: finalAmount.toString(),
          discountAmount: discountAmount.toString(),
          couponCode: couponData?.code || null,
          couponId: couponData?.id || null,
        }
      };

      // Process payment
      const paymentResponse = await paymentService.createPayment(paymentRequest);

      if (!paymentResponse.success) {
        return res.status(400).json({ 
          message: paymentResponse.error || "Failed to create payment" 
        });
      }

      res.json({
        success: true,
        paymentUrl: paymentResponse.checkoutUrl || paymentResponse.clientSecret,
        provider: provider.type,
        providerName: provider.displayName,
        pricing: {
          originalAmount,
          finalAmount,
          discountAmount,
          couponApplied: !!couponData
        }
      });
    } catch (error) {
      console.error("Error creating subscription payment:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  app.post('/api/checkout/webhook/:providerId', async (req, res) => {
    try {
      const { providerId } = req.params;
      const provider = await storage.getPaymentProviderById(providerId);
      
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }

      const paymentService = PaymentServiceFactory.createService(provider);
      const signature = req.headers['x-signature'] as string;
      
      const webhookData = await paymentService.verifyWebhook(req.body, signature);

      // Handle successful payment
      if (webhookData.status === 'success' && webhookData.userId && webhookData.pluginId) {
        // Create subscription
        const subscription = await storage.createSubscription({
          userId: webhookData.userId,
          pluginId: webhookData.pluginId,
          planType: webhookData.metadata?.planType || 'monthly',
          status: 'active',
          price: webhookData.metadata?.amount || '0',
          autoRenew: true,
        });

        // Create license
        const licenseKey = storage.generateLicenseKey();
        await storage.createLicense({
          userId: webhookData.userId,
          pluginId: webhookData.pluginId,
          subscriptionId: subscription.id,
          licenseKey,
          maxDomains: 1,
          status: 'active',
        });

        // Record coupon usage if coupon was applied
        if (webhookData.metadata?.couponId && webhookData.metadata?.couponCode) {
          try {
            const originalAmount = parseFloat(webhookData.metadata?.originalAmount || '0');
            const finalAmount = parseFloat(webhookData.metadata?.finalAmount || '0');
            const discountAmount = parseFloat(webhookData.metadata?.discountAmount || '0');

            await storage.recordCouponUsage({
              couponId: webhookData.metadata.couponId,
              userId: webhookData.userId,
              subscriptionId: subscription.id,
              originalAmount: originalAmount.toString(),
              finalAmount: finalAmount.toString(),
              discountAmount: discountAmount.toString(),
            });

            console.log(`Coupon ${webhookData.metadata.couponCode} recorded for user ${webhookData.userId}`);
          } catch (couponError) {
            console.error('Error recording coupon usage:', couponError);
            // Don't fail the webhook if coupon recording fails
          }
        }

        console.log(`Payment processed successfully for user ${webhookData.userId}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Error processing webhook:", error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  // ==================== ADMIN PAYMENT PROVIDER ROUTES ====================
  app.get('/api/admin/payment-providers', isAuthenticated, isAdmin, async (_req, res) => {
    try {
      const providers = await storage.getAllPaymentProviders();
      res.json(providers);
    } catch (error) {
      console.error("Error fetching payment providers:", error);
      res.status(500).json({ message: "Failed to fetch payment providers" });
    }
  });

  app.get('/api/admin/payment-providers/active', isAuthenticated, isAdmin, async (_req, res) => {
    try {
      const providers = await storage.getActivePaymentProviders();
      res.json(providers);
    } catch (error) {
      console.error("Error fetching active payment providers:", error);
      res.status(500).json({ message: "Failed to fetch active payment providers" });
    }
  });

  app.get('/api/admin/payment-providers/default', isAuthenticated, isAdmin, async (_req, res) => {
    try {
      const provider = await storage.getDefaultPaymentProvider();
      res.json(provider || null);
    } catch (error) {
      console.error("Error fetching default payment provider:", error);
      res.status(500).json({ message: "Failed to fetch default payment provider" });
    }
  });

  app.get('/api/admin/payment-providers/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const provider = await storage.getPaymentProviderById(req.params.id);
      if (!provider) {
        return res.status(404).json({ message: "Payment provider not found" });
      }
      res.json(provider);
    } catch (error) {
      console.error("Error fetching payment provider:", error);
      res.status(500).json({ message: "Failed to fetch payment provider" });
    }
  });

  app.post('/api/admin/payment-providers', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const data = insertPaymentProviderSchema.parse(req.body);
      const provider = await storage.createPaymentProvider(data);
      res.json(provider);
    } catch (error) {
      console.error("Error creating payment provider:", error);
      res.status(500).json({ message: "Failed to create payment provider" });
    }
  });

  app.put('/api/admin/payment-providers/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const provider = await storage.updatePaymentProvider(req.params.id, req.body);
      if (!provider) {
        return res.status(404).json({ message: "Payment provider not found" });
      }
      res.json(provider);
    } catch (error) {
      console.error("Error updating payment provider:", error);
      res.status(500).json({ message: "Failed to update payment provider" });
    }
  });

  app.delete('/api/admin/payment-providers/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deletePaymentProvider(req.params.id);
      res.json({ message: "Payment provider deleted successfully" });
    } catch (error) {
      console.error("Error deleting payment provider:", error);
      res.status(500).json({ message: "Failed to delete payment provider" });
    }
  });

  app.post('/api/admin/payment-providers/:id/set-default', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.setDefaultPaymentProvider(req.params.id);
      res.json({ message: "Default payment provider set successfully" });
    } catch (error) {
      console.error("Error setting default payment provider:", error);
      res.status(500).json({ message: "Failed to set default payment provider" });
    }
  });

  // ==================== COUPONS ROUTES ====================
  // Public coupon validation (requires auth to check per-user limits)
  app.post('/api/coupons/validate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { code, amount, pluginId } = req.body || {};

      if (!code || typeof code !== 'string') {
        return res.status(400).json({ message: 'Código do cupom é obrigatório' });
      }
      const numericAmount = Number(amount);
      if (Number.isNaN(numericAmount) || numericAmount < 0) {
        return res.status(400).json({ message: 'Valor inválido para validação' });
      }

      const result = await storage.validateCoupon({ code, userId, amount: numericAmount, pluginId });
      return res.json(result);
    } catch (error) {
      console.error('Error validating coupon:', error);
      return res.status(500).json({ message: 'Falha ao validar cupom' });
    }
  });

  // Admin CRUD for coupons
  app.get('/api/admin/coupons', isAuthenticated, isAdmin, async (_req, res) => {
    try {
      const list = await storage.listCoupons();
      res.json(list);
    } catch (error) {
      console.error('Error listing coupons:', error);
      res.status(500).json({ message: 'Falha ao listar cupons' });
    }
  });

  // Normalize payload types for coupon endpoints (decimals as strings, dates as Date)
  function normalizeCouponBody(body: any) {
    const payload: any = { ...body };
    for (const field of ['discountValue', 'minimumAmount', 'maximumDiscount']) {
      if (payload[field] === '' || payload[field] === null || typeof payload[field] === 'undefined') {
        delete payload[field];
      } else if (typeof payload[field] === 'number') {
        payload[field] = payload[field].toString();
      }
    }
    for (const dateField of ['startsAt', 'expiresAt']) {
      const val = payload[dateField];
      if (val === '' || val === null || typeof val === 'undefined') {
        delete payload[dateField];
      } else if (typeof val === 'string') {
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
          payload[dateField] = d;
        } else {
          delete payload[dateField];
        }
      }
    }
    if (payload.usageLimit === '' || payload.usageLimit === null) {
      delete payload.usageLimit;
    } else if (typeof payload.usageLimit === 'string') {
      const n = Number(payload.usageLimit);
      payload.usageLimit = Number.isFinite(n) ? n : undefined;
      if (typeof payload.usageLimit === 'undefined') delete payload.usageLimit;
    }
    return payload;
  }

  app.post('/api/admin/coupons', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const normalized = normalizeCouponBody(req.body);
      console.log('[AdminCoupons] POST raw body:', req.body);
      console.log('[AdminCoupons] POST normalized body:', normalized);
      const data = insertCouponSchema.parse(normalized);
      const created = await storage.createCoupon(data);
      res.status(201).json(created);
    } catch (error: any) {
      if (error?.issues) {
        console.warn('[AdminCoupons] POST validation issues:', error.issues);
        return res.status(400).json({ message: 'Dados inválidos', details: error.issues });
      }
      console.error('Error creating coupon:', error);
      res.status(500).json({ message: 'Falha ao criar cupom' });
    }
  });

  app.put('/api/admin/coupons/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = req.params.id;
      const normalized = normalizeCouponBody(req.body);
      console.log('[AdminCoupons] PUT raw body:', req.body);
      console.log('[AdminCoupons] PUT normalized body:', normalized);
      const data = insertCouponSchema.partial().parse(normalized);
      const updated = await storage.updateCoupon(id, data);
      res.json(updated);
    } catch (error: any) {
      if (error?.issues) {
        console.warn('[AdminCoupons] PUT validation issues:', error.issues);
        return res.status(400).json({ message: 'Dados inválidos', details: error.issues });
      }
      console.error('Error updating coupon:', error);
      res.status(500).json({ message: 'Falha ao atualizar cupom' });
    }
  });

  app.delete('/api/admin/coupons/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteCoupon(req.params.id);
      res.json({ message: 'Cupom excluído com sucesso' });
    } catch (error) {
      console.error('Error deleting coupon:', error);
      res.status(500).json({ message: 'Falha ao excluir cupom' });
    }
  });

  // ==================== ADMIN REPORTS ROUTES ====================
  app.get('/api/admin/reports/overview', isAuthenticated, isAdmin, async (_req, res) => {
    try {
      const overview = await storage.getReportsOverview();
      res.json(overview);
    } catch (error) {
      console.error("Error fetching reports overview:", error);
      res.status(500).json({ message: "Failed to fetch reports overview" });
    }
  });

  app.get('/api/admin/reports/sales', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { period = '30d', startDate, endDate } = req.query;
      const salesData = await storage.getSalesReport(period as string, startDate as string, endDate as string);
      res.json(salesData);
    } catch (error) {
      console.error("Error fetching sales report:", error);
      res.status(500).json({ message: "Failed to fetch sales report" });
    }
  });

  app.get('/api/admin/reports/revenue', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { period = '12m' } = req.query;
      const revenueData = await storage.getRevenueReport(period as string);
      res.json(revenueData);
    } catch (error) {
      console.error("Error fetching revenue report:", error);
      res.status(500).json({ message: "Failed to fetch revenue report" });
    }
  });

  app.get('/api/admin/reports/plugins', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { limit = '10' } = req.query;
      const pluginsData = await storage.getTopPluginsReport(parseInt(limit as string));
      res.json(pluginsData);
    } catch (error) {
      console.error("Error fetching plugins report:", error);
      res.status(500).json({ message: "Failed to fetch plugins report" });
    }
  });

  app.get('/api/admin/reports/users', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { period = '30d' } = req.query;
      const usersData = await storage.getUsersReport(period as string);
      res.json(usersData);
    } catch (error) {
      console.error("Error fetching users report:", error);
      res.status(500).json({ message: "Failed to fetch users report" });
    }
  });

  app.get('/api/admin/reports/conversion', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { period = '30d' } = req.query;
      const conversionData = await storage.getConversionReport(period as string);
      res.json(conversionData);
    } catch (error) {
      console.error("Error fetching conversion report:", error);
      res.status(500).json({ message: "Failed to fetch conversion report" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
