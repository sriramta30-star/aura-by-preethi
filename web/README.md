# Aura by Preethi | Full-stack fashion storefront

The app in this folder is the Next.js implementation; the root `index.html` remains a static preview. Configure Vercel's project Root Directory as `web`.

## Stack and features
- Next.js App Router, React, TypeScript, responsive burgundy/cream/gold styling.
- Product catalogue, search, category filters, sorting, quick detail modal, wishlist, local persisted cart, made-to-stitch enquiry.
- Supabase Auth and Postgres schema with row-level security.
- Server-side Razorpay order creation and payment signature verification.
- SEO metadata, product JSON-LD, robots and sitemap.

## Required setup before production
1. Create a Supabase project and run `supabase/schema.sql` in SQL Editor.
2. Add environment variables from `.env.example` to Vercel (after separately approving hosting access).
3. Verify your own Supabase account, then manually assign its profile `role='admin'` using the SQL note at the end of the schema.
4. Set Supabase Auth Site URL and allowed redirect URLs to the chosen production domain.
5. Configure Razorpay TEST keys first; test success, failure and verification before switching to live keys.
6. Replace example product prices, stock, and illustrative product imagery with actual approved inventory before taking orders.
7. Set `NEXT_PUBLIC_SITE_URL` to the production URL and verify canonical URLs, checkout and policy pages.

## Safety and status
No real credentials are included. Account login, data-backed admin and payments remain disabled until service variables and schema are configured. Order creation requires the signed-in user; price and stock are fetched on the server, and payment signatures are verified server-side. Do not accept real orders from the sample catalogue. No hosting deploy was performed.
