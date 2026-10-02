# MASTER BUILD COMMAND — COMPLETE CARPENTRY SHOP WEBSITE & MANAGEMENT SYSTEM

You are a senior full-stack software architect and developer.

Build a **complete, production-ready Carpentry Shop Website and Business Management System** for:

**Business Name:** `HONOBI WOOD JOINERY`

The system must be built **entirely with Next.js**.

Do NOT create a separate backend application.

Do NOT use Laravel, PHP, Express.js, NestJS, Django, Spring Boot, or another backend framework.

The frontend and backend/API/server-side functionality must all be implemented inside the same Next.js application.

The final system should be modern, responsive, secure, scalable, maintainable, and suitable for deployment.

---

# 1. TECHNOLOGY STACK

Use the following technology stack:

### Core

* Next.js — latest stable version
* TypeScript
* React
* App Router
* Server Components where appropriate
* Server Actions where appropriate
* Route Handlers/API routes where appropriate

### Styling

* Tailwind CSS
* shadcn/ui
* Lucide React icons
* Responsive design
* Modern professional UI

### Database

Use PostgreSQL.

Use Prisma ORM for database access.

Create a complete Prisma schema with proper:

* Models
* Relationships
* Foreign keys
* Indexes
* Unique constraints
* Enums
* Timestamps
* Soft-delete fields where appropriate

### Authentication

Implement secure authentication using:

* Auth.js / NextAuth
* Email/password authentication
* Secure password hashing
* Role-based access control
* Protected dashboard routes
* Session management
* Logout
* Password reset architecture

Never store plain-text passwords.

### Validation

Use Zod for:

* Form validation
* API validation
* Server Action validation
* Request validation
* Database input validation

### Forms

Use:

* React Hook Form
* Zod

### Charts

Use Recharts for dashboard analytics.

### File/Image Uploads

Design the application so product/project images can be uploaded.

Use a storage abstraction that can support services such as:

* Cloudinary
* S3-compatible storage
* Vercel Blob

For the first implementation, make the storage provider configurable through environment variables.

---

# 2. IMPORTANT ARCHITECTURE REQUIREMENT

This is ONE Next.js application.

Use an architecture similar to:

app/
components/
lib/
services/
actions/
hooks/
types/
prisma/
public/
config/

Do not create a separate frontend and backend repository.

The Next.js application should contain:

* Public website
* Admin dashboard
* Authentication
* Database access
* API routes
* Server Actions
* Business logic
* File handling
* Reporting
* Analytics

Everything must live inside the Next.js project.

---

# 3. BUSINESS CONCEPT

The system is for a carpentry/furniture business.

The business needs two major parts:

## PUBLIC WEBSITE

Customers and visitors should be able to:

* View the company
* View products
* View completed projects
* View services
* View company information
* View contact information
* Request quotations
* Contact the business
* View project galleries
* View testimonials
* View business location
* View social media links

## PRIVATE MANAGEMENT DASHBOARD

Authorized staff should be able to manage:

* Products
* Projects
* Customers
* Quotations
* Orders/jobs
* Expenses
* Income
* Employees
* Inventory/materials
* Suppliers
* Payments
* Categories
* Services
* Testimonials
* Messages/inquiries
* Reports
* Users
* Settings

---

# 4. PUBLIC WEBSITE

Create a beautiful professional website for a modern Ghanaian carpentry/furniture business.

The website should have:

## Home Page

Include:

* Hero section
* Business name
* Strong headline
* Short description
* Call-to-action buttons
* Featured products
* Featured projects
* Services
* Why choose us
* Statistics
* Testimonials
* Gallery
* Contact section
* WhatsApp contact button
* Footer

Example CTA:

"Request a Quote"

"View Our Projects"

"Contact Us"

---

# 5. ABOUT PAGE

Create:

`/about`

Include:

* Company story
* Mission
* Vision
* Core values
* Experience
* Team
* Why customers choose the business
* Business statistics

---

# 6. SERVICES PAGE

Create:

`/services`

Services may include:

* Custom furniture
* Kitchen cabinets
* Wardrobes
* Office furniture
* Doors
* Beds
* Tables
* Chairs
* TV consoles
* Interior woodwork
* Renovation
* Furniture repair
* Custom carpentry
* Installation

Services must be dynamically manageable from the dashboard.

---

# 7. PRODUCTS PAGE

Create:

`/products`

Customers should be able to browse furniture/products.

