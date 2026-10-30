# Aura by Preethi | Full-stack fashion storefront

The Next.js application lives in `web/`. The root `index.html` is an independent static preview. Configure Vercel's project Root Directory as `web`.

## Stack and implemented features
- Next.js App Router, React 19, TypeScript and responsive burgundy, ivory and gold styling.
- Product catalogue with search, category filters, sorting, quick view and SEO product detail pages.
- Browser-persisted demo cart and wishlist, size and colour variants, made-to-stitch enquiry form.
- Supabase email/password authentication, PostgreSQL schema and row-level security.
- Server-side product administration and order management with administrator role checks.
- Server-side Razorpay order creation and payment signature verification.
- Product structured data, keyword-focused metadata, robots and sitemap routes.

## Setup still required before production
1. Create a Supabase project and run `web/supabase/schema.sql` in its SQL Editor.
2. Create a verified owner account, then use the SQL note at the end of the schema to assign that account `role='admin'`.
3. Add the variables from `.env.example` to Vercel after you approve Vercel access and link the project. Never commit real values.
4. Set Supabase Auth Site URL and allowed redirect URLs to the final domain.
5. Configure Razorpay TEST keys first; test successful payments, failed payments, and verification before using live keys.
6. Replace all example products, prices, stock quantities and generated placeholder photos with actual approved inventory.
7. Finalise and legally review store policies, delivery/returns rules and customer support details before taking orders.

## Current state
The application source and backend foundations are in this repository. No hosting deployment has been made. Authentication, the live catalogue, admin operations and payment checkout remain inactive until Supabase and Razorpay are configured. The sample products are not confirmed inventory. Never accept real orders or payments against placeholder products.