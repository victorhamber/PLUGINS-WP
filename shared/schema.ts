import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique(),
  password: varchar("password"),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isAdmin: boolean("is_admin").default(false),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  subscriptions: many(subscriptions),
  licenses: many(licenses),
  downloads: many(downloads),
}));

// Plugins table
export const plugins = pgTable("plugins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  longDescription: text("long_description"),
  version: varchar("version", { length: 50 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }),
  yearlyPrice: decimal("yearly_price", { precision: 10, scale: 2 }),
  imageUrl: varchar("image_url"),
  downloadUrl: varchar("download_url"),
  category: varchar("category", { length: 100 }),
  features: text("features").array(),
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  downloadCount: integer("download_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const pluginsRelations = relations(plugins, ({ many }) => ({
  subscriptions: many(subscriptions),
  licenses: many(licenses),
  downloads: many(downloads),
}));

// Subscriptions table
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  pluginId: varchar("plugin_id").notNull().references(() => plugins.id, { onDelete: 'cascade' }),
  planType: varchar("plan_type", { length: 50 }).notNull(), // 'monthly', 'yearly', 'lifetime'
  status: varchar("status", { length: 50 }).notNull().default('active'), // 'active', 'expired', 'cancelled', 'pending'
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  autoRenew: boolean("auto_renew").default(true),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
  plugin: one(plugins, {
    fields: [subscriptions.pluginId],
    references: [plugins.id],
  }),
  licenses: many(licenses),
}));

// Licenses table
export const licenses = pgTable("licenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  pluginId: varchar("plugin_id").notNull().references(() => plugins.id, { onDelete: 'cascade' }),
  subscriptionId: varchar("subscription_id").references(() => subscriptions.id, { onDelete: 'set null' }),
  licenseKey: varchar("license_key", { length: 255 }).notNull().unique(),
  domain: varchar("domain", { length: 255 }),
  maxDomains: integer("max_domains").default(1),
  activatedDomains: text("activated_domains").array().default(sql`ARRAY[]::text[]`),
  status: varchar("status", { length: 50 }).notNull().default('active'), // 'active', 'inactive', 'expired', 'revoked'
  activatedAt: timestamp("activated_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const licensesRelations = relations(licenses, ({ one }) => ({
  user: one(users, {
    fields: [licenses.userId],
    references: [users.id],
  }),
  plugin: one(plugins, {
    fields: [licenses.pluginId],
    references: [plugins.id],
  }),
  subscription: one(subscriptions, {
    fields: [licenses.subscriptionId],
    references: [subscriptions.id],
  }),
}));

// Downloads table
export const downloads = pgTable("downloads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  pluginId: varchar("plugin_id").notNull().references(() => plugins.id, { onDelete: 'cascade' }),
  version: varchar("version", { length: 50 }),
  downloadedAt: timestamp("downloaded_at").defaultNow(),
});

export const downloadsRelations = relations(downloads, ({ one }) => ({
  user: one(users, {
    fields: [downloads.userId],
    references: [users.id],
  }),
  plugin: one(plugins, {
    fields: [downloads.pluginId],
    references: [plugins.id],
  }),
}));

// Settings table for admin configuration
export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  description: text("description"),
  isSecret: boolean("is_secret").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Processed Webhook Events table for idempotency
export const processedWebhookEvents = pgTable("processed_webhook_events", {
  id: varchar("id").primaryKey(), // Stores the event/payment ID
  provider: varchar("provider", { length: 50 }).notNull(), // 'stripe', 'mercadopago', etc
  eventType: varchar("event_type", { length: 100 }), // Event type for debugging
  processedAt: timestamp("processed_at").defaultNow(),
});

// Payment Providers table for flexible payment integration
export const paymentProviders = pgTable("payment_providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'stripe', 'mercadopago', 'hotmart', 'monetizze', 'yampi', 'custom'
  displayName: varchar("display_name", { length: 100 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(false),
  isDefault: boolean("is_default").default(false),
  config: jsonb("config").notNull(), // Flexible JSON config for each provider
  webhookUrl: varchar("webhook_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Coupons tables (recreated)
export const coupons = pgTable("coupons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  discountType: varchar("discount_type", { length: 20 }).notNull(), // 'percentage' | 'fixed'
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  minimumAmount: decimal("minimum_amount", { precision: 10, scale: 2 }),
  maximumDiscount: decimal("maximum_discount", { precision: 10, scale: 2 }),
  usageLimit: integer("usage_limit"),
  usageCount: integer("usage_count").default(0),
  userUsageLimit: integer("user_usage_limit").default(1),
  isActive: boolean("is_active").default(true),
  startsAt: timestamp("starts_at"),
  expiresAt: timestamp("expires_at"),
  applicablePlugins: text("applicable_plugins").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const couponUsages = pgTable("coupon_usages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  couponId: varchar("coupon_id").notNull().references(() => coupons.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  subscriptionId: varchar("subscription_id").references(() => subscriptions.id, { onDelete: 'set null' }),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).notNull(),
  originalAmount: decimal("original_amount", { precision: 10, scale: 2 }).notNull(),
  finalAmount: decimal("final_amount", { precision: 10, scale: 2 }).notNull(),
  usedAt: timestamp("used_at").defaultNow(),
});

export const couponsRelations = relations(coupons, ({ many }) => ({
  usages: many(couponUsages),
}));

export const couponUsagesRelations = relations(couponUsages, ({ one }) => ({
  coupon: one(coupons, {
    fields: [couponUsages.couponId],
    references: [coupons.id],
  }),
  user: one(users, {
    fields: [couponUsages.userId],
    references: [users.id],
  }),
  subscription: one(subscriptions, {
    fields: [couponUsages.subscriptionId],
    references: [subscriptions.id],
  }),
}));


// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Invalid email address").optional(),
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const upsertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertPluginSchema = createInsertSchema(plugins).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  downloadCount: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLicenseSchema = createInsertSchema(licenses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDownloadSchema = createInsertSchema(downloads).omit({
  id: true,
  downloadedAt: true,
});

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

export const insertPaymentProviderSchema = createInsertSchema(paymentProviders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Coupon insert schemas
export const insertCouponSchema = createInsertSchema(coupons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  usageCount: true,
});

export const insertCouponUsageSchema = createInsertSchema(couponUsages).omit({
  id: true,
  usedAt: true,
});


// Types
export type User = typeof users.$inferSelect;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Plugin = typeof plugins.$inferSelect;
export type InsertPlugin = z.infer<typeof insertPluginSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type License = typeof licenses.$inferSelect;
export type InsertLicense = z.infer<typeof insertLicenseSchema>;
export type Download = typeof downloads.$inferSelect;
export type InsertDownload = z.infer<typeof insertDownloadSchema>;
export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type PaymentProvider = typeof paymentProviders.$inferSelect;
export type InsertPaymentProvider = z.infer<typeof insertPaymentProviderSchema>;
export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = z.infer<typeof insertCouponSchema>;
export type CouponUsage = typeof couponUsages.$inferSelect;
export type InsertCouponUsage = z.infer<typeof insertCouponUsageSchema>;