Each product should have:

* Product name
* Description
* Category
* Price
* Optional discounted price
* Images
* Dimensions
* Materials
* Color
* Availability
* Featured status
* SKU
* Product status

Product statuses:

* Available
* Out of Stock
* Made to Order
* Discontinued

Allow customers to:

* Search
* Filter
* Sort
* Open product details
* Request quotation

---

# 8. PRODUCT DETAILS PAGE

Create:

`/products/[slug]`

Display:

* Large product gallery
* Product name
* Price
* Description
* Materials
* Dimensions
* Availability
* Related products
* Request quotation button
* WhatsApp button

---

# 9. PROJECTS / PORTFOLIO

Create:

`/projects`

This is extremely important.

The carpentry business should be able to showcase projects completed for customers.

Each project should contain:

* Project name
* Slug
* Description
* Customer name (optional/private)
* Project category
* Location
* Start date
* Completion date
* Budget
* Status
* Cover image
* Multiple gallery images
* Materials used
* Services performed
* Featured status

Project statuses:

* Planning
* In Progress
* Completed
* Cancelled

Public visitors should see completed projects.

Do not expose private customer financial information publicly.

---

# 10. PROJECT DETAILS

Create:

`/projects/[slug]`

Display:

* Project title
* Description
* Project gallery
* Before/after images where available
* Materials used
* Services provided
* Completion information
* Related projects

Create a beautiful image gallery/lightbox.

---

# 11. QUOTATION REQUEST

Allow customers to request a quotation.

Create:

`/quote`

Fields:

* Customer name
* Phone
* Email
* Location
* Project type
* Description
* Estimated budget
* Preferred date
* File/image upload
* Additional notes

Save quotation requests in the database.

Admin users should receive notification of new quotation requests.

---

# 12. CONTACT PAGE

Create:

`/contact`

Include:

* Phone
* Email
* WhatsApp
* Address
* Google Maps section
* Business hours
* Contact form
* Social media links

Contact submissions must be stored in the database.

---

# 13. CUSTOMER MANAGEMENT

Dashboard route:

`/dashboard/customers`

Allow authorized users to:

* Add customers
* Edit customers
* Delete/archive customers
* Search customers
* Filter customers
* View customer profile
* View customer projects
* View quotations
* View orders/jobs
* View payments
* View transaction history

Customer fields:

* Name
* Phone
* Alternative phone
* Email
* Address
* City
* Region
* Notes
* Customer status
* Created date

---

# 14. JOB / ORDER MANAGEMENT

Create a system for managing actual carpentry jobs.

Dashboard:

`/dashboard/jobs`

A job should contain:

* Job number
* Customer
* Job title
* Description
* Project
* Assigned employee
* Start date
* Expected completion date
* Actual completion date
* Estimated cost
* Final cost
* Amount paid
* Balance
* Status
* Notes

Statuses:

* Pending
* Approved
* In Progress
* On Hold
* Completed
* Delivered
* Cancelled

Show job progress.

Allow staff to update job status.

---

# 15. INCOME MANAGEMENT

Create:

`/dashboard/income`

The business owner should be able to record income.

Fields:

* Income number
* Date
* Amount
* Customer
* Job
* Payment method
* Category
* Description
* Reference
* Recorded by

Income categories:

* Furniture Sales
* Carpentry Services
* Installation
* Repairs
* Delivery
* Custom Orders
* Other

Payment methods:

* Cash
* Mobile Money
* Bank Transfer
* Card
* Other

---

# 16. EXPENSE MANAGEMENT

Create:

`/dashboard/expenses`

This is one of the most important features.

Allow the business to record all expenses.

Expense fields:

* Expense number
* Date
* Amount
* Category
* Supplier
* Description
* Payment method
* Reference
* Receipt
* Recorded by

Expense categories:

* Wood
* Plywood
* MDF
* Nails
* Screws
* Glue
* Paint
* Varnish
* Sandpaper
* Hardware
* Electricity
* Water
* Rent
* Transport
* Fuel
* Salaries
* Tools
* Machine maintenance
* Repairs
* Marketing
* Internet
* Packaging
* Delivery
* Other

Allow receipt/image uploads.

---

# 17. FINANCIAL DASHBOARD

Create:

`/dashboard/finance`

Show:

* Total income
* Total expenses
* Net profit
* Outstanding payments
* Paid invoices
* Unpaid invoices
* Monthly income
* Monthly expenses
* Monthly profit
* Expense breakdown
* Income breakdown
* Cash flow

