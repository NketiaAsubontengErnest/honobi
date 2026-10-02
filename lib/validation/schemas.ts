import { z } from "zod";

// ==================== AUTH SCHEMAS ====================

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// ==================== CUSTOMER SCHEMAS ====================

export const customerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  altPhone: z.string().optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  region: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

// ==================== PRODUCT SCHEMAS ====================

export const productSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  slug: z.string().min(2, "Slug is required"),
  description: z.string().optional().or(z.literal("")),
  price: z.coerce.number().min(0, "Price must be positive"),
  discountedPrice: z.coerce.number().min(0).optional().or(z.literal(0)),
  sku: z.string().optional().or(z.literal("")),
  dimensions: z.string().optional().or(z.literal("")),
  materials: z.string().optional().or(z.literal("")),
  color: z.string().optional().or(z.literal("")),
  availability: z.string().optional().or(z.literal("")),
  status: z.enum(["AVAILABLE", "OUT_OF_STOCK", "MADE_TO_ORDER", "DISCONTINUED"]),
  isFeatured: z.boolean().default(false),
  isPublic: z.boolean().default(true),
  showPrice: z.boolean().default(false),
  categoryId: z.string().optional().or(z.literal("")),
});

// ==================== PROJECT SCHEMAS ====================

export const projectSchema = z.object({
  name: z.string().min(2, "Project name is required"),
  slug: z.string().min(2, "Slug is required"),
  description: z.string().optional().or(z.literal("")),
  customerName: z.string().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  startDate: z.string().optional().or(z.literal("")),
  completionDate: z.string().optional().or(z.literal("")),
  budget: z.coerce.number().min(0).optional().or(z.literal(0)),
  status: z.enum(["PLANNING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  coverImage: z.string().optional().or(z.literal("")),
  materialsUsed: z.string().optional().or(z.literal("")),
  servicesPerformed: z.string().optional().or(z.literal("")),
  isFeatured: z.boolean().default(false),
  isPublic: z.boolean().default(true),
  categoryId: z.string().optional().or(z.literal("")),
});

// ==================== SERVICE SCHEMAS ====================

export const serviceSchema = z.object({
  name: z.string().min(2, "Service name is required"),
  slug: z.string().min(2, "Slug is required"),
  description: z.string().optional().or(z.literal("")),
  image: z.string().optional().or(z.literal("")),
  icon: z.string().optional().or(z.literal("")),
  isFeatured: z.boolean().default(false),
  isPublic: z.boolean().default(true),
  order: z.coerce.number().min(0).default(0),
  categoryId: z.string().optional().or(z.literal("")),
});

// ==================== QUOTE SCHEMAS ====================

export const quoteSchema = z.object({
  customerName: z.string().min(2, "Customer name is required"),
  phone: z.string().min(10, "Valid phone is required"),
  email: z.string().email().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  projectType: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  estimatedBudget: z.coerce.number().min(0).optional().or(z.literal(0)),
  preferredDate: z.string().optional().or(z.literal("")),
  additionalNotes: z.string().optional().or(z.literal("")),
});

export const quoteItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  description: z.string().optional().or(z.literal("")),
  quantity: z.coerce.number().min(1).default(1),
  unitPrice: z.coerce.number().min(0),
  category: z.string().optional().or(z.literal("")),
});

// ==================== JOB SCHEMAS ====================

export const jobSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  title: z.string().min(2, "Job title is required"),
  description: z.string().optional().or(z.literal("")),
  projectId: z.string().optional().or(z.literal("")),
  assignedTo: z.string().optional().or(z.literal("")),
  startDate: z.string().optional().or(z.literal("")),
  expectedCompletion: z.string().optional().or(z.literal("")),
  estimatedCost: z.coerce.number().min(0).optional().or(z.literal(0)),
  notes: z.string().optional().or(z.literal("")),
});

// ==================== INVOICE SCHEMAS ====================

export const invoiceSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  jobId: z.string().optional().or(z.literal("")),
  subtotal: z.coerce.number().min(0),
  discount: z.coerce.number().min(0).default(0),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  total: z.coerce.number().min(0),
  dueDate: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export const invoiceItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  description: z.string().optional().or(z.literal("")),
  quantity: z.coerce.number().min(1).default(1),
  unitPrice: z.coerce.number().min(0),
});

// ==================== PAYMENT SCHEMAS ====================

export const paymentSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  invoiceId: z.string().optional().or(z.literal("")),
  jobId: z.string().optional().or(z.literal("")),
  amount: z.coerce.number().min(0.01, "Amount must be positive"),
  paymentDate: z.string().min(1, "Date is required"),
  paymentMethod: z.enum(["CASH", "MOBILE_MONEY", "MTN_MOMO", "TELECEL_CASH", "AIRTELTIGO_MONEY", "BANK_TRANSFER", "CARD", "OTHER"]),
  notes: z.string().optional().or(z.literal("")),
});

// ==================== INCOME SCHEMAS ====================

