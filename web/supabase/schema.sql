-- Aura by Preethi commerce schema. Run in Supabase SQL Editor.
-- Service-role credentials must never be exposed to the browser.

create extension if not exists pgcrypto;

create table if not exists public.profiles(
 id uuid primary key references auth.users(id) on delete cascade,
 email text, full_name text,
 role text not null default 'customer' check(role in ('customer','admin')),
 created_at timestamptz not null default now()
);
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path=public as $$
begin
 insert into public.profiles(id,email,full_name,role) values(new.id,new.email,coalesce(new.raw_user_meta_data->>'full_name',''),'customer')
 on conflict(id) do update set email=excluded.email;
 return new;
end;$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create table if not exists public.products(
 id text primary key, slug text not null unique, name text not null,
 category text not null check(category in ('Sarees','Ready-made Blouses','Made-to-stitch')),
 price numeric(10,2) not null check(price>0), compare_at numeric(10,2),
 description text not null default '', fabric text not null default '',
 colors text[] not null default '{}', sizes text[] not null default '{}',
 stock integer not null default 0 check(stock>=0), image text not null, badge text,
 active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists products_active_category_idx on public.products(active,category);

create table if not exists public.orders(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete restrict,
 status text not null default 'pending' check(status in ('pending','paid','processing','shipped','delivered','cancelled','refunded')),
 amount_paise integer not null check(amount_paise>0), currency text not null default 'INR',
 razorpay_order_id text not null unique, razorpay_payment_id text unique,
 items jsonb not null default '[]'::jsonb, shipping_address jsonb not null,
 created_at timestamptz not null default now(), paid_at timestamptz, updated_at timestamptz not null default now()
);
create index if not exists orders_user_created_idx on public.orders(user_id,created_at desc);
create table if not exists public.enquiries(
 id uuid primary key default gen_random_uuid(), name text not null, email text not null, phone text not null,
 neckline text not null, sleeves text not null, back text not null, notes text not null default '',
 created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.enquiries enable row level security;

drop policy if exists "profile self read" on public.profiles;
create policy "profile self read" on public.profiles for select to authenticated using(auth.uid()=id);
-- Customer updates to the profile row are disabled so a user cannot change their own role to admin.
drop policy if exists "profile self update" on public.profiles;
drop policy if exists "public read active products" on public.products;
create policy "public read active products" on public.products for select to anon,authenticated using(active=true);
drop policy if exists "admin manages products" on public.products;
create policy "admin manages products" on public.products for all to authenticated
 using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'))
 with check(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
drop policy if exists "customer reads own orders" on public.orders;
create policy "customer reads own orders" on public.orders for select to authenticated using(auth.uid()=user_id);
-- No customer inserts/updates for orders. Trusted API routes create and update them with service credentials.
-- Enquiries are received through a server-side API with input validation; no table policy for public inserts.

create or replace function public.reserve_aura_stock(p_items jsonb)
returns boolean language plpgsql security definer set search_path=public as $$
declare v_item jsonb;
begin
 if jsonb_typeof(p_items) <> 'array' then raise exception 'invalid item list'; end if;
 for v_item in select value from jsonb_array_elements(p_items) loop
   if coalesce((v_item->>'quantity')::integer,0) < 1 then raise exception 'invalid quantity'; end if;
   update public.products set stock=stock-(v_item->>'quantity')::integer,updated_at=now()
   where id=v_item->>'product_id' and active=true and stock >= (v_item->>'quantity')::integer;
   if not found then raise exception 'insufficient stock'; end if;
 end loop;
 return true;
end;$$;

create or replace function public.release_aura_stock(p_items jsonb)
returns boolean language plpgsql security definer set search_path=public as $$
declare v_item jsonb;
begin
 if jsonb_typeof(p_items) <> 'array' then raise exception 'invalid item list'; end if;
 for v_item in select value from jsonb_array_elements(p_items) loop
   update public.products set stock=stock+(v_item->>'quantity')::integer,updated_at=now()
   where id=v_item->>'product_id';
 end loop;
 return true;
end;$$;

create or replace function public.complete_aura_order(p_razorpay_order_id text,p_razorpay_payment_id text)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_order public.orders%rowtype; v_updated uuid;
begin
 select * into v_order from public.orders where razorpay_order_id=p_razorpay_order_id for update;
 if not found then raise exception 'order not found'; end if;
 if v_order.status='paid' then return v_order.id; end if;
 if v_order.status <> 'pending' then raise exception 'order is not pending'; end if;
 update public.orders set status='paid',razorpay_payment_id=p_razorpay_payment_id,paid_at=now(),updated_at=now()
 where id=v_order.id and status='pending' returning id into v_updated;
 if v_updated is null then raise exception 'order status update failed'; end if;
 return v_updated;
end;$$;

create or replace function public.cancel_aura_order(p_order_id uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_order public.orders%rowtype; v_item jsonb; v_updated uuid;
begin
 select * into v_order from public.orders where id=p_order_id for update;
 if not found then raise exception 'order not found'; end if;
 if v_order.status='cancelled' then return v_order.id; end if;
 if v_order.status <> 'pending' then raise exception 'only unpaid pending orders may be cancelled automatically'; end if;
 for v_item in select value from jsonb_array_elements(v_order.items) loop
   update public.products set stock=stock+(v_item->>'quantity')::integer,updated_at=now()
   where id=v_item->>'product_id';
 end loop;
 update public.orders set status='cancelled',updated_at=now() where id=v_order.id and status='pending' returning id into v_updated;
 return v_updated;
end;$$;

revoke all on function public.reserve_aura_stock(jsonb) from public,anon,authenticated;
revoke all on function public.release_aura_stock(jsonb) from public,anon,authenticated;
revoke all on function public.complete_aura_order(text,text) from public,anon,authenticated;
revoke all on function public.cancel_aura_order(uuid) from public,anon,authenticated;
grant execute on function public.reserve_aura_stock(jsonb) to service_role;
grant execute on function public.release_aura_stock(jsonb) to service_role;
grant execute on function public.complete_aura_order(text,text) to service_role;
grant execute on function public.cancel_aura_order(uuid) to service_role;

insert into public.products(id,slug,name,category,price,compare_at,description,fabric,colors,sizes,stock,image,badge,active) values
('saree-tissue-001','tissue-silk-saree','Tissue Silk Saree','Sarees',2499,2999,'A rich tissue silk drape with a refined festive finish for celebrations and special evenings.','Tissue silk blend',array['Maroon','Rose','Gold'],array[]::text[],12,'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=85','Bestseller',true),
('saree-organza-002','organza-saree','Organza Saree','Sarees',2899,null,'Airy organza with a graceful silhouette for receptions, gifting and festive gatherings.','Organza',array['Ivory','Blush','Wine'],array[]::text[],8,'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=85','New arrival',true),
('saree-georgette-003','georgette-saree','Georgette Saree','Sarees',1999,null,'An easy-to-style drape with soft movement for everyday elegance and occasions.','Georgette',array['Lavender','Rose','Wine'],array[]::text[],16,'https://images.unsplash.com/photo-1583391733956-6c78276477e8?auto=format&fit=crop&w=1000&q=85',null,true),
('saree-chanderi-004','chanderi-saree','Chanderi Saree','Sarees',2699,null,'A light, luminous drape that pairs beautifully with a statement blouse.','Chanderi blend',array['Peach','Rose','Sand'],array[]::text[],7,'https://images.unsplash.com/photo-1610189012906-4c4c2d7d4d0a?auto=format&fit=crop&w=1000&q=85',null,true),
('blouse-maroon-005','maroon-embroidered-blouse','Maroon Embroidered Blouse','Ready-made Blouses',1299,null,'A richly toned blouse with delicate embroidery to complement your favourite saree.','Silk blend',array['Maroon','Wine'],array['XS','S','M','L','XL'],10,'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=85','Popular',true),
('blouse-beige-006','beige-silk-blouse','Beige Silk Blouse','Ready-made Blouses',1199,null,'A versatile silk-blend blouse in a soft neutral shade.','Silk blend',array['Beige','Champagne'],array['XS','S','M','L','XL'],9,'https://images.unsplash.com/photo-1583391733956-6c78276477e8?auto=format&fit=crop&w=1000&q=85',null,true),
('blouse-green-007','green-v-neck-blouse','Green V-Neck Blouse','Ready-made Blouses',1399,null,'A jewel-green blouse with a flattering neckline and festive detailing.','Cotton silk blend',array['Emerald','Bottle green'],array['XS','S','M','L','XL'],6,'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=85',null,true),
('stitch-custom-008','custom-blouse-stitching','Custom Blouse Stitching','Made-to-stitch',1599,null,'Starting price for made-to-stitch blouse services. Final pricing depends on design, fabric and measurements.','Customer-selected fabric',array['Custom'],array[]::text[],99,'https://images.unsplash.com/photo-1610189012906-4c4c2d7d4d0a?auto=format&fit=crop&w=1000&q=85','Made for you',true)
on conflict(id) do nothing;

-- Only after creating and verifying the store owner's Supabase account, promote its profile:
-- update public.profiles set role='admin' where email='your-verified-admin-email@example.com';


-- SECURITY: helper RPCs are SECURITY DEFINER and must never be callable by storefront users.
-- Only trusted server routes using the Supabase service-role key may reserve/release stock,
-- verify payments, or cancel pending orders.
revoke all on function public.reserve_aura_stock(jsonb) from public, anon, authenticated;
revoke all on function public.release_aura_stock(jsonb) from public, anon, authenticated;
revoke all on function public.complete_aura_order(text,text) from public, anon, authenticated;
revoke all on function public.cancel_aura_order(uuid) from public, anon, authenticated;
grant execute on function public.reserve_aura_stock(jsonb) to service_role;
grant execute on function public.release_aura_stock(jsonb) to service_role;
grant execute on function public.complete_aura_order(text,text) to service_role;
grant execute on function public.cancel_aura_order(uuid) to service_role;