Use Recharts.

Charts:

* Income vs Expenses
* Monthly Profit
* Expense Categories
* Income Categories
* Payment Methods

Allow filtering by:

* Today
* This week
* This month
* Last month
* This year
* Custom date range

---

# 18. INVENTORY / MATERIAL MANAGEMENT

Create:

`/dashboard/inventory`

Track materials used by the carpentry shop.

Examples:

* Wood
* Plywood
* MDF
* Veneer
* Nails
* Screws
* Hinges
* Handles
* Glue
* Paint
* Varnish
* Sandpaper
* Other materials

Fields:

* Item name
* SKU
* Category
* Unit
* Quantity
* Minimum stock
* Cost per unit
* Supplier
* Location
* Status

Units:

* Pieces
* Sheets
* Meters
* Litres
* Kilograms
* Boxes
* Sets

Implement stock movements:

* Stock In
* Stock Out
* Adjustment

Show low-stock alerts.

---

# 19. SUPPLIER MANAGEMENT

Create:

`/dashboard/suppliers`

Allow:

* Add supplier
* Edit supplier
* Archive supplier
* View supplier
* Record purchases
* Track supplier expenses

Fields:

* Supplier name
* Contact person
* Phone
* Email
* Address
* Products/materials supplied
* Notes

---

# 20. EMPLOYEE MANAGEMENT

Create:

`/dashboard/employees`

Fields:

* Name
* Employee ID
* Phone
* Email
* Position
* Salary
* Hire date
* Status
* Address
* Emergency contact

Positions can include:

* Carpenter
* Assistant Carpenter
* Finishing Specialist
* Installer
* Driver
* Storekeeper
* Accountant
* Manager
* Administrator

Do not expose employee private information on the public website.

---

# 21. PAYROLL / STAFF EXPENSES

Create basic staff payment management.

Allow:

* Salary records
* Salary payments
* Advances
* Bonuses
* Deductions
* Payment history

Do not build a complex statutory payroll system unless explicitly required.

---

# 22. SERVICES MANAGEMENT

Dashboard:

`/dashboard/services`

Admin can:

* Create service
* Edit service
* Delete/archive service
* Upload service image
* Set description
* Set featured status

Services should automatically appear on the public website.

---

# 23. CATEGORIES

Create category management for:

* Products
* Projects
* Services
* Expenses
* Income
* Inventory

Categories should be manageable from the dashboard.

---

# 24. TESTIMONIAL MANAGEMENT

Create:

`/dashboard/testimonials`

Fields:

* Customer name
* Customer role/company
* Testimonial
* Customer image
* Rating
* Featured
* Status

Allow admin approval before testimonials appear publicly.

---

# 25. MEDIA / GALLERY MANAGEMENT

Create a media library.

Allow administrators to:

* Upload images
* Delete images
* Organize images
* Assign images to projects
* Assign images to products
* Assign images to services

Use optimized images.

Use Next.js Image component.

---

# 26. INQUIRY / CONTACT MANAGEMENT

Create:

`/dashboard/messages`

Store:

* Name
* Email
* Phone
* Subject
* Message
* Source
* Status
* Created date

Statuses:

* New
* Read
* Replied
* Closed

---

# 27. NOTIFICATIONS

Create dashboard notifications.

Examples:

* New quotation request
* New contact message
* Low inventory
* Outstanding payment
* Job due soon
* New customer
* New income
* New expense

Display unread notification count.

---

# 28. ADMIN DASHBOARD

Create a professional dashboard:

`/dashboard`

Sidebar navigation:

* Dashboard
* Customers
* Quotations
* Jobs
* Products
* Projects
* Services
* Inventory
* Suppliers
* Income
* Expenses
* Finance
* Employees
* Payroll
* Testimonials
* Messages
* Reports
* Users
* Settings

Dashboard cards:

* Total Customers
* Active Jobs
* Completed Projects
* Total Income
* Total Expenses
* Net Profit
* Outstanding Balance
* Inventory Alerts

Add charts and recent activities.

---

# 29. REPORTING SYSTEM

Create:

`/dashboard/reports`

Reports should include:

### Financial Report

* Income
* Expenses
* Profit
* Outstanding balances

### Sales Report

* Product sales
* Service revenue
* Customer purchases

### Expense Report

