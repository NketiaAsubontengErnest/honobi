# Hosting HONOBI on Vercel

This document explains how to host the whole project on Vercel: the public website, the staff dashboard, the database and the uploaded files. The only thing that is not on Vercel is the email account used to send notifications, because Vercel does not host mailboxes. You enter that account in Dashboard > Settings > Email / SMTP.

Vercel's free Hobby plan is for personal, non-commercial use. A business site with a customer dashboard should use the Pro plan. Check the current terms on vercel.com/pricing.

## What is used

- Hosting and server code: Vercel Hosting and Functions
- Database: Vercel Postgres (Storage tab in the Vercel dashboard)
- Uploaded images and PDFs: Vercel Blob (Storage tab)
- Secrets and settings: Vercel Environment Variables
- Domain and HTTPS: Vercel Domains
- Builds, deploys and rollbacks: Vercel Git integration
- Email sending: your own SMTP mailbox (Gmail, Zoho, your domain provider)

## Step 1. Prepare the code

Vercel runs the app as short-lived serverless functions, so a few things in the project must change before the first deploy.

1. The server disk is temporary, so uploads saved to the uploads folder would disappear. Move media to Vercel Blob.
2. Requests to functions are limited to about 4.5 MB, and the upload limit is currently 8 MB. Lower it to 4 MB.
3. The Prisma client must be generated during the build. Add a postinstall script.
4. Functions open many short database connections. Use a pooled database URL for the app and a direct URL for schema changes.
5. The media page imports public/images using the file system on first visit. Remove that.
6. Next.js 16 renamed middleware.ts to proxy.ts. Rename it.
7. There is no prisma/migrations folder, so the first deploy uses prisma db push.

### 1a. package.json

Add the postinstall script:

```
"scripts": {
  "postinstall": "prisma generate",
  "build": "next build"
}
```

### 1b. prisma/schema.prisma

Add directUrl to the datasource:

```
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

DATABASE_URL is the pooled URL used by the running app. DIRECT_URL is the unpooled URL used by prisma db push.

### 1c. Media uploads with Vercel Blob

Install the package:

```
npm install @vercel/blob
```

In app/api/media/route.ts, replace the mkdir and writeFile lines with:

```
import { put } from "@vercel/blob";