export const incomeSchema = z.object({
  date: z.string().min(1, "Date is required"),
  amount: z.coerce.number().min(0.01, "Amount must be positive"),
  customerId: z.string().optional().or(z.literal("")),
  paymentMethod: z.enum(["CASH", "MOBILE_MONEY", "MTN_MOMO", "TELECEL_CASH", "AIRTELTIGO_MONEY", "BANK_TRANSFER", "CARD", "OTHER"]),
  category: z.enum(["FURNITURE_SALES", "CARPENTRY_SERVICES", "INSTALLATION", "REPAIRS", "DELIVERY", "CUSTOM_ORDERS", "OTHER"]),
  description: z.string().optional().or(z.literal("")),
  reference: z.string().optional().or(z.literal("")),
});

// ==================== EXPENSE SCHEMAS ====================

export const expenseSchema = z.object({
  date: z.string().min(1, "Date is required"),
  amount: z.coerce.number().min(0.01, "Amount must be positive"),
  category: z.enum(["WOOD", "PLYWOOD", "MDF", "NAILS", "SCREWS", "GLUE", "PAINT", "VARNISH", "SANDPAPER", "HARDWARE", "ELECTRICITY", "WATER", "RENT", "TRANSPORT", "FUEL", "SALARIES", "TOOLS", "MACHINE_MAINTENANCE", "REPAIRS", "MARKETING", "INTERNET", "PACKAGING", "DELIVERY", "OTHER"]),
  supplierId: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  paymentMethod: z.enum(["CASH", "MOBILE_MONEY", "MTN_MOMO", "TELECEL_CASH", "AIRTELTIGO_MONEY", "BANK_TRANSFER", "CARD", "OTHER"]),
  reference: z.string().optional().or(z.literal("")),
});

// ==================== SUPPLIER SCHEMAS ====================

export const supplierSchema = z.object({
  name: z.string().min(2, "Supplier name is required"),
  contactPerson: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  materials: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

// ==================== INVENTORY SCHEMAS ====================

export const inventoryItemSchema = z.object({
  name: z.string().min(2, "Item name is required"),
  sku: z.string().optional().or(z.literal("")),
  categoryId: z.string().optional().or(z.literal("")),
  unit: z.enum(["PIECES", "SHEETS", "METERS", "LITRES", "KILOGRAMS", "BOXES", "SETS"]),
  quantity: z.coerce.number().min(0).default(0),
  minStock: z.coerce.number().min(0).default(0),
  costPerUnit: z.coerce.number().min(0).default(0),
  supplierId: z.string().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
});

export const stockMovementSchema = z.object({
  itemId: z.string().min(1, "Item is required"),
  type: z.enum(["STOCK_IN", "STOCK_OUT", "ADJUSTMENT"]),
  quantity: z.coerce.number().min(0.01, "Quantity must be positive"),
  unitCost: z.coerce.number().min(0).optional(),
  reference: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

// ==================== EMPLOYEE SCHEMAS ====================

export const employeeSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  name: z.string().min(2, "Name is required"),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  position: z.enum(["CARPENTER", "ASSISTANT_CARPENTER", "FINISHING_SPECIALIST", "INSTALLER", "DRIVER", "STOREKEEPER", "ACCOUNTANT", "MANAGER", "ADMINISTRATOR"]),
  salary: z.coerce.number().min(0).optional().or(z.literal(0)),
  hireDate: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  emergencyContact: z.string().optional().or(z.literal("")),
});

// ==================== TESTIMONIAL SCHEMAS ====================

export const testimonialSchema = z.object({
  customerName: z.string().min(2, "Customer name is required"),
  customerRole: z.string().optional().or(z.literal("")),
  testimonial: z.string().min(10, "Testimonial must be at least 10 characters"),
  customerImage: z.string().optional().or(z.literal("")),
  rating: z.coerce.number().min(1).max(5).default(5),
  isFeatured: z.boolean().default(false),
  isApproved: z.boolean().default(false),
  isPublic: z.boolean().default(true),
});

// ==================== MESSAGE SCHEMAS ====================

export const contactFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  subject: z.string().optional().or(z.literal("")),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

// ==================== USER SCHEMAS ====================

export const userSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MANAGER", "SECRETARY", "ACCOUNTANT", "STAFF"]),
  isActive: z.boolean().default(true),
});

// ==================== CUTTING PLAN SCHEMAS ====================