* Expense categories
* Suppliers
* Monthly expenses

### Job Report

* Completed jobs
* Active jobs
* Cancelled jobs

### Inventory Report

* Current stock
* Low stock
* Stock movements

Allow:

* Date filtering
* Search
* Export CSV
* Print-friendly reports

Where practical, allow PDF generation.

---

# 30. INVOICE SYSTEM

Create invoices for customers.

Invoice fields:

* Invoice number
* Customer
* Job
* Items
* Quantity
* Unit price
* Subtotal
* Discount
* Tax if enabled
* Total
* Amount paid
* Balance
* Payment status
* Due date

Statuses:

* Draft
* Sent
* Partially Paid
* Paid
* Overdue
* Cancelled

Create printable invoice pages.

---

# 31. PAYMENT MANAGEMENT

Track payments.

Fields:

* Payment reference
* Customer
* Invoice
* Job
* Amount
* Date
* Payment method
* Notes
* Recorded by

Automatically update:

* Invoice balance
* Job balance
* Customer balance

---

# 32. USER MANAGEMENT

Create:

`/dashboard/users`

Roles:

### SUPER_ADMIN

Full access.

### ADMIN

Most operational functions.

### MANAGER

Customers, products, projects, jobs, inventory and reports.

### ACCOUNTANT

Income, expenses, invoices, payments and financial reports.

### STAFF

Limited operational access.

Implement proper role-based authorization.

Do NOT rely only on hiding UI buttons.

Authorization must also be enforced server-side.

---

# 33. SETTINGS

Create:

`/dashboard/settings`

Settings should include:

### Business Information

* Business name
* Logo
* Phone
* Email
* Address
* Region
* Country
* WhatsApp
* Website

### Business Hours

* Monday
* Tuesday
* Wednesday
* Thursday
* Friday
* Saturday
* Sunday

### Currency

Default:

Ghana Cedi (GHS)

Allow configuration.

### Tax

Allow optional tax configuration.

### Invoice Settings

* Invoice prefix
* Payment terms
* Footer text

### Social Media

* Facebook
* Instagram
* TikTok
* YouTube
* LinkedIn

---

# 34. GHANA-SPECIFIC REQUIREMENTS

The application is intended for a carpentry business operating in Ghana.

Use:

* Ghana Cedi (GHS)
* Ghana phone number format
* Ghana regions
* Mobile Money as a payment method
* MTN Mobile Money
* Telecel Cash
* AirtelTigo Money
* Bank Transfer
* Cash

Do not hard-code payment integration unless credentials are provided.

Create a payment-provider abstraction so integrations can be added later.

---

# 35. DATABASE DESIGN

Create a proper relational Prisma schema.

At minimum consider these models:

* User
* Role
* Customer
* Product
* ProductImage
* ProductCategory
* Project
* ProjectImage
* ProjectCategory
* Service
* ServiceCategory
* Quote
* QuoteItem
* Job
* JobItem
* Invoice
* InvoiceItem
* Payment
* Income
* Expense
* ExpenseCategory
* Supplier
* InventoryItem
* InventoryCategory
* StockMovement
* Employee
* SalaryPayment
* Testimonial
* ContactMessage
* Notification
* Media
* Setting
* AuditLog

Use proper relationships.

Add createdAt and updatedAt to appropriate models.

Use UUIDs or secure IDs where appropriate.

---

# 36. AUDIT LOGGING

Create an audit system.

Track important actions:

* Login
* Logout
* Create
* Update
* Delete
* Payment
* Expense
* Income
* Invoice changes
* User changes
* Settings changes

Store:

* User
* Action
* Entity
* Entity ID
* Timestamp
* Metadata

---

# 37. SECURITY

Security is extremely important.

Implement:

* Secure authentication
* Password hashing
* Role-based authorization
* Server-side validation
* Zod validation
* CSRF protection where applicable
* Secure cookies
* Input sanitization
* Rate limiting for public forms
* File upload validation
* File size restrictions
* Allowed MIME types
* SQL injection prevention through Prisma
* XSS protection
* Proper authorization checks
* Secure environment variables
* No secrets in frontend code

Never expose:

* Database credentials
* API secrets
* Authentication secrets
* Private customer data

---

# 38. SEO

Implement SEO for the public website.

Use:

* Metadata
* Open Graph
* Twitter/X cards
* Sitemap
* Robots.txt
* Canonical URLs
* Structured data where appropriate
* SEO-friendly URLs

