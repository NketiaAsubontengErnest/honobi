import { PrismaClient, Role, ProductStatus, ProjectStatus, JobStatus, ExpenseCategory, IncomeCategory, PaymentMethod, InventoryUnit, EmployeePosition, PayrollCycle } from "@prisma/client";
import { hash } from "bcryptjs";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

// Never ship known passwords: use SEED_PASSWORD or a random one printed once.
const seedPassword = process.env.SEED_PASSWORD || randomBytes(9).toString("base64url") + "!1A";

async function main() {
  console.log("Seeding database for HONOBI WOOD JOINERY...");
  console.log("Password for newly created seed users: " + seedPassword);

  // Create users with different roles
  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@honobi.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@honobi.com",
      passwordHash: await hash(seedPassword, 12),
      role: Role.SUPER_ADMIN,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: "shop@honobi.com" },
    update: {},
    create: {
      name: "Shop Admin",
      email: "shop@honobi.com",
      passwordHash: await hash(seedPassword, 12),
      role: Role.ADMIN,
    },
  });

  const managerUser = await prisma.user.upsert({
    where: { email: "manager@honobi.com" },
    update: {},
    create: {
      name: "Operations Manager",
      email: "manager@honobi.com",
      passwordHash: await hash(seedPassword, 12),
      role: Role.MANAGER,
    },
  });

  const accountantUser = await prisma.user.upsert({
    where: { email: "accounts@honobi.com" },
    update: {},
    create: {
      name: "Head Accountant",
      email: "accounts@honobi.com",
      passwordHash: await hash(seedPassword, 12),
      role: Role.ACCOUNTANT,
    },
  });

  const secretaryUser = await prisma.user.upsert({
    where: { email: "secretary@honobi.com" },
    update: {},
    create: {
      name: "Shop Secretary",
      email: "secretary@honobi.com",
      passwordHash: await hash(seedPassword, 12),
      role: Role.SECRETARY,
    },
  });

  const staffUser = await prisma.user.upsert({
    where: { email: "staff@honobi.com" },
    update: {},
    create: {
      name: "Workshop Foreman",
      email: "staff@honobi.com",
      passwordHash: await hash(seedPassword, 12),
      role: Role.STAFF,
    },
  });

  const storekeeperUser = await prisma.user.upsert({
    where: { email: "storekeeper@honobi.com" },
    update: {},
    create: {
      name: "Store Keeper",
      email: "storekeeper@honobi.com",
      passwordHash: await hash(seedPassword, 12),
      role: Role.STAFF,
    },
  });

  console.log("Users created:", {
    superAdmin: superAdmin.email,
    admin: adminUser.email,
    manager: managerUser.email,
    accountant: accountantUser.email,
    secretary: secretaryUser.email,
    staff: staffUser.email,
    storekeeper: storekeeperUser.email,
  });

  // Create product categories
  const furnitureCat = await prisma.productCategory.upsert({
    where: { slug: "furniture" },
    update: {},
    create: { name: "Furniture", slug: "furniture", description: "All types of furniture" },
  });

  const cabinetsCat = await prisma.productCategory.upsert({
    where: { slug: "cabinets" },
    update: {},
    create: { name: "Cabinets", slug: "cabinets", description: "Kitchen and storage cabinets" },
  });

  const bedsCat = await prisma.productCategory.upsert({
    where: { slug: "beds" },
    update: {},
    create: { name: "Beds & Wardrobes", slug: "beds", description: "Beds, wardrobes, and bedroom furniture" },
  });

  // Create products
  const products = [
    { name: "3-Seater Wooden Sofa", slug: "3-seater-wooden-sofa", price: 4500, status: ProductStatus.AVAILABLE, categoryId: furnitureCat.id, isFeatured: true, description: "Beautiful handcrafted 3-seater sofa with premium wood finish" },
    { name: "Kitchen Cabinet Set", slug: "kitchen-cabinet-set", price: 8500, status: ProductStatus.MADE_TO_ORDER, categoryId: cabinetsCat.id, isFeatured: true, description: "Complete kitchen cabinet set with modern design" },
    { name: "Queen Size Bed Frame", slug: "queen-size-bed-frame", price: 3800, status: ProductStatus.AVAILABLE, categoryId: bedsCat.id, isFeatured: true, description: "Sturdy queen-size bed frame with headboard" },
    { name: "Office Desk - Executive", slug: "office-desk-executive", price: 2500, status: ProductStatus.AVAILABLE, categoryId: furnitureCat.id, description: "Professional executive desk with drawers" },
    { name: "Wardrobe 4-Door", slug: "wardrobe-4-door", price: 5200, status: ProductStatus.MADE_TO_ORDER, categoryId: bedsCat.id, description: "Spacious 4-door wardrobe with mirror" },
    { name: "TV Console Modern", slug: "tv-console-modern", price: 1800, status: ProductStatus.AVAILABLE, categoryId: furnitureCat.id, description: "Modern TV console with storage compartments" },
    { name: "Dining Table Set (6)", slug: "dining-table-set-6", price: 6500, status: ProductStatus.AVAILABLE, categoryId: furnitureCat.id, isFeatured: true, description: "6-seater dining table set with chairs" },
    { name: "Bookshelf - 5 Tier", slug: "bookshelf-5-tier", price: 1200, status: ProductStatus.OUT_OF_STOCK, categoryId: furnitureCat.id, description: "5-tier wooden bookshelf" },
  ];

  // Map each product slug to a self-hosted photo under /images
  const productImages: Record<string, string> = {
    "3-seater-wooden-sofa": "/images/products/sofa.jpg",
    "kitchen-cabinet-set": "/images/products/cabinet.jpg",
    "queen-size-bed-frame": "/images/products/bed.jpg",
    "office-desk-executive": "/images/products/desk.jpg",
    "wardrobe-4-door": "/images/products/wardrobe.jpg",
    "tv-console-modern": "/images/products/tv-console.jpg",
    "dining-table-set-6": "/images/products/dining.jpg",
    "bookshelf-5-tier": "/images/products/bookshelf.jpg",
  };

  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: { ...p, price: p.price.toString() } as never,
    });
    const img = productImages[p.slug];
    if (img) {
      // Idempotent: reset images for this product then attach the asset
      await prisma.productImage.deleteMany({ where: { productId: product.id } });
      await prisma.productImage.create({
        data: { productId: product.id, url: img, altText: p.name, order: 0 },
      });
    }
  }
  console.log("Products created");

  // Create project categories
  const residentialCat = await prisma.projectCategory.upsert({
    where: { slug: "residential" },
    update: {},
    create: { name: "Residential", slug: "residential", description: "Home projects" },
  });

  const commercialCat = await prisma.projectCategory.upsert({
    where: { slug: "commercial" },
    update: {},
    create: { name: "Commercial", slug: "commercial", description: "Office and business projects" },
  });

  // Create customers (idempotent: reuse if a customer with the same name+phone exists)
  const ensureCustomer = async (data: { name: string; phone: string; email?: string; city?: string; region?: string }) => {
    const existing = await prisma.customer.findFirst({ where: { name: data.name, phone: data.phone } });
    return existing ?? prisma.customer.create({ data });
  };

  const customer1 = await ensureCustomer({
    name: "Kwame Mensah",
    phone: "0244123456",
    email: "kwame@example.com",
    city: "Accra",
    region: "Greater Accra",
  });

  const customer2 = await ensureCustomer({
    name: "Ama Serwaa",
    phone: "0209876543",
    email: "ama@example.com",
    city: "Kumasi",
    region: "Ashanti",
  });

  const customer3 = await ensureCustomer({
    name: "John Osei",
    phone: "0551234567",
    email: "john@example.com",
    city: "Takoradi",
    region: "Western",
  });

  console.log("Customers created");

  // Create projects (idempotent via slug)
  await prisma.project.upsert({
    where: { slug: "complete-kitchen-renovation-accra" },
    update: {},
    create: {
      name: "Complete Kitchen Renovation - Accra Residence",
      slug: "complete-kitchen-renovation-accra",
      description: "Full kitchen renovation including custom cabinets, countertops, and installation",
      location: "East Legon, Accra",
      status: ProjectStatus.COMPLETED,
      startDate: new Date("2024-01-15"),
      completionDate: new Date("2024-03-20"),
      budget: "25000",
      isFeatured: true,
      isPublic: true,
      categoryId: residentialCat.id,
      materialsUsed: "MDF, Plywood, Hinges, Handles, Paint",
      servicesPerformed: "Design, Fabrication, Installation, Finishing",
    },
  });

  await prisma.project.upsert({
    where: { slug: "office-furniture-package-takoradi" },
    update: {},
    create: {
      name: "Office Furniture Package - Takoradi",
      slug: "office-furniture-package-takoradi",
      description: "Complete office furniture including desks, cabinets, and conference table",
      location: "Takoradi Central",
      status: ProjectStatus.COMPLETED,
      startDate: new Date("2024-02-01"),
      completionDate: new Date("2024-04-15"),
      budget: "35000",
      isFeatured: true,
      isPublic: true,
      categoryId: commercialCat.id,
      materialsUsed: "Wood, MDF, Glass, Metal Frame",
      servicesPerformed: "Design, Fabrication, Delivery, Installation",
    },
  });

  await prisma.project.upsert({
    where: { slug: "custom-wardrobe-set-3-bedrooms" },
    update: {},
    create: {
      name: "Custom Wardrobe Set - 3 Bedrooms",
      slug: "custom-wardrobe-set-3-bedrooms",
      description: "Built-in wardrobes for three bedrooms with different designs",
      location: "Kumasi, Ahodwo",
      status: ProjectStatus.IN_PROGRESS,
      startDate: new Date("2024-06-01"),
      budget: "18000",
      isFeatured: false,
      isPublic: true,
      categoryId: residentialCat.id,
    },
  });

  // Attach cover + gallery images to projects (idempotent)
  const projectImages: Record<string, { cover: string; gallery: string[] }> = {
    "complete-kitchen-renovation-accra": {
      cover: "/images/projects/kitchen.jpg",
      gallery: ["/images/projects/kitchen.jpg", "/images/products/cabinet.jpg", "/images/products/dining.jpg"],
    },
    "office-furniture-package-takoradi": {
      cover: "/images/projects/office.jpg",
      gallery: ["/images/projects/office.jpg", "/images/products/bed.jpg"],
    },
    "custom-wardrobe-set-3-bedrooms": {
      cover: "/images/projects/wardrobe.jpg",
      gallery: ["/images/projects/wardrobe.jpg", "/images/products/bed.jpg"],
    },
  };
  for (const [slug, cfg] of Object.entries(projectImages)) {
    const project = await prisma.project.findUnique({ where: { slug } });
    if (project) {
      await prisma.project.update({ where: { id: project.id }, data: { coverImage: cfg.cover } });
      await prisma.projectImage.deleteMany({ where: { projectId: project.id } });
      await prisma.projectImage.createMany({
        data: cfg.gallery.map((url, i) => ({ projectId: project.id, url, altText: project.name, order: i })),
      });
    }
  }

  console.log("Projects created");

  // Create services
  const services = [
    { name: "Custom Furniture Design", slug: "custom-furniture-design", description: "Bespoke furniture designed to your specifications", isFeatured: true, order: 1 },
    { name: "Kitchen Cabinets", slug: "kitchen-cabinets", description: "Modern and traditional kitchen cabinet installation", isFeatured: true, order: 2 },
    { name: "Wardrobes & Storage", slug: "wardrobes-storage", description: "Built-in and freestanding wardrobe solutions", isFeatured: true, order: 3 },
    { name: "Office Furniture", slug: "office-furniture", description: "Professional office furniture design and installation", isFeatured: false, order: 4 },
    { name: "Doors & Windows", slug: "doors-windows", description: "Custom wooden doors and window frames", isFeatured: false, order: 5 },
    { name: "Interior Woodwork", slug: "interior-woodwork", description: "Wall panels, ceiling work, and decorative woodwork", isFeatured: false, order: 6 },
    { name: "Furniture Repair", slug: "furniture-repair", description: "Restore and repair damaged furniture", isFeatured: false, order: 7 },
    { name: "Renovation", slug: "renovation", description: "Complete space renovation services", isFeatured: false, order: 8 },
  ];

  // Map each service slug to a self-hosted photo under /images
  const serviceImages: Record<string, string> = {
    "custom-furniture-design": "/images/services/workshop.jpg",
    "kitchen-cabinets": "/images/products/cabinet.jpg",
    "wardrobes-storage": "/images/projects/wardrobe.jpg",
    "office-furniture": "/images/projects/office.jpg",
    "doors-windows": "/images/services/carpentry.jpg",
    "interior-woodwork": "/images/services/carpentry.jpg",
    "furniture-repair": "/images/services/carpentry.jpg",
    "renovation": "/images/projects/kitchen.jpg",
  };

  for (const s of services) {
    await prisma.service.upsert({
      where: { slug: s.slug },
      update: { image: serviceImages[s.slug] },
      create: { ...s, image: serviceImages[s.slug] },
    });
  }
  console.log("Services created");

  // Create suppliers
  if ((await prisma.supplier.count()) === 0) {
    await prisma.supplier.createMany({
      data: [
        { name: "Ghana Hardwoods Ltd", contactPerson: "Kofi Asante", phone: "0244556677", email: "info@ghanahardwoods.com", address: "Tema Industrial Area", materials: "Hardwood, Softwood, Plywood" },
        { name: "Accra Hardware Store", contactPerson: "Maria Tetteh", phone: "0302111222", address: "Accra Central", materials: "Nails, Screws, Hinges, Handles" },
        { name: "West Paint Supply", contactPerson: "Emmanuel Darko", phone: "0208899001", email: "sales@westpaint.com", address: "Kumasi", materials: "Paint, Varnish, Thinner" },
      ],
    });
  }
  console.log("Suppliers created");

  // Create income records
  await prisma.income.createMany({
    skipDuplicates: true,
    data: [
      { incomeNumber: "INC-2024-001", date: new Date("2024-06-01"), amount: "15000", category: IncomeCategory.FURNITURE_SALES, paymentMethod: PaymentMethod.MTN_MOMO, customerId: customer1.id, description: "Living room furniture set" },
      { incomeNumber: "INC-2024-002", date: new Date("2024-06-15"), amount: "8500", category: IncomeCategory.CARPENTRY_SERVICES, paymentMethod: PaymentMethod.CASH, description: "Custom shelving installation" },
      { incomeNumber: "INC-2024-003", date: new Date("2024-07-01"), amount: "25000", category: IncomeCategory.CUSTOM_ORDERS, paymentMethod: PaymentMethod.BANK_TRANSFER, customerId: customer2.id, description: "Office furniture package" },
      { incomeNumber: "INC-2024-004", date: new Date("2024-07-15"), amount: "3200", category: IncomeCategory.REPAIRS, paymentMethod: PaymentMethod.MOBILE_MONEY, description: "Antique table restoration" },
      { incomeNumber: "INC-2024-005", date: new Date("2024-08-01"), amount: "12000", category: IncomeCategory.INSTALLATION, paymentMethod: PaymentMethod.TELECEL_CASH, customerId: customer3.id, description: "Kitchen cabinet installation" },
    ],
  });

  // Create expense records
  await prisma.expense.createMany({
    skipDuplicates: true,
    data: [
      { expenseNumber: "EXP-2024-001", date: new Date("2024-06-01"), amount: "4500", category: ExpenseCategory.WOOD, paymentMethod: PaymentMethod.CASH, description: "Mahogany and oak wood purchase" },
      { expenseNumber: "EXP-2024-002", date: new Date("2024-06-05"), amount: "1200", category: ExpenseCategory.PLYWOOD, paymentMethod: PaymentMethod.MTN_MOMO, description: "Plywood sheets for cabinets" },
      { expenseNumber: "EXP-2024-003", date: new Date("2024-06-10"), amount: "800", category: ExpenseCategory.PAINT, paymentMethod: PaymentMethod.CASH, description: "Wood paint and varnish" },
      { expenseNumber: "EXP-2024-004", date: new Date("2024-06-15"), amount: "350", category: ExpenseCategory.NAILS, paymentMethod: PaymentMethod.CASH, description: "Nails, screws, and hardware" },
      { expenseNumber: "EXP-2024-005", date: new Date("2024-07-01"), amount: "2000", category: ExpenseCategory.RENT, paymentMethod: PaymentMethod.BANK_TRANSFER, description: "Monthly workshop rent" },
      { expenseNumber: "EXP-2024-006", date: new Date("2024-07-05"), amount: "500", category: ExpenseCategory.TRANSPORT, paymentMethod: PaymentMethod.CASH, description: "Material delivery transport" },
      { expenseNumber: "EXP-2024-007", date: new Date("2024-07-10"), amount: "1500", category: ExpenseCategory.SALARIES, paymentMethod: PaymentMethod.MTN_MOMO, description: "Weekly worker payments" },
    ],
  });
  console.log("Income and Expenses created");

  // Create employees
  await prisma.employee.createMany({
    skipDuplicates: true,
    data: [
      { employeeId: "EMP-001", name: "Kwabena Ofori", phone: "0244111222", position: EmployeePosition.CARPENTER, salary: "3000", hireDate: new Date("2022-03-01"), status: "ACTIVE" },
      { employeeId: "EMP-002", name: "Yaw Boateng", phone: "0209333444", position: EmployeePosition.ASSISTANT_CARPENTER, salary: "1800", hireDate: new Date("2023-01-15"), status: "ACTIVE" },
      { employeeId: "EMP-003", name: "Akosua Frimpong", phone: "0551555666", position: EmployeePosition.FINISHING_SPECIALIST, salary: "2200", hireDate: new Date("2023-06-01"), status: "ACTIVE" },
      { employeeId: "EMP-004", name: "Kwame Appiah", phone: "0244777888", position: EmployeePosition.DRIVER, salary: "1500", hireDate: new Date("2023-09-01"), status: "ACTIVE" },
    ],
  });
  console.log("Employees created");

  // Create payroll configurations (daily / weekly / monthly cycles)
  const payrollEmployees = [
    { empNumber: "EMP-001", cycle: PayrollCycle.MONTHLY, baseRate: "3000", allowance: "200", deduction: "0" },
    { empNumber: "EMP-002", cycle: PayrollCycle.DAILY, baseRate: "80", allowance: "0", deduction: "0" },
    { empNumber: "EMP-003", cycle: PayrollCycle.WEEKLY, baseRate: "550", allowance: "50", deduction: "0" },
    { empNumber: "EMP-004", cycle: PayrollCycle.MONTHLY, baseRate: "1500", allowance: "0", deduction: "50" },
  ];
  for (const pc of payrollEmployees) {
    const emp = await prisma.employee.findUnique({ where: { employeeId: pc.empNumber }, select: { id: true } });
    if (emp) {
      await prisma.payrollConfig.upsert({
        where: { employeeId: emp.id },
        update: { cycle: pc.cycle, baseRate: pc.baseRate, allowance: pc.allowance, deduction: pc.deduction },
        create: { employeeId: emp.id, cycle: pc.cycle, baseRate: pc.baseRate, allowance: pc.allowance, deduction: pc.deduction },
      });
    }
  }
  console.log("Payroll configs created");

  // Create inventory items
  await prisma.inventoryItem.createMany({
    skipDuplicates: true,
    data: [
      { name: "Mahogany Wood (2x4)", sku: "INV-WOOD-001", unit: InventoryUnit.METERS, quantity: "45", minStock: "10", costPerUnit: "85" },
      { name: "Plywood Sheet 4x8 (18mm)", sku: "INV-PLY-001", unit: InventoryUnit.SHEETS, quantity: "120", minStock: "30", costPerUnit: "180" },
      { name: "MDF Board 4x8 (12mm)", sku: "INV-MDF-001", unit: InventoryUnit.SHEETS, quantity: "80", minStock: "20", costPerUnit: "150" },
      { name: "Wood Screws Box (100pc)", sku: "INV-SREW-001", unit: InventoryUnit.BOXES, quantity: "200", minStock: "50", costPerUnit: "25" },
      { name: "Wood Varnish (1L)", sku: "INV-VAR-001", unit: InventoryUnit.LITRES, quantity: "30", minStock: "10", costPerUnit: "55" },
      { name: "Wood Glue (500ml)", sku: "INV-GLUE-001", unit: InventoryUnit.PIECES, quantity: "50", minStock: "15", costPerUnit: "30" },
      { name: "Sandpaper (Assorted)", sku: "INV-SAND-001", unit: InventoryUnit.PIECES, quantity: "500", minStock: "100", costPerUnit: "3" },
      { name: "Cabinet Hinges (pair)", sku: "INV-HNG-001", unit: InventoryUnit.SETS, quantity: "100", minStock: "25", costPerUnit: "15" },
    ],
  });
  console.log("Inventory created");

  // Create testimonials
  if ((await prisma.testimonial.count()) === 0) {
    await prisma.testimonial.createMany({
      data: [
        { customerName: "Nana Adjoa", customerRole: "Homeowner", testimonial: "HONobi did an amazing job on my kitchen cabinets. The craftsmanship is top-notch and they delivered on time!", rating: 5, isFeatured: true, isApproved: true, isPublic: true },
        { customerName: "Dr. Samuel Tetteh", customerRole: "Business Owner", testimonial: "Professional service from start to finish. Our office furniture looks incredible and very durable.", rating: 5, isFeatured: true, isApproved: true, isPublic: true },
        { customerName: "Efua Owusu", customerRole: "Interior Designer", testimonial: "I always recommend Honobi to my clients. Their attention to detail is exceptional.", rating: 4, isFeatured: true, isApproved: true, isPublic: true },
        { customerName: "Kojo Ansah", customerRole: "Property Developer", testimonial: "They completed all wardrobes for a 6-unit apartment project beautifully. Will definitely work with them again.", rating: 5, isFeatured: false, isApproved: true, isPublic: true },
      ],
    });
  }
  console.log("Testimonials created");

  // Create settings
  const settings = [
    { key: "business_name", value: "HONOBI WOOD JOINERY", group: "general" },
    { key: "business_phone", value: "+233 24 123 4567", group: "general" },
    { key: "business_email", value: "info@honobi.com", group: "general" },
    { key: "business_address", value: "123 Carpenter Lane, Tema Industrial Area", group: "general" },
    { key: "business_region", value: "Greater Accra", group: "general" },
    { key: "business_country", value: "Ghana", group: "general" },
    { key: "business_whatsapp", value: "233241234567", group: "general" },
    { key: "currency", value: "GHS", group: "general" },
    { key: "hero_title", value: "Crafting Excellence in Wood", group: "general" },
    { key: "hero_description", value: "Custom furniture, cabinets, and carpentry solutions for Ghana's finest homes and offices.", group: "general" },
    { key: "tax_enabled", value: "false", type: "boolean", group: "general" },
    { key: "tax_rate", value: "0", group: "general" },
    { key: "invoice_prefix", value: "INV", group: "invoice" },
    { key: "payment_terms", value: "14 days", group: "invoice" },
    { key: "invoice_footer", value: "Thank you for choosing HONOBI WOOD JOINERY!", group: "invoice" },
    { key: "social_facebook", value: "https://facebook.com/honobi", group: "social" },
    { key: "social_instagram", value: "https://instagram.com/honobi", group: "social" },
    { key: "social_tiktok", value: "https://tiktok.com/@honobi", group: "social" },
    { key: "hours_mon_fri", value: "8:00 AM - 6:00 PM", group: "hours" },
    { key: "hours_saturday", value: "9:00 AM - 4:00 PM", group: "hours" },
    { key: "hours_sunday", value: "Closed", group: "hours" },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: { key: s.key, value: s.value, group: s.group, type: s.type || "string" },
    });
  }
  console.log("Settings created");

  // Create a sample job
  await prisma.job.upsert({
    where: { jobNumber: "JOB-2024-001" },
    update: {},
    create: {
      jobNumber: "JOB-2024-001",
      customerId: customer1.id,
      title: "Custom Dining Table Set",
      description: "8-seater custom dining table with matching chairs",
      status: JobStatus.IN_PROGRESS,
      startDate: new Date("2024-07-01"),
      expectedCompletion: new Date("2024-08-15"),
      estimatedCost: "8000",
      assignedTo: superAdmin.id,
    },
  });

  // Create standard board presets for the cutting optimizer
  const presets = [
    { name: "MDF Sheet 2440 x 1220", materialType: "MDF", length: "2440", width: "1220", thickness: "18" },
    { name: "Plywood Sheet 2440 x 1220", materialType: "PLYWOOD", length: "2440", width: "1220", thickness: "12" },
    { name: "Board 2750 x 1830", materialType: "MELAMINE", length: "2750", width: "1830", thickness: "16" },
    { name: "Board 2800 x 2070", materialType: "CHIPBOARD", length: "2800", width: "2070", thickness: "18" },
    { name: "Board 3050 x 1220", materialType: "PLYWOOD", length: "3050", width: "1220", thickness: "15" },
  ];
  for (const p of presets) {
    await prisma.boardPreset.upsert({
      where: { name: p.name },
      update: {},
      create: { ...p, materialType: p.materialType as never },
    });
  }
  console.log("Job and board presets created");

  console.log("\nDatabase seeded successfully!");
  console.log("\n=== LOGIN CREDENTIALS (DEVELOPMENT ONLY) ===");
  console.log("Super Admin:  admin@honobi.com / Admin@123!");
  console.log("Shop Admin:   shop@honobi.com / Admin@123!");
  console.log("Manager:      manager@honobi.com / Manager@123!");
  console.log("Accountant:   accounts@honobi.com / Account@123!");
  console.log("Secretary:    secretary@honobi.com / Secretary@123!");
  console.log("Staff:        staff@honobi.com / Staff@123!");
  console.log("Storekeeper:  storekeeper@honobi.com / Staff@123!");
  console.log("=============================================\n");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
