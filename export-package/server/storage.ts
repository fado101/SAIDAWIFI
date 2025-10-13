import {
  users,
  servicePackages,
  subscriptions,
  usageRecords,
  invoices,
  supportTickets,
  supportReplies,
  renewalRequests,
  type User,
  type UpsertUser,
  type ServicePackage,
  type InsertServicePackage,
  type Subscription,
  type InsertSubscription,
  type UsageRecord,
  type InsertUsageRecord,
  type Invoice,
  type InsertInvoice,
  type SupportTicket,
  type InsertSupportTicket,
  type SupportReply,
  type InsertSupportReply,
  type RenewalRequest,
  type InsertRenewalRequest,
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Service package operations
  getServicePackages(): Promise<ServicePackage[]>;
  getServicePackage(id: number): Promise<ServicePackage | undefined>;
  createServicePackage(pkg: InsertServicePackage): Promise<ServicePackage>;
  
  // Subscription operations
  getUserSubscription(userId: string): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: number, updates: Partial<Subscription>): Promise<Subscription>;
  
  // Usage tracking
  createUsageRecord(record: InsertUsageRecord): Promise<UsageRecord>;
  getUserUsageRecords(userId: string, startDate?: Date, endDate?: Date): Promise<UsageRecord[]>;
  getUserDailyUsage(userId: string, date: Date): Promise<number>;
  getUserCurrentSession(userId: string): Promise<UsageRecord | undefined>;
  
  // Invoice operations
  getUserInvoices(userId: string): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, updates: Partial<Invoice>): Promise<Invoice>;
  getUnpaidInvoices(userId: string): Promise<Invoice[]>;
  confirmPaymentByUser(invoiceId: number, userId: string): Promise<Invoice>;
  
  // Support operations
  getUserSupportTickets(userId: string): Promise<SupportTicket[]>;
  createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket>;
  updateSupportTicket(id: number, updates: Partial<SupportTicket>): Promise<SupportTicket>;
  getSupportReplies(ticketId: number): Promise<SupportReply[]>;
  createSupportReply(reply: InsertSupportReply): Promise<SupportReply>;
  
  // Renewal request operations
  createRenewalRequest(request: InsertRenewalRequest): Promise<RenewalRequest>;
  getPendingRenewalRequests(): Promise<RenewalRequest[]>;
  updateRenewalRequest(id: number, updates: Partial<RenewalRequest>): Promise<RenewalRequest>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private servicePackages: Map<number, ServicePackage> = new Map();
  private subscriptions: Map<number, Subscription> = new Map();
  private usageRecords: Map<number, UsageRecord> = new Map();
  private invoices: Map<number, Invoice> = new Map();
  private supportTickets: Map<number, SupportTicket> = new Map();
  private supportReplies: Map<number, SupportReply> = new Map();
  private renewalRequests: Map<number, RenewalRequest> = new Map();
  
  private currentServicePackageId = 1;
  private currentSubscriptionId = 1;
  private currentUsageRecordId = 1;
  private currentInvoiceId = 1;
  private currentSupportTicketId = 1;
  private currentSupportReplyId = 1;
  private currentRenewalRequestId = 1;

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Note: In production, data will come from DMA Radius Manager APIs
    // This is temporary sample data for development only
    
    const packages: ServicePackage[] = [
      {
        id: 1,
        name: "باقة الألياف الضوئية 100GB",
        dataLimit: "100.00",
        speed: "100 Mbps",
        price: "200.00",
        description: "باقة سريعة ومناسبة للاستخدام المنزلي",
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: 2,
        name: "باقة الألياف الضوئية 500GB",
        dataLimit: "500.00",
        speed: "500 Mbps", 
        price: "400.00",
        description: "باقة فائقة السرعة للشركات والمكاتب",
        isActive: true,
        createdAt: new Date(),
      },
    ];

    packages.forEach(pkg => {
      this.servicePackages.set(pkg.id, pkg);
    });
    this.currentServicePackageId = packages.length + 1;
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id);
    const user: User = {
      ...existingUser,
      ...userData,
      updatedAt: new Date(),
    };
    this.users.set(userData.id, user);
    return user;
  }

  // Service package operations
  async getServicePackages(): Promise<ServicePackage[]> {
    return Array.from(this.servicePackages.values()).filter(pkg => pkg.isActive);
  }

  async getServicePackage(id: number): Promise<ServicePackage | undefined> {
    return this.servicePackages.get(id);
  }

  async createServicePackage(pkgData: InsertServicePackage): Promise<ServicePackage> {
    const id = this.currentServicePackageId++;
    const pkg: ServicePackage = {
      ...pkgData,
      id,
      createdAt: new Date(),
    };
    this.servicePackages.set(id, pkg);
    return pkg;
  }

  // Subscription operations
  async getUserSubscription(userId: string): Promise<Subscription | undefined> {
    return Array.from(this.subscriptions.values()).find(
      sub => sub.userId === userId && sub.isActive
    );
  }

  async createSubscription(subData: InsertSubscription): Promise<Subscription> {
    const id = this.currentSubscriptionId++;
    const subscription: Subscription = {
      ...subData,
      id,
      createdAt: new Date(),
    };
    this.subscriptions.set(id, subscription);
    return subscription;
  }

  async updateSubscription(id: number, updates: Partial<Subscription>): Promise<Subscription> {
    const subscription = this.subscriptions.get(id);
    if (!subscription) {
      throw new Error("Subscription not found");
    }
    const updated = { ...subscription, ...updates };
    this.subscriptions.set(id, updated);
    return updated;
  }

  // Usage tracking
  async createUsageRecord(recordData: InsertUsageRecord): Promise<UsageRecord> {
    const id = this.currentUsageRecordId++;
    const record: UsageRecord = {
      ...recordData,
      id,
      createdAt: new Date(),
    };
    this.usageRecords.set(id, record);
    return record;
  }

  async getUserUsageRecords(userId: string, startDate?: Date, endDate?: Date): Promise<UsageRecord[]> {
    const records = Array.from(this.usageRecords.values()).filter(
      record => record.userId === userId
    );

    if (startDate && endDate) {
      return records.filter(record => {
        const recordDate = new Date(record.recordDate);
        return recordDate >= startDate && recordDate <= endDate;
      });
    }

    return records;
  }

  async getUserDailyUsage(userId: string, date: Date): Promise<number> {
    const dayRecords = Array.from(this.usageRecords.values()).filter(
      record => record.userId === userId && 
      new Date(record.recordDate).toDateString() === date.toDateString()
    );

    return dayRecords.reduce((total, record) => total + parseFloat(record.dataUsed), 0);
  }

  async getUserCurrentSession(userId: string): Promise<UsageRecord | undefined> {
    return Array.from(this.usageRecords.values()).find(
      record => record.userId === userId && !record.sessionEnd
    );
  }

  // Invoice operations
  async getUserInvoices(userId: string): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(
      invoice => invoice.userId === userId
    );
  }

  async createInvoice(invoiceData: InsertInvoice): Promise<Invoice> {
    const id = this.currentInvoiceId++;
    const invoice: Invoice = {
      ...invoiceData,
      id,
      createdAt: new Date(),
    };
    this.invoices.set(id, invoice);
    return invoice;
  }

  async updateInvoice(id: number, updates: Partial<Invoice>): Promise<Invoice> {
    const invoice = this.invoices.get(id);
    if (!invoice) {
      throw new Error("Invoice not found");
    }
    const updated = { ...invoice, ...updates };
    this.invoices.set(id, updated);
    return updated;
  }

  async getUnpaidInvoices(userId: string): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(
      invoice => invoice.userId === userId && invoice.status === "unpaid"
    );
  }

  // Support operations
  async getUserSupportTickets(userId: string): Promise<SupportTicket[]> {
    return Array.from(this.supportTickets.values()).filter(
      ticket => ticket.userId === userId
    );
  }

  async createSupportTicket(ticketData: InsertSupportTicket): Promise<SupportTicket> {
    const id = this.currentSupportTicketId++;
    const ticket: SupportTicket = {
      ...ticketData,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.supportTickets.set(id, ticket);
    return ticket;
  }

  async updateSupportTicket(id: number, updates: Partial<SupportTicket>): Promise<SupportTicket> {
    const ticket = this.supportTickets.get(id);
    if (!ticket) {
      throw new Error("Support ticket not found");
    }
    const updated = { ...ticket, ...updates, updatedAt: new Date() };
    this.supportTickets.set(id, updated);
    return updated;
  }

  async getSupportReplies(ticketId: number): Promise<SupportReply[]> {
    return Array.from(this.supportReplies.values()).filter(
      reply => reply.ticketId === ticketId
    );
  }

  async createSupportReply(replyData: InsertSupportReply): Promise<SupportReply> {
    const id = this.currentSupportReplyId++;
    const reply: SupportReply = {
      ...replyData,
      id,
      createdAt: new Date(),
    };
    this.supportReplies.set(id, reply);
    return reply;
  }

  // Renewal request operations
  async createRenewalRequest(requestData: InsertRenewalRequest): Promise<RenewalRequest> {
    const id = this.currentRenewalRequestId++;
    const request: RenewalRequest = {
      ...requestData,
      id,
      createdAt: new Date(),
    };
    this.renewalRequests.set(id, request);
    return request;
  }

  async getPendingRenewalRequests(): Promise<RenewalRequest[]> {
    return Array.from(this.renewalRequests.values()).filter(
      request => request.status === "pending"
    );
  }

  async updateRenewalRequest(id: number, updates: Partial<RenewalRequest>): Promise<RenewalRequest> {
    const request = this.renewalRequests.get(id);
    if (!request) {
      throw new Error("Renewal request not found");
    }
    const updated = { ...request, ...updates };
    this.renewalRequests.set(id, updated);
    return updated;
  }

  async confirmPaymentByUser(invoiceId: number, userId: string): Promise<Invoice> {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice || invoice.userId !== userId) {
      throw new Error("Invoice not found or access denied");
    }
    
    const updated: Invoice = { 
      ...invoice, 
      status: "confirmed_by_user",
      confirmedByUserDate: new Date()
    };
    this.invoices.set(invoiceId, updated);
    return updated;
  }
}

export const storage = new MemStorage();
