import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  decimal,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  username: varchar("username"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Service packages available in the DNA Radius Manager
export const servicePackages = pgTable("service_packages", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  dataLimit: decimal("data_limit", { precision: 10, scale: 2 }).notNull(), // in GB
  speed: varchar("speed", { length: 100 }).notNull(), // e.g., "100 Mbps"
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// User subscriptions to service packages
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  packageId: integer("package_id").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  remainingData: decimal("remaining_data", { precision: 10, scale: 2 }).notNull(),
  totalData: decimal("total_data", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true),
  activationDate: timestamp("activation_date"), // Date when last invoice was paid
  createdAt: timestamp("created_at").defaultNow(),
});

// Usage tracking for reports
export const usageRecords = pgTable("usage_records", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  subscriptionId: integer("subscription_id").notNull(),
  dataUsed: decimal("data_used", { precision: 10, scale: 2 }).notNull(), // in GB
  sessionStart: timestamp("session_start").notNull(),
  sessionEnd: timestamp("session_end"),
  sessionDuration: integer("session_duration"), // in minutes
  recordDate: date("record_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Invoices for service renewals and payments
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  subscriptionId: integer("subscription_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("unpaid"), // paid, unpaid, pending, confirmed_by_user
  paymentMethod: varchar("payment_method", { length: 50 }).notNull().default("bank_transfer"), // bank_transfer, credit_balance
  invoiceDate: timestamp("invoice_date").notNull(),
  dueDate: timestamp("due_date").notNull(),
  paidDate: timestamp("paid_date"),
  confirmedByUserDate: timestamp("confirmed_by_user_date"), // When user confirmed payment
  description: text("description"),
  approvedBy: varchar("approved_by"), // Manager who approved the renewal
  verifiedBy: varchar("verified_by"), // Manager who verified the payment
  bankTransferDetails: text("bank_transfer_details"), // Bank transfer reference/details
  createdAt: timestamp("created_at").defaultNow(),
});

// Support tickets
export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("open"), // open, in_progress, closed
  priority: varchar("priority", { length: 20 }).default("medium"), // low, medium, high
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Support ticket replies
export const supportReplies = pgTable("support_replies", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull(),
  userId: varchar("user_id"), // null if reply is from manager
  message: text("message").notNull(),
  isManagerReply: boolean("is_manager_reply").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Renewal requests pending manager approval
export const renewalRequests = pgTable("renewal_requests", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  subscriptionId: integer("subscription_id").notNull(),
  packageId: integer("package_id").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, approved, rejected
  requestDate: timestamp("request_date").notNull(),
  approvedBy: varchar("approved_by"),
  approvedDate: timestamp("approved_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema exports for form validation
export const insertServicePackageSchema = createInsertSchema(servicePackages).omit({
  id: true,
  createdAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
});

export const insertUsageRecordSchema = createInsertSchema(usageRecords).omit({
  id: true,
  createdAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
});

export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSupportReplySchema = createInsertSchema(supportReplies).omit({
  id: true,
  createdAt: true,
});

export const insertRenewalRequestSchema = createInsertSchema(renewalRequests).omit({
  id: true,
  createdAt: true,
});

// Type exports
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type ServicePackage = typeof servicePackages.$inferSelect;
export type InsertServicePackage = z.infer<typeof insertServicePackageSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type UsageRecord = typeof usageRecords.$inferSelect;
export type InsertUsageRecord = z.infer<typeof insertUsageRecordSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type SupportReply = typeof supportReplies.$inferSelect;
export type InsertSupportReply = z.infer<typeof insertSupportReplySchema>;
export type RenewalRequest = typeof renewalRequests.$inferSelect;
export type InsertRenewalRequest = z.infer<typeof insertRenewalRequestSchema>;