export const cuttingPieceSchema = z.object({
  name: z.string().min(1, "Piece name is required"),
  length: z.coerce.number().positive("Length must be positive"),
  width: z.coerce.number().positive("Width must be positive"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  thickness: z.coerce.number().positive().optional().nullable(),
  grain: z.enum(["NONE", "LENGTH", "WIDTH"]).default("NONE"),
  allowRotation: z.boolean().default(true),
  notes: z.string().nullish().or(z.literal("")),
});

export const cuttingPlanSchema = z.object({
  name: z.string().min(2, "Plan name is required"),
  projectId: z.string().nullish(),
  jobId: z.string().nullish(),
  supplierId: z.string().nullish(),
  customerName: z.string().nullish(),

  materialName: z.string().min(1, "Material name is required"),
  materialType: z.enum(["MDF", "PLYWOOD", "HARDWOOD", "SOFTWOOD", "MELAMINE", "CHIPBOARD", "VENEER", "LAMINATED", "CUSTOM"]).default("MDF"),
  boardLength: z.coerce.number().positive("Board length must be positive"),
  boardWidth: z.coerce.number().positive("Board width must be positive"),
  boardThickness: z.coerce.number().positive().optional().nullable(),
  boardQuantity: z.coerce.number().int().min(0, "Board quantity cannot be negative (0 = unlimited)").default(1),
  unit: z.string().default("mm"),
  boardPrice: z.coerce.number().min(0).optional().nullable(),
  notes: z.string().nullish().or(z.literal("")),

  kerf: z.coerce.number().min(0, "Kerf cannot be negative").default(3),
  trimTop: z.coerce.number().min(0).default(0),
  trimBottom: z.coerce.number().min(0).default(0),
  trimLeft: z.coerce.number().min(0).default(0),
  trimRight: z.coerce.number().min(0).default(0),
  direction: z.enum(["HORIZONTAL", "VERTICAL", "AUTOMATIC"]).default("AUTOMATIC"),
  allowRotation: z.boolean().default(true),
  grainStrategy: z.enum(["NONE", "LENGTH", "WIDTH"]).default("NONE"),
  strategy: z.enum(["GUILLOTINE", "NESTING_2D"]).default("GUILLOTINE"),

  pieces: z.array(cuttingPieceSchema).min(1, "Add at least one piece"),
});

export const boardPresetSchema = z.object({
  name: z.string().min(2, "Preset name is required"),
  materialType: z.enum(["MDF", "PLYWOOD", "HARDWOOD", "SOFTWOOD", "MELAMINE", "CHIPBOARD", "VENEER", "LAMINATED", "CUSTOM"]).default("MDF"),
  length: z.coerce.number().positive(),
  width: z.coerce.number().positive(),
  thickness: z.coerce.number().positive().optional().nullable(),
  unit: z.string().default("mm"),
});

// ==================== CATEGORY SCHEMAS ====================

export const categorySchema = z.object({
  name: z.string().min(2, "Category name is required"),
  slug: z.string().min(2, "Slug is required"),
  description: z.string().optional().or(z.literal("")),
  image: z.string().optional().or(z.literal("")),
});

// ==================== SETTINGS SCHEMAS ====================

export const settingsSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
  type: z.enum(["string", "number", "boolean", "json"]).default("string"),
  group: z.enum(["general", "business", "invoice", "social", "hours"]).default("general"),
});

// ==================== SALARY PAYMENT SCHEMAS ====================

export const salaryPaymentSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  amount: z.coerce.number().min(0.01, "Amount must be positive"),
  date: z.string().min(1, "Date is required"),
  type: z.enum(["salary", "advance", "bonus", "deduction"]),
  period: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

// ==================== PAYROLL SCHEMAS ====================

export const payrollCycleEnum = z.enum(["DAILY", "WEEKLY", "MONTHLY"]);

export const payrollConfigSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  cycle: payrollCycleEnum.default("MONTHLY"),
  baseRate: z.coerce.number().positive("Base rate must be positive"),
  allowance: z.coerce.number().min(0).optional().nullable(),
  deduction: z.coerce.number().min(0).optional().nullable(),
  effectiveFrom: z.string().optional().nullable(),
  notes: z.string().nullish().or(z.literal("")),
});

export const payrollRunSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  cycle: payrollCycleEnum.default("MONTHLY"),
  periodStart: z.string().min(1, "Period start is required"),
  periodEnd: z.string().min(1, "Period end is required"),
  daysWorked: z.coerce.number().min(0, "Days worked cannot be negative"),
  allowance: z.coerce.number().min(0).default(0),
  deduction: z.coerce.number().min(0).default(0),
  notes: z.string().nullish().or(z.literal("")),
});

// Inference types
export type LoginInput = z.infer<typeof loginSchema>;
export type CustomerInput = z.infer<typeof customerSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
export type QuoteInput = z.infer<typeof quoteSchema>;
export type JobInput = z.infer<typeof jobSchema>;
export type InvoiceInput = z.infer<typeof invoiceSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
export type IncomeInput = z.infer<typeof incomeSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type SupplierInput = z.infer<typeof supplierSchema>;
export type InventoryItemInput = z.infer<typeof inventoryItemSchema>;
export type StockMovementInput = z.infer<typeof stockMovementSchema>;
export type EmployeeInput = z.infer<typeof employeeSchema>;
export type TestimonialInput = z.infer<typeof testimonialSchema>;
export type ContactFormInput = z.infer<typeof contactFormSchema>;
export type UserInput = z.infer<typeof userSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type CuttingPlanInput = z.infer<typeof cuttingPlanSchema>;
export type CuttingPieceInput = z.infer<typeof cuttingPieceSchema>;
export type BoardPresetInput = z.infer<typeof boardPresetSchema>;
