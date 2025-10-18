// Reference: javascript_database and javascript_log_in_with_replit blueprints
import {
  users,
  plugins,
  subscriptions,
  licenses,
  downloads,
  settings,
  paymentProviders,
  coupons,
  couponUsages,
  type User,
  type UpsertUser,
  type InsertUser,
  type Plugin,
  type InsertPlugin,
  type Subscription,
  type InsertSubscription,
  type License,
  type InsertLicense,
  type InsertDownload,
  type Setting,
  type InsertSetting,
  type PaymentProvider,
  type InsertPaymentProvider,
  type Coupon,
  type InsertCoupon,
  type CouponUsage,
  type InsertCouponUsage,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { randomBytes } from "crypto";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<UpsertUser>): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  sessionStore: session.Store;

  // Plugin operations
  getAllPlugins(): Promise<Plugin[]>;
  getActivePlugins(): Promise<Plugin[]>;
  getPluginById(id: string): Promise<Plugin | undefined>;
  getPluginBySlug(slug: string): Promise<Plugin | undefined>;
  createPlugin(plugin: InsertPlugin): Promise<Plugin>;
  updatePlugin(id: string, plugin: Partial<InsertPlugin>): Promise<Plugin | undefined>;
  deletePlugin(id: string): Promise<void>;

  // Subscription operations
  getUserSubscriptions(userId: string): Promise<Subscription[]>;
  getSubscriptionById(id: string): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  deleteSubscription(id: string): Promise<void>;

  // License operations
  getUserLicenses(userId: string): Promise<License[]>;
  getLicenseByKey(key: string): Promise<License | undefined>;
  createLicense(license: InsertLicense): Promise<License>;
  generateLicenseKey(): string;

  // Download operations
  recordDownload(download: InsertDownload): Promise<void>;

  // Settings operations
  getAllSettings(): Promise<Setting[]>;
  getSettingByKey(key: string): Promise<Setting | undefined>;
  upsertSetting(setting: InsertSetting): Promise<Setting>;
  upsertSettings(settings: InsertSetting[]): Promise<void>;

  // Payment Provider operations
  getAllPaymentProviders(): Promise<PaymentProvider[]>;
  getActivePaymentProviders(): Promise<PaymentProvider[]>;
  getDefaultPaymentProvider(): Promise<PaymentProvider | undefined>;
  getPaymentProviderById(id: string): Promise<PaymentProvider | undefined>;
  getPaymentProviderByType(type: string): Promise<PaymentProvider | undefined>;
  createPaymentProvider(provider: InsertPaymentProvider): Promise<PaymentProvider>;
  updatePaymentProvider(id: string, provider: Partial<InsertPaymentProvider>): Promise<PaymentProvider | undefined>;
  deletePaymentProvider(id: string): Promise<void>;
  setDefaultPaymentProvider(id: string): Promise<void>;

  // Coupon operations
  listCoupons(): Promise<Coupon[]>;
  getCouponByCode(code: string): Promise<Coupon | undefined>;
  createCoupon(coupon: InsertCoupon): Promise<Coupon>;
  updateCoupon(id: string, coupon: Partial<InsertCoupon>): Promise<Coupon | undefined>;
  deleteCoupon(id: string): Promise<void>;
  validateCoupon(params: { code: string; userId: string; amount: number; pluginId?: string }): Promise<{ valid: boolean; reason?: string; discountAmount?: number; finalAmount?: number; coupon?: Coupon }>;
  recordCouponUsage(usage: InsertCouponUsage): Promise<CouponUsage>;

  // Reports operations
  getReportsOverview(): Promise<any>;
  getSalesReport(period: string, startDate?: string, endDate?: string): Promise<any>;
  getRevenueReport(period: string): Promise<any>;
  getTopPluginsReport(limit: number): Promise<any>;
  getUsersReport(period: string): Promise<any>;
  getConversionReport(period: string): Promise<any>;
}

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool,
      tableName: 'sessions', // Use Drizzle's table name
      createTableIfMissing: false // Table is managed by Drizzle schema
    });
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<UpsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Plugin operations
  async getAllPlugins(): Promise<Plugin[]> {
    return await db.select().from(plugins).orderBy(desc(plugins.createdAt));
  }

  async getActivePlugins(): Promise<Plugin[]> {
    return await db.select().from(plugins).where(eq(plugins.isActive, true)).orderBy(desc(plugins.isFeatured), desc(plugins.createdAt));
  }

  async getPluginById(id: string): Promise<Plugin | undefined> {
    const [plugin] = await db.select().from(plugins).where(eq(plugins.id, id));
    return plugin;
  }

  async getPluginBySlug(slug: string): Promise<Plugin | undefined> {
    const [plugin] = await db.select().from(plugins).where(eq(plugins.slug, slug));
    return plugin;
  }

  async createPlugin(pluginData: InsertPlugin): Promise<Plugin> {
    const [plugin] = await db.insert(plugins).values(pluginData).returning();
    return plugin;
  }

  async updatePlugin(id: string, pluginData: Partial<InsertPlugin>): Promise<Plugin | undefined> {
    const [plugin] = await db
      .update(plugins)
      .set({ ...pluginData, updatedAt: new Date() })
      .where(eq(plugins.id, id))
      .returning();
    return plugin;
  }

  async deletePlugin(id: string): Promise<void> {
    await db.delete(plugins).where(eq(plugins.id, id));
  }

  // Subscription operations
  async getUserSubscriptions(userId: string): Promise<Subscription[]> {
    return await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).orderBy(desc(subscriptions.createdAt));
  }

  async getSubscriptionById(id: string): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.id, id));
    return subscription;
  }

  async createSubscription(subscriptionData: InsertSubscription): Promise<Subscription> {
    const [subscription] = await db.insert(subscriptions).values(subscriptionData).returning();
    return subscription;
  }

  async deleteSubscription(id: string): Promise<void> {
    // Update status to cancelled instead of deleting
    await db.update(subscriptions).set({ status: 'cancelled', updatedAt: new Date() }).where(eq(subscriptions.id, id));
  }

  // License operations
  async getUserLicenses(userId: string): Promise<License[]> {
    return await db.select().from(licenses).where(eq(licenses.userId, userId)).orderBy(desc(licenses.createdAt));
  }

  async getLicenseByKey(key: string): Promise<License | undefined> {
    const [license] = await db.select().from(licenses).where(eq(licenses.licenseKey, key));
    return license;
  }

  async createLicense(licenseData: InsertLicense): Promise<License> {
    const [license] = await db.insert(licenses).values(licenseData).returning();
    return license;
  }

  async updateLicense(id: string, updates: Partial<InsertLicense>): Promise<License | undefined> {
    const [license] = await db
      .update(licenses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(licenses.id, id))
      .returning();
    return license;
  }

  async activateLicenseDomain(licenseKey: string, domain: string): Promise<License | undefined> {
    const license = await this.getLicenseByKey(licenseKey);
    if (!license) return undefined;

    const activatedDomains = license.activatedDomains || [];
    if (activatedDomains.includes(domain)) {
      return license; // Already activated
    }

    if (activatedDomains.length >= (license.maxDomains || 1)) {
      return undefined; // Max domains reached
    }

    return await this.updateLicense(license.id, {
      activatedDomains: [...activatedDomains, domain],
    });
  }

  generateLicenseKey(): string {
    const segments = [];
    for (let i = 0; i < 4; i++) {
      segments.push(randomBytes(4).toString('hex').toUpperCase());
    }
    return segments.join('-');
  }

  // Download operations
  async recordDownload(downloadData: InsertDownload): Promise<void> {
    await db.insert(downloads).values(downloadData);
    
    // Increment download count
    const plugin = await db.select().from(plugins).where(eq(plugins.id, downloadData.pluginId));
    if (plugin[0]) {
      await db.update(plugins)
        .set({ downloadCount: (plugin[0].downloadCount || 0) + 1 })
        .where(eq(plugins.id, downloadData.pluginId));
    }
  }

  // Settings operations
  async getAllSettings(): Promise<Setting[]> {
    return await db.select().from(settings);
  }

  async getSettingByKey(key: string): Promise<Setting | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting;
  }

  async upsertSetting(settingData: InsertSetting): Promise<Setting> {
    const [setting] = await db
      .insert(settings)
      .values(settingData)
      .onConflictDoUpdate({
        target: settings.key,
        set: {
          ...settingData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return setting;
  }

  async upsertSettings(settingsData: InsertSetting[]): Promise<void> {
    for (const setting of settingsData) {
      await this.upsertSetting(setting);
    }
  }

  // Payment Provider operations
  async getAllPaymentProviders(): Promise<PaymentProvider[]> {
    return await db.select().from(paymentProviders).orderBy(desc(paymentProviders.isDefault), desc(paymentProviders.createdAt));
  }

  async getActivePaymentProviders(): Promise<PaymentProvider[]> {
    return await db.select().from(paymentProviders).where(eq(paymentProviders.isActive, true)).orderBy(desc(paymentProviders.isDefault), desc(paymentProviders.createdAt));
  }

  async getDefaultPaymentProvider(): Promise<PaymentProvider | undefined> {
    const [provider] = await db.select().from(paymentProviders).where(and(eq(paymentProviders.isActive, true), eq(paymentProviders.isDefault, true)));
    return provider;
  }

  async getPaymentProviderById(id: string): Promise<PaymentProvider | undefined> {
    const [provider] = await db.select().from(paymentProviders).where(eq(paymentProviders.id, id));
    return provider;
  }

  async getPaymentProviderByType(type: string): Promise<PaymentProvider | undefined> {
    const [provider] = await db.select().from(paymentProviders).where(eq(paymentProviders.type, type));
    return provider;
  }

  async createPaymentProvider(providerData: InsertPaymentProvider): Promise<PaymentProvider> {
    const [provider] = await db.insert(paymentProviders).values(providerData).returning();
    return provider;
  }

  async updatePaymentProvider(id: string, providerData: Partial<InsertPaymentProvider>): Promise<PaymentProvider | undefined> {
    const [provider] = await db
      .update(paymentProviders)
      .set({ ...providerData, updatedAt: new Date() })
      .where(eq(paymentProviders.id, id))
      .returning();
    return provider;
  }

  async deletePaymentProvider(id: string): Promise<void> {
    await db.delete(paymentProviders).where(eq(paymentProviders.id, id));
  }

  async setDefaultPaymentProvider(id: string): Promise<void> {
    await db.update(paymentProviders).set({ isDefault: false });
    await db.update(paymentProviders).set({ isDefault: true }).where(eq(paymentProviders.id, id));
  }

  // ==================== REPORTS METHODS ====================
  async getReportsOverview(): Promise<any> {
    try {
      // Total users
      const totalUsers = await db.select().from(users);
      
      // Total plugins
      const totalPlugins = await db.select().from(plugins);
      
      // Active subscriptions
      const activeSubscriptions = await db.select().from(subscriptions);
      
      // Total downloads
      const totalDownloads = await db.select().from(downloads);
      
      // Calculate total revenue (assuming subscriptions have a price field)
      const totalRevenue = activeSubscriptions.reduce((sum, sub) => sum + Number(sub.price || 0), 0);
      
      return {
        totalUsers: totalUsers.length,
        totalPlugins: totalPlugins.length,
        activeSubscriptions: activeSubscriptions.length,
        totalDownloads: totalDownloads.length,
        totalRevenue: totalRevenue,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error("Error getting reports overview:", error);
      throw error;
    }
  }

  // ==================== COUPONS METHODS ====================
  private normalizeCouponCode(code: string): string {
    return (code || '').trim().toUpperCase();
  }
  async listCoupons(): Promise<Coupon[]> {
    return await db.select().from(coupons).orderBy(desc(coupons.createdAt));
  }

  async getCouponByCode(code: string): Promise<Coupon | undefined> {
    const normalized = this.normalizeCouponCode(code);
    const [coupon] = await db.select().from(coupons).where(eq(coupons.code, normalized));
    return coupon;
  }

  async createCoupon(couponData: InsertCoupon): Promise<Coupon> {
    const payload: InsertCoupon = {
      ...couponData,
      code: this.normalizeCouponCode(couponData.code),
    } as InsertCoupon;
    const [coupon] = await db.insert(coupons).values(payload).returning();
    return coupon;
  }

  async updateCoupon(id: string, couponData: Partial<InsertCoupon>): Promise<Coupon | undefined> {
    const payload: Partial<InsertCoupon> = { ...couponData };
    if (payload.code) {
      payload.code = this.normalizeCouponCode(payload.code as string);
    }
    const [coupon] = await db
      .update(coupons)
      .set({ ...payload, updatedAt: new Date() })
      .where(eq(coupons.id, id))
      .returning();
    return coupon;
  }

  async deleteCoupon(id: string): Promise<void> {
    await db.delete(coupons).where(eq(coupons.id, id));
  }

  async validateCoupon(params: { code: string; userId: string; amount: number; pluginId?: string }): Promise<{ valid: boolean; reason?: string; discountAmount?: number; finalAmount?: number; coupon?: Coupon }> {
    const { code, userId, amount, pluginId } = params;
    const normalizedCode = this.normalizeCouponCode(code);
    console.log('[Coupons] Validate request', { code: normalizedCode, userId, amount, pluginId });
    const coupon = await this.getCouponByCode(normalizedCode);
    if (!coupon) {
      console.warn('[Coupons] Invalid: not found', { code: normalizedCode });
      return { valid: false, reason: "Cupom não encontrado" };
    }
    if (!coupon.isActive) {
      console.warn('[Coupons] Invalid: inactive', { code: normalizedCode });
      return { valid: false, reason: "Cupom inativo" };
    }

    const now = new Date();
    if (coupon.startsAt && now < new Date(coupon.startsAt)) {
      console.warn('[Coupons] Invalid: not started', { code: normalizedCode });
      return { valid: false, reason: "Cupom ainda não começou" };
    }
    if (coupon.expiresAt && now > new Date(coupon.expiresAt)) {
      console.warn('[Coupons] Invalid: expired', { code: normalizedCode });
      return { valid: false, reason: "Cupom expirado" };
    }

    if (coupon.usageLimit != null && (coupon.usageCount || 0) >= coupon.usageLimit) {
      console.warn('[Coupons] Invalid: usage limit reached', { code: normalizedCode });
      return { valid: false, reason: "Limite de uso do cupom atingido" };
    }

    // Check user usage
    const userUsages = await db
      .select()
      .from(couponUsages)
      .where(and(eq(couponUsages.couponId, coupon.id), eq(couponUsages.userId, userId)));
    if (coupon.userUsageLimit != null && userUsages.length >= coupon.userUsageLimit) {
      console.warn('[Coupons] Invalid: per-user limit reached', { code: normalizedCode, userId });
      return { valid: false, reason: "Você já utilizou este cupom o máximo permitido" };
    }

    // Check applicable plugins
    if (coupon.applicablePlugins && coupon.applicablePlugins.length > 0) {
      if (!pluginId || !coupon.applicablePlugins.includes(pluginId)) {
        console.warn('[Coupons] Invalid: not applicable to plugin', { code: normalizedCode, pluginId });
        return { valid: false, reason: "Cupom não aplicável a este plugin" };
      }
    }

    // Check minimum amount
    if (coupon.minimumAmount != null && amount < Number(coupon.minimumAmount)) {
      console.warn('[Coupons] Invalid: below minimum amount', { code: normalizedCode, amount, minimum: Number(coupon.minimumAmount) });
      return { valid: false, reason: "Valor abaixo do mínimo para usar o cupom" };
    }

    // Calculate discount
    const value = Number(coupon.discountValue);
    let discountAmount = 0;
    if (coupon.discountType === "percentage") {
      discountAmount = amount * (value / 100);
    } else {
      discountAmount = value;
    }

    if (coupon.maximumDiscount != null) {
      discountAmount = Math.min(discountAmount, Number(coupon.maximumDiscount));
    }

    const finalAmount = Math.max(0, amount - discountAmount);
    console.log('[Coupons] Valid', { code: normalizedCode, discountAmount, finalAmount });
    return { valid: true, discountAmount, finalAmount, coupon };
  }

  async recordCouponUsage(usage: InsertCouponUsage): Promise<CouponUsage> {
    const [created] = await db.insert(couponUsages).values(usage).returning();
    // Increment usage count
    const currentCoupon = await db.select().from(coupons).where(eq(coupons.id, usage.couponId));
    const existing = currentCoupon[0];
    if (existing) {
      await db
        .update(coupons)
        .set({ usageCount: (existing.usageCount || 0) + 1, updatedAt: new Date() })
        .where(eq(coupons.id, usage.couponId));
    }
    return created as unknown as CouponUsage;
  }

  async getSalesReport(period: string, startDate?: string, endDate?: string): Promise<any> {
    try {
      let dateFilter = '';
      const now = new Date();
      
      if (startDate && endDate) {
        dateFilter = `AND created_at BETWEEN '${startDate}' AND '${endDate}'`;
      } else {
        switch (period) {
          case '7d':
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            dateFilter = `AND created_at >= '${sevenDaysAgo.toISOString()}'`;
            break;
          case '30d':
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            dateFilter = `AND created_at >= '${thirtyDaysAgo.toISOString()}'`;
            break;
          case '90d':
            const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            dateFilter = `AND created_at >= '${ninetyDaysAgo.toISOString()}'`;
            break;
        }
      }

      const query = `
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as sales,
          SUM(price) as revenue
        FROM subscriptions 
        WHERE 1=1 ${dateFilter}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `;

      const result = await pool.query(query);
      
      return {
        period,
        data: result.rows,
        totalSales: result.rows.reduce((sum: number, row: any) => sum + parseInt(row.sales), 0),
        totalRevenue: result.rows.reduce((sum: number, row: any) => sum + parseFloat(row.revenue || 0), 0)
      };
    } catch (error) {
      console.error("Error getting sales report:", error);
      throw error;
    }
  }

  async getRevenueReport(period: string): Promise<any> {
    try {
      let intervalClause = '';
      let groupByClause = '';
      let selectClause = '';
      
      let query = '';
      
      switch (period) {
        case '7d':
          query = `
            SELECT 
              DATE(created_at) as period,
              SUM(price) as revenue,
              COUNT(*) as subscriptions
            FROM subscriptions 
            WHERE created_at >= NOW() - INTERVAL '7 days'
            GROUP BY DATE(created_at)
            ORDER BY period DESC
          `;
          break;
        case '30d':
          query = `
            SELECT 
              DATE(created_at) as period,
              SUM(price) as revenue,
              COUNT(*) as subscriptions
            FROM subscriptions 
            WHERE created_at >= NOW() - INTERVAL '30 days'
            GROUP BY DATE(created_at)
            ORDER BY period DESC
          `;
          break;
        case '90d':
          query = `
            SELECT 
              DATE(created_at) as period,
              SUM(price) as revenue,
              COUNT(*) as subscriptions
            FROM subscriptions 
            WHERE created_at >= NOW() - INTERVAL '90 days'
            GROUP BY DATE(created_at)
            ORDER BY period DESC
          `;
          break;
        default:
          query = `
            SELECT 
              DATE(created_at) as period,
              SUM(price) as revenue,
              COUNT(*) as subscriptions
            FROM subscriptions 
            WHERE created_at >= NOW() - INTERVAL '30 days'
            GROUP BY DATE(created_at)
            ORDER BY period DESC
          `;
      }

      const result = await pool.query(query);
      
      return {
        period,
        data: result.rows,
        totalRevenue: result.rows.reduce((sum: number, row: any) => sum + parseFloat(row.revenue || 0), 0)
      };
    } catch (error) {
      console.error("Error getting revenue report:", error);
      throw error;
    }
  }

  async getTopPluginsReport(limit: number): Promise<any> {
    try {
      const query = `
        SELECT 
          p.id,
          p.name,
          p.slug,
          p.price,
          COUNT(s.id) as subscriptions,
          SUM(s.price) as revenue,
          COUNT(d.id) as downloads
        FROM plugins p
        LEFT JOIN subscriptions s ON p.id = s.plugin_id
        LEFT JOIN downloads d ON p.id = d.plugin_id
        GROUP BY p.id, p.name, p.slug, p.price
        ORDER BY subscriptions DESC, revenue DESC
        LIMIT $1
      `;

      const result = await pool.query(query, [limit]);
      
      return {
        data: result.rows,
        limit
      };
    } catch (error) {
      console.error("Error getting top plugins report:", error);
      throw error;
    }
  }

  async getUsersReport(period: string): Promise<any> {
    try {
      let dateFilter = '';
      const now = new Date();
      
      switch (period) {
        case '7d':
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateFilter = `AND created_at >= '${sevenDaysAgo.toISOString()}'`;
          break;
        case '30d':
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          dateFilter = `AND created_at >= '${thirtyDaysAgo.toISOString()}'`;
          break;
        case '90d':
          const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          dateFilter = `AND created_at >= '${ninetyDaysAgo.toISOString()}'`;
          break;
      }

      const newUsersQuery = `
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as new_users
        FROM users 
        WHERE 1=1 ${dateFilter}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `;

      const totalUsersQuery = `SELECT COUNT(*) as total FROM users`;
      const activeUsersQuery = `
        SELECT COUNT(DISTINCT user_id) as active 
        FROM subscriptions 
        WHERE status = 'active'
      `;

      const [newUsersResult, totalUsersResult, activeUsersResult] = await Promise.all([
        pool.query(newUsersQuery),
        pool.query(totalUsersQuery),
        pool.query(activeUsersQuery)
      ]);
      
      return {
        period,
        newUsers: newUsersResult.rows,
        totalUsers: parseInt(totalUsersResult.rows[0].total),
        activeUsers: parseInt(activeUsersResult.rows[0].active),
        totalNewUsers: newUsersResult.rows.reduce((sum: number, row: any) => sum + parseInt(row.new_users), 0)
      };
    } catch (error) {
      console.error("Error getting users report:", error);
      throw error;
    }
  }

  async getConversionReport(period: string): Promise<any> {
    try {
      let downloadsDateFilter = '';
      let subscriptionsDateFilter = '';
      const now = new Date();
      
      switch (period) {
        case '7d':
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          downloadsDateFilter = `AND downloaded_at >= '${sevenDaysAgo.toISOString()}'`;
          subscriptionsDateFilter = `AND created_at >= '${sevenDaysAgo.toISOString()}'`;
          break;
        case '30d':
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          downloadsDateFilter = `AND downloaded_at >= '${thirtyDaysAgo.toISOString()}'`;
          subscriptionsDateFilter = `AND created_at >= '${thirtyDaysAgo.toISOString()}'`;
          break;
        case '90d':
          const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          downloadsDateFilter = `AND downloaded_at >= '${ninetyDaysAgo.toISOString()}'`;
          subscriptionsDateFilter = `AND created_at >= '${ninetyDaysAgo.toISOString()}'`;
          break;
      }

      const downloadsQuery = `
        SELECT COUNT(*) as total_downloads 
        FROM downloads 
        WHERE 1=1 ${downloadsDateFilter}
      `;

      const subscriptionsQuery = `
        SELECT COUNT(*) as total_subscriptions 
        FROM subscriptions 
        WHERE 1=1 ${subscriptionsDateFilter}
      `;

      const [downloadsResult, subscriptionsResult] = await Promise.all([
        pool.query(downloadsQuery),
        pool.query(subscriptionsQuery)
      ]);

      const totalDownloads = parseInt(downloadsResult.rows[0].total_downloads);
      const totalSubscriptions = parseInt(subscriptionsResult.rows[0].total_subscriptions);
      const conversionRate = totalDownloads > 0 ? (totalSubscriptions / totalDownloads) * 100 : 0;
      
      return {
        period,
        totalDownloads,
        totalSubscriptions,
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        data: {
          downloads: totalDownloads,
          subscriptions: totalSubscriptions,
          rate: conversionRate
        }
      };
    } catch (error) {
      console.error("Error getting conversion report:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