const blob = await put(`media/${month}/${stored}`, buf, {
  access: "public",
  contentType: mime,
  addRandomSuffix: false,
});
const url = blob.url;
```

Then:

- In lib/media/storage.ts set MAX_UPLOAD_BYTES to 4 * 1024 * 1024.
- In actions/media/index.ts, change deleteMedia to call del(media.url) from @vercel/blob instead of unlink.
- Delete syncSiteImages from actions/media/index.ts and remove its call in app/dashboard/media/page.tsx.
- Delete app/uploads/[...path]/route.ts and remove the /uploads line from .gitignore.
- In next.config.ts add { protocol: "https", hostname: "*.public.blob.vercel-storage.com" } to images.remotePatterns.

### 1d. Rename middleware

```
git mv middleware.ts proxy.ts
```

Inside proxy.ts rename the exported function from middleware to proxy.

### 1e. Check the build locally

```
npm install
npx tsc --noEmit
npm run lint
npm run build
```

When these pass, commit and push to GitHub, GitLab or Bitbucket. Do not commit the .env file.

## Step 2. Create the Vercel project, database and storage

1. In Vercel choose Add New > Project and import the Git repository. The framework is detected as Next.js. Keep the default commands. Do not deploy yet.
2. In Settings > Functions set the Function Region close to your users and your database. For Ghana a European region such as Frankfurt, Paris or London is a good choice.
3. In the Storage tab create a Postgres database in the same region and connect it to the project.
4. In the Storage tab create a Blob store and connect it to the project. This adds BLOB_READ_WRITE_TOKEN automatically.

Optional: create a second Postgres store and limit it to the Preview environment, so preview deployments never touch real data.

## Step 3. Environment variables

Add these in Settings > Environment Variables.

Required:

- DATABASE_URL: the pooled Postgres URL
- DIRECT_URL: the direct (non-pooling) Postgres URL
- NEXTAUTH_SECRET: generate with `openssl rand -base64 32`, and use a different value from your local one
- NEXTAUTH_URL: https://your-domain.com (Production)
- NEXT_PUBLIC_APP_URL: https://your-domain.com (Production)
- BLOB_READ_WRITE_TOKEN: added by the Blob store

Public website details:

- NEXT_PUBLIC_WHATSAPP_NUMBER: digits only with country code, for example 233241234567
- NEXT_PUBLIC_CONTACT_PHONE: for example +233 24 123 4567
- NEXT_PUBLIC_CONTACT_EMAIL: for example info@your-domain.com
- NEXT_PUBLIC_CONTACT_ADDRESS: for example Tema, Greater Accra, Ghana

Optional fallbacks (normally you set SMTP in the dashboard instead): SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_SECURE, NOTIFICATION_EMAILS.

Notes:

- The Postgres integration may inject variables with other names, such as POSTGRES_PRISMA_URL and POSTGRES_URL_NON_POOLING. Copy their values into DATABASE_URL and DIRECT_URL, or point the schema at those names.
- If the pooled URL uses pgbouncer, add ?pgbouncer=true&connect_timeout=15 to it.
- Mark NEXTAUTH_SECRET, DATABASE_URL, DIRECT_URL and any SMTP password as Sensitive.
- Variables that start with NEXT_PUBLIC_ are fixed at build time. Redeploy after changing them.
- Do not set SEED_PASSWORD in Vercel.

## Step 4. Create the tables and first users

Do this once from your computer against the production database.

```
npm i -g vercel
vercel login
vercel link
vercel env pull .env.production.local
```

Copy DATABASE_URL and DIRECT_URL from .env.production.local into your .env (back up your local .env first). Then:

```
npx prisma db push
SEED_PASSWORD='a-long-random-password' npm run db:seed
```

On Windows PowerShell the seed command is:

```
$env:SEED_PASSWORD='a-long-random-password'; npm run db:seed
```

When finished, restore your local .env and delete .env.production.local.

The seed creates the roles, default settings and sample content. If you do not want the sample content in production, skip the seed, create your first admin directly in the database and add real products from the dashboard.

## Step 5. Deploy

1. Redeploy from Deployments (or push to the production branch). The log should show prisma generate, then next build, then a Ready status.
2. In Settings > Domains add your domain and www. Create the DNS records Vercel shows, or move the nameservers to Vercel. HTTPS certificates are issued automatically.
3. Set NEXTAUTH_URL and NEXT_PUBLIC_APP_URL to the final https domain and redeploy.
4. Open /login and sign in as admin@honobi.com with the SEED_PASSWORD you chose. In Users, create your real accounts, deactivate the demo accounts and change any remaining demo password.

## Step 6. Set up email

In Dashboard > Settings > Email / SMTP enter:

- smtp host (for Gmail: smtp.gmail.com)
- smtp port and secure (587 and false, or 465 and true)
- smtp user (your address)
- smtp password (for Gmail use an app password)
- sender name and sender address
- notification emails: the addresses that receive new messages and quote requests

Press Save and send test. Then submit the public contact form and confirm the message shows in Messages and arrives by email.

## Step 7. Check everything

Public site:

- Home, products, services, projects, gallery, contact and quote pages load with images.
- Prices are hidden unless "Show price on public site" is ticked on the product.
- robots.txt and sitemap.xml show the production domain.

Security:

- A wrong password shows "Invalid email or password".
- /dashboard redirects to /login when signed out.
- A STAFF user cannot open Employees, Users or Settings.

Features:

- A contact form submission appears in Messages and arrives by email.
- A quote form submission appears in Quotations and arrives by email.
- Media upload works and the image is still there after a refresh.
- An invoice can be created and a payment recorded, and the balance updates.
- A cutting plan can be generated and printed.
- Audit Logs shows your sign-in and the actions above.

## Day-to-day use

- Releasing a change: push a branch and Vercel builds a Preview URL. Test it, then merge to the production branch for an automatic production deploy.
- Rolling back: open an earlier deployment in Deployments and choose Promote to Production. It is instant and needs no rebuild.
- Changing the database: edit prisma/schema.prisma, prefer additive changes (new columns with defaults), then run npx prisma db push using the production DIRECT_URL.
- Moving to migrations later: run `npx prisma migrate dev --name init` once locally, then set the build script to `prisma migrate deploy && next build`.
- Backups: check the retention period in the Storage tab, test one restore, and keep an occasional pg_dump somewhere else.
- Errors: use Project > Logs. Email failures appear as "[email] send failed:".
- Rotating a secret: change it in Environment Variables and redeploy. Changing NEXTAUTH_SECRET signs everyone out.

## Troubleshooting

- Build fails with "@prisma/client did not initialize yet": the postinstall script is missing. Add it and redeploy.
- "Can't reach database server": check DATABASE_URL, keep the database and function region the same, and use the pooled URL for the app.
- "Too many connections" or "prepared statement already exists": add ?pgbouncer=true&connect_timeout=15 to the pooled URL, and use DIRECT_URL only for db push.
- Login keeps returning to /login: NEXTAUTH_URL or NEXTAUTH_SECRET is missing or wrong for Production.
- Upload fails with 413: the file is over the function limit. Keep uploads at 4 MB or less.
- Uploaded image disappears: media is still being written to local disk. Finish step 1c.
- No email arrives: use Save and send test in Settings, read the message, use an app password for Gmail, and check Project > Logs.
- Sitemap shows localhost, or a NEXT_PUBLIC value has no effect: set the variable and redeploy.
- Missing column error after a deploy: run npx prisma db push against the production DIRECT_URL.