Each product and project should have dynamic metadata.

---

# 39. PERFORMANCE

Optimize the application.

Use:

* Server Components where appropriate
* Dynamic imports
* Image optimization
* Lazy loading
* Pagination
* Database indexes
* Efficient queries
* Caching where appropriate
* Loading states
* Skeleton loaders

Do not load thousands of database records at once.

Use pagination.

---

# 40. RESPONSIVE DESIGN

The entire system must work on:

* Desktop
* Laptop
* Tablet
* Mobile

The public website should be mobile-first.

The dashboard should have:

* Collapsible sidebar
* Mobile navigation
* Responsive tables
* Responsive forms
* Responsive cards
* Responsive charts

---

# 41. UI DESIGN

Use a modern premium carpentry/furniture aesthetic.

Design inspiration:

* Wood
* Furniture
* Craftsmanship
* Warm professional appearance
* Clean white/neutral backgrounds
* Natural wood-inspired accent colors

Do not make the interface look outdated.

Use:

* Cards
* Soft shadows
* Rounded corners
* Clean typography
* Large images
* Professional spacing
* Subtle animations

Do not overuse animations.

---

# 42. DASHBOARD UX

Tables must support:

* Search
* Sorting
* Pagination
* Filters
* Date filtering
* Status filtering
* Actions

Actions should include:

* View
* Edit
* Archive
* Delete where appropriate

Use confirmation dialogs for destructive actions.

Show toast notifications after successful actions.

---

# 43. PUBLIC WEBSITE NAVIGATION

Create:

Home
About
Services
Products
Projects
Gallery
Request Quote
Contact

Add:

* WhatsApp button
* Call button
* Social links

---

# 44. DASHBOARD NAVIGATION

Create a professional sidebar.

Group navigation logically:

### Overview

* Dashboard

### Sales & Customers

* Customers
* Quotations
* Jobs
* Invoices
* Payments

### Products & Projects

* Products
* Projects
* Services

### Finance

* Income
* Expenses
* Finance
* Reports

### Inventory

* Inventory
* Suppliers
* Stock Movements

### Staff

* Employees
* Payroll

### Content

* Gallery
* Testimonials
* Messages

### Administration

* Users
* Audit Logs
* Settings

---

# 45. SEARCH

Implement global search where useful.

Search:

* Customers
* Products
* Projects
* Jobs
* Invoices
* Expenses
* Income
* Suppliers

---

# 46. DASHBOARD ANALYTICS

Dashboard should allow date ranges.

Example:

Current month:

Income: GHS 45,000
Expenses: GHS 22,000
Profit: GHS 23,000

Do not hard-code these numbers.

Calculate everything from the database.

---

# 47. BUSINESS PROFIT CALCULATION

Implement:

Net Profit = Total Income - Total Expenses

Also show:

Gross Revenue
Total Expenses
Outstanding Receivables
Net Profit

Make calculations server-side.

---

# 48. QUOTATION WORKFLOW

Implement:

Customer submits quote request.

↓

Admin receives notification.

↓

Admin reviews request.

↓

Admin creates quotation.

↓

Quotation can contain:

* Labour
* Materials
* Products
* Delivery
* Installation
* Other charges

↓

Admin sends quotation.

↓

Customer can receive a quotation reference.

↓

Admin can convert accepted quotation into:

Job + Invoice

---

# 49. JOB WORKFLOW

Implement:

Quote Accepted

↓

Create Job

↓

Assign Employee

↓

Start Job

↓

Track Progress

↓

Complete Job

↓

Generate Invoice

↓

Record Payment

↓

Mark Job Completed

---

# 50. INVENTORY WORKFLOW

When materials are purchased:

Stock In

When materials are used:

Stock Out

When stock is corrected:

Adjustment

Automatically calculate:

Current Stock

Low Stock

Stock Value

---

# 51. SEED DATA

Create Prisma seed data.

Create:

* One Super Admin
* One Admin
* One Manager
* One Accountant
* Sample customers
* Sample products
* Sample projects
* Sample services
* Sample income
* Sample expenses
* Sample inventory
* Sample suppliers

Use obvious development-only credentials and clearly mark them as needing replacement.

Never use weak default passwords in production.

---

# 52. ENVIRONMENT VARIABLES

Create:

`.env.example`

Include variables such as:

DATABASE_URL=
AUTH_SECRET=
NEXTAUTH_URL=
STORAGE_PROVIDER=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

