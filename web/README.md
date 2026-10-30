# Aura by Preethi | Full-stack fashion storefront

The Next.js application lives in `web/`. The root `index.html` is an older static preview. The full e-commerce project is in the `codex/full-ecommerce` development branch and should be merged only after review. For Vercel, configure the project Root Directory as `web`.

## Stack and implemented features
- Next.js App Router, React 19, TypeScript and responsive burgundy, ivory and gold styling.
- Product catalogue with search, category filters, sorting, quick view and SEO product detail pages.
- Browser-persisted shopping bag and wishlist, size and colour variants, made-to-stitch enquiry form.
- Supabase email/password authentication, PostgreSQL schema and row-level security.
- Protected administrator dashboard, product creation, product image uploads, stock visibility and order status controls.
- Server-side Razorpay order creation, payment signature verification and signed payment webhook.
- Product structured data, keyword-focused metadata, robots and database-aware sitemap.
- Generated fashion placeholders in `web/public/fashion/`. Replace them with approved product photography before taking real orders.

## Provider setup still required
1. Create a Supabase project and run `web/supabase/schema.sql` in its SQL Editor.
2. Create a verified store-owner account. Only after email verification, use the SQL note at the end of the schema to assign that profile `role='admin'`.
3. The schema creates a public-read `product-images` bucket and admin-only upload/update/delete policies. Log in with the verified administrator account to upload product photos in the dashboard.
4. Add the variables from `.env.example` to Vercel after you approve Vercel access and link the project. Never commit real values.
5. Set Supabase Auth Site URL and allowed redirect URLs to the final domain.
6. Configure Razorpay TEST keys first. Register the webhook URL `https://YOUR-DOMAIN/api/payments/webhook` for `payment.captured`, then store the webhook secret as `RAZORPAY_WEBHOOK_SECRET`. Test success, failure, dismiss and retry cases before using live credentials.
7. Enable the `pg_cron` extension in Supabase and schedule abandoned-order cleanup (unpaid orders older than 30 minutes):
   ```sql
   create extension if not exists pg_cron with schema extensions;
   select cron.schedule(
     'expire-aura-pending-orders',
     '*/10 * * * *',
     $$select public.expire_aura_pending_orders();$$
   );
   ```
8. Replace sample catalogue prices, stock, fabrics, sizes and policies with actual approved store information. Review shipping, returns, privacy and customer support details before launch.

## Current release state
No Vercel deployment has been made. The feature branch is a draft review and must not be treated as a public store yet. Supabase and Razorpay are not configured in this repository. Authentication, live inventory, admin operations and payment checkout remain inactive until the store owner configures those services. Sample items are not confirmed inventory. Do not accept real orders or payments against placeholders.