Do not put real credentials in the repository.

---

# 53. ERROR HANDLING

Implement proper:

* Error pages
* 404 page
* Loading pages
* Empty states
* Form validation errors
* API errors
* Database error handling

Never expose stack traces to users.

---

# 54. ACCESSIBILITY

Follow accessibility best practices.

Use:

* Semantic HTML
* Labels
* Keyboard navigation
* Accessible dialogs
* Accessible buttons
* Proper color contrast
* Alt text for images
* Screen-reader-friendly forms

---

# 55. PROJECT STRUCTURE

Use a clean architecture similar to:

app/
(public)/
page.tsx
about/
services/
products/
projects/
gallery/
quote/
contact/

(auth)/
login/
register/
forgot-password/

dashboard/
page.tsx
customers/
quotations/
jobs/
products/
projects/
services/
inventory/
suppliers/
income/
expenses/
finance/
employees/
payroll/
invoices/
payments/
testimonials/
messages/
reports/
users/
audit-logs/
settings/

api/

components/
ui/
dashboard/
public/
forms/
charts/
tables/
modals/

lib/
auth/
db/
validation/
permissions/
storage/
utils/

actions/
customers/
products/
projects/
expenses/
income/
invoices/
payments/
inventory/

services/

hooks/

types/

prisma/
schema.prisma
seed.ts

public/
images/
icons/

---

# 56. CODE QUALITY

Write production-quality TypeScript.

Avoid:

* `any` unless absolutely necessary
* duplicated logic
* huge components
* hard-coded business data
* hard-coded dashboard statistics
* unnecessary client components

Use reusable components.

Use service functions for business logic.

Keep database logic organized.

Use clear naming conventions.

---

# 57. API DESIGN

Where APIs are necessary, use Next.js Route Handlers.

Example:

GET /api/products

POST /api/products

GET /api/products/[id]

PATCH /api/products/[id]

DELETE /api/products/[id]

Follow REST principles.

However, use Server Actions where they are more appropriate for internal dashboard mutations.

---

# 58. DATA PROTECTION

Customer financial and personal information must never be displayed publicly.

Public project pages should only expose information intentionally marked as public.

Add fields such as:

`isPublic`

where appropriate.

---

# 59. ADMIN EXPERIENCE

Make the dashboard feel like a real business management application.

Include:

* Dashboard cards
* Data tables
* Filters
* Search
* Charts
* Forms
* Modals
* Confirmation dialogs
* Notifications
* Activity timeline
* Recent transactions
* Quick actions

Quick actions:

* Add Customer
* Add Product
* Add Project
* Add Expense
* Record Income
* Create Invoice
* Add Job

---

# 60. PUBLIC WEBSITE CMS FEATURES

The admin should be able to manage:

* Homepage content
* Hero title
* Hero description
* Hero image
* About section
* Services
* Products
* Projects
* Testimonials
* Contact details
* Social media
* Business hours

Avoid hard-coding content that should be editable.

---

# 61. WHATSAPP INTEGRATION

Add WhatsApp buttons.

Create configurable WhatsApp number in settings.

Generate links such as:

"Hello, I am interested in this product..."

For products and projects, dynamically generate the WhatsApp message.

Do not hard-code the phone number.

---

# 62. CUSTOMER COMMUNICATION

Create reusable message templates for:

* Quote received
* Quote approved
* Invoice generated
* Payment received
* Job completed
* Job ready for delivery

Design the system so SMS/WhatsApp/email providers can be integrated later.

---

# 63. BACKUP / DATA CONSIDERATIONS

Create documentation explaining:

* Database backup
* Image backup
* Environment variables
* Production deployment
* Database migration

---

# 64. TESTING

Create tests for important business logic.

At minimum test:

* Authentication
* Permissions
* Income calculations
* Expense calculations
* Profit calculation
* Invoice totals
* Payment balances
* Inventory calculations
* Quote conversion
* Job status transitions

---

# 65. DEPLOYMENT

The application must be suitable for deployment on:

* Vercel
* Any Next.js-compatible hosting

PostgreSQL can be hosted on:

* Neon
* Supabase
* Railway
* Render
* Other PostgreSQL providers

Provide deployment documentation.

---

# 66. README

Create a comprehensive README containing:

1. Project overview
2. Features
3. Technology stack
4. Requirements
5. Installation
6. Environment variables
7. Database setup
8. Prisma migration
9. Seed database
10. Development
11. Production build
12. Deployment
13. Authentication
14. Storage configuration
15. Troubleshooting

---

# 67. DEVELOPMENT COMMANDS

The project should support:

npm install

npm run dev

npm run build

npm run start

npm run lint

npm run test

Prisma commands should be documented.

---

# 68. IMPORTANT IMPLEMENTATION RULE

Do not only generate UI mockups.

I want a REAL WORKING APPLICATION.

Do not create buttons that do nothing.

Do not create fake dashboard numbers.

Do not use static arrays for business data where database data should be used.

Every major feature must connect to PostgreSQL through Prisma.

CRUD operations must actually work.

Forms must save data.

Edit functions must work.

Delete/archive functions must work.

Search must work.

Filters must work.

Pagination must work.

Authentication must work.

Authorization must work.

Reports must calculate real data.

Dashboard statistics must come from the database.

---

# 69. BUILD ORDER

Build the application in this order:

PHASE 1
Project setup

PHASE 2
Database schema

PHASE 3
Authentication

PHASE 4
Role/permission system

PHASE 5
Dashboard layout

PHASE 6
Customers

PHASE 7
Products

PHASE 8
Projects

PHASE 9
Services

PHASE 10
Quotations

PHASE 11
Jobs

PHASE 12
Invoices

PHASE 13
Payments

PHASE 14
Income

PHASE 15
Expenses

PHASE 16
Inventory

PHASE 17
Suppliers

PHASE 18
Employees

PHASE 19
Payroll

PHASE 20
Reports

PHASE 21
Notifications

PHASE 22
Media/gallery

PHASE 23
Public website

PHASE 24
SEO

PHASE 25
Security hardening

PHASE 26
Testing

PHASE 27
Deployment configuration

PHASE 28
Documentation

---

# 70. IMPORTANT CODING AGENT INSTRUCTION

Before writing code:

1. Analyze the complete requirements.
2. Create the project architecture.
3. Create the Prisma schema.
4. Identify all relationships.
5. Identify permissions.
6. Identify reusable components.
7. Identify server-side business logic.
8. Then implement the system.

Do not repeatedly ask me for confirmation for every small feature.

Make sensible professional decisions where the requirements are not explicitly specified.

If a requirement is ambiguous, choose the most practical production-ready implementation and document the decision.

---

# 71. DO NOT STOP AFTER CREATING THE INITIAL UI

Continue implementing the complete system.

Do not stop at:

* Homepage
* Login
* Dashboard mockup
* Database schema

The goal is a complete working application.

Continue until all major modules are implemented.

---

# 72. FINAL QUALITY CHECK

Before considering the project complete, verify:

[ ] Application starts successfully

[ ] TypeScript compiles

[ ] ESLint passes

[ ] Prisma schema is valid

[ ] Database migrations work

[ ] Seed data works

[ ] Authentication works

[ ] Authorization works

[ ] Public pages work

[ ] Dashboard works

[ ] CRUD operations work

[ ] Forms validate correctly

[ ] Image uploads work

[ ] Products work

[ ] Projects work

[ ] Customers work

[ ] Quotes work

[ ] Jobs work

[ ] Invoices work

[ ] Payments work

[ ] Income works

[ ] Expenses work

[ ] Inventory works

[ ] Suppliers work

[ ] Employees work

[ ] Reports work

[ ] Charts work

[ ] Notifications work

[ ] Search works

[ ] Pagination works

[ ] Mobile responsiveness works

[ ] SEO is configured

[ ] Security checks are implemented

[ ] Error handling works

[ ] README is complete

[ ] `.env.example` exists

[ ] Production build succeeds

---

# 73. FINAL OUTPUT REQUIRED

When development is complete, provide:

1. Complete project source code
2. Complete folder structure
3. Prisma schema
4. Database seed
5. Authentication implementation
6. Role/permission implementation
7. Public website
8. Admin dashboard
9. All CRUD modules
10. API routes / Server Actions
11. Validation
12. Image upload implementation
13. Reports
14. Charts
15. Invoice system
16. Financial management
17. Inventory management
18. Documentation
19. `.env.example`
20. Deployment instructions

The final application must be a **real, functional Next.js full-stack carpentry business management system**, not a prototype or static frontend.

Use `HONOBI WOOD JOINERY` everywhere the business name is required until the actual business name is provided.
