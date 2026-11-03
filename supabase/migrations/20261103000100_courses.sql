-- Malta Detailing Academy courses, as on the live WooCommerce + ACF site:
--  * stock follows WooCommerce: a variant (course date) that manages its own
--    stock uses it, otherwise the course's stock is used. Each reserved line
--    records which one it took (`stock_source`), so releasing puts it back
--    in the same place;
--  * backorders: when allowed, a course can be booked with no seats left
--    ("Available next course");
--  * stock_messages: the per-course seat texts ("%s seats available"...);
--  * details: the icon list on the course page, on details_background_media_id;
--  * upsell_ids ("You may also like") and cross_sell_ids (cart);
--  * courses are not shipped, so a paid checkout no longer needs a Malta
--    delivery address.

alter table public.products
  add column backorders boolean not null default false,
  add column hide_stock_status boolean not null default false,
  -- {"in_stock": "%s seats available", "low_stock": "Only 1 seat available",
  --  "backorder": "Available next course", "out_of_stock": "Course full..."}
  add column stock_messages jsonb not null default '{}'::jsonb,
  -- [{"icon_media_id": uuid | null, "html": "Approx. 3hr"}]
  add column details jsonb not null default '[]'::jsonb,
  add column details_background_media_id uuid references public.media (id) on delete set null,
  add column upsell_ids uuid[] not null default '{}',
  add column cross_sell_ids uuid[] not null default '{}';
create index products_details_background_idx on public.products (details_background_media_id);

alter table public.product_variants
  add column backorders boolean not null default false;

-- The media delete guard and history already scan whole product rows, so the
-- new media columns are covered.

create or replace function public.reserve_shop_checkout(
  checkout_id uuid, customer uuid, lines jsonb, shipping integer,
  shipping_label text, vat numeric, live boolean, expires timestamptz)
returns uuid language plpgsql set search_path = '' as $$
declare
  item jsonb; p public.products; v public.product_variants;
  amount integer := shipping; base integer; qty integer;
  source text; stored jsonb := '[]'::jsonb;
begin
 if jsonb_array_length(lines) < 1 or jsonb_array_length(lines) > 50 or shipping < 0 or vat <> 0.18 then raise exception 'Invalid checkout'; end if;
 if expires is null or expires <= now() or expires > now() + interval '2 hours' then raise exception 'Invalid expiry'; end if;
 -- Lock in a stable order; every checkout locks the parent before variants.
 for item in select value from jsonb_array_elements(lines) order by value->>'product_id', value->>'variant_id' loop
   qty := (item->>'quantity')::integer;
   if qty not between 1 and 99 then raise exception 'Invalid quantity'; end if;
   if coalesce((item->>'addons_cents')::integer, 0) < 0 then raise exception 'Invalid add-ons'; end if;
   base := (item->>'unit_price_cents')::integer - coalesce((item->>'addons_cents')::integer, 0);
   select * into strict p from public.products where id=(item->>'product_id')::uuid for update;
   if p.status <> 'published' then raise exception 'Product unavailable'; end if;
   source := null;
   if nullif(item->>'variant_id','') is not null then
     select * into strict v from public.product_variants where id=(item->>'variant_id')::uuid and product_id=p.id for update;
     if coalesce(v.sale_price_cents,v.price_cents) is distinct from base or base <= 0 then raise exception 'Variant unavailable or price changed'; end if;
     if v.manage_stock then
       if coalesce(v.stock_quantity,0) < qty and not v.backorders then raise exception 'Insufficient stock'; end if;
       update public.product_variants set stock_quantity=coalesce(stock_quantity,0)-qty where id=v.id;
       source := 'variant';
     elsif v.stock_status = 'out_of_stock' then
       raise exception 'Variant unavailable or price changed';
     end if;
   else
     if exists(select 1 from public.product_variants where product_id=p.id) or coalesce(p.sale_price_cents,p.price_cents) is distinct from base or base <= 0 then raise exception 'Choose a variant or refresh price'; end if;
   end if;
   if source is null then
     if p.manage_stock then
       if coalesce(p.stock_quantity,0) < qty and not p.backorders then raise exception 'Insufficient stock'; end if;
       update public.products set stock_quantity=coalesce(stock_quantity,0)-qty where id=p.id;
       source := 'product';
     elsif p.stock_status = 'out_of_stock' then
       raise exception 'Product unavailable';
     end if;
   end if;
   amount := amount + (item->>'unit_price_cents')::integer*qty;
   stored := stored || jsonb_build_array(item || jsonb_build_object('stock_source', source));
 end loop;
 insert into public.shop_checkouts(id,customer_id,items,shipping_cents,shipping_method,vat_rate,total_cents,livemode,expires_at)
 values(checkout_id,customer,stored,shipping,shipping_label,vat,amount,live,expires);
 return checkout_id;
end $$;

-- Puts a line's seats back (direction 1) or takes them again (-1), on the
-- same stock it was reserved from.
create function private.move_line_stock(item jsonb, direction integer)
returns void language plpgsql set search_path = '' as $$
begin
 if item->>'stock_source' = 'variant' then
   update public.product_variants set stock_quantity=coalesce(stock_quantity,0)+direction*(item->>'quantity')::integer
     where id=nullif(item->>'variant_id','')::uuid;
 elsif item->>'stock_source' = 'product' then
   update public.products set stock_quantity=coalesce(stock_quantity,0)+direction*(item->>'quantity')::integer
     where id=(item->>'product_id')::uuid;
 end if;
end $$;
revoke all on function private.move_line_stock(jsonb, integer) from public, anon, authenticated;

create or replace function public.release_shop_checkout(checkout_id uuid)
returns void language plpgsql set search_path = '' as $$
declare c public.shop_checkouts; item jsonb;
begin
 select * into c from public.shop_checkouts where id=checkout_id for update;
 if c.id is null or c.state <> 'reserved' then return; end if;
 for item in select value from jsonb_array_elements(c.items) order by value->>'product_id', value->>'variant_id' loop
   perform private.move_line_stock(item, 1);
 end loop;
 update public.shop_checkouts set state='released',updated_at=now() where id=c.id;
end $$;

create or replace function public.complete_shop_checkout(checkout_id uuid, session_id text, payment_intent text, email_address text, customer uuid, billing jsonb, shipping_address_input jsonb, paid_total integer)
returns uuid language plpgsql set search_path = '' as $$
declare c public.shop_checkouts; result uuid; item jsonb; late boolean := false;
begin
 select * into strict c from public.shop_checkouts where id=checkout_id for update;
 if c.state='paid' then return c.order_id; end if;
 -- A payment can arrive after the reservation was released (a late webhook
 -- racing the reconciler). The customer has paid, so the order is always
 -- recorded: the seats are taken again, even if that overbooks, and the
 -- order gets a note for the admin.
 if c.state='released' then
   for item in select value from jsonb_array_elements(c.items) order by value->>'product_id', value->>'variant_id' loop
     perform private.move_line_stock(item, -1);
   end loop;
   late := true;
 elsif c.state <> 'reserved' then
   raise exception 'Invalid paid checkout';
 end if;
 if paid_total <> c.total_cents then raise exception 'Invalid paid checkout'; end if;
 insert into public.orders(customer_id,email,status,subtotal_cents,shipping_cents,vat_cents,total_cents,billing_address,shipping_address,shipping_method,payment_method,stripe_checkout_session_id,stripe_payment_intent_id,paid_at,livemode,customer_note)
 values(coalesce(c.customer_id,customer),email_address,'processing',c.total_cents-c.shipping_cents,c.shipping_cents,round(c.total_cents*c.vat_rate/(1+c.vat_rate)),c.total_cents,billing,coalesce(shipping_address_input,'{}'),c.shipping_method,'stripe',session_id,payment_intent,now(),c.livemode,coalesce(c.customer_details->>'note','')) returning id into result;
 for item in select value from jsonb_array_elements(c.items) loop
   insert into public.order_items(order_id,product_id,variant_id,name,option_values,addons,sku,quantity,unit_price_cents,total_cents)
   values(result,(item->>'product_id')::uuid,nullif(item->>'variant_id','')::uuid,item->>'name',coalesce(item->'option_values','{}'),coalesce(item->'addons','[]'),item->>'sku',(item->>'quantity')::integer,(item->>'unit_price_cents')::integer,(item->>'quantity')::integer*(item->>'unit_price_cents')::integer);
 end loop;
 if late then
   insert into public.order_notes(order_id,body) values(result,'Paid after the seat reservation had lapsed. The seats were taken again and the course may now be overbooked: check the numbers, or refund in Stripe.');
 end if;
 update public.shop_checkouts set state='paid',order_id=result,stripe_session_id=coalesce(stripe_session_id,session_id),updated_at=now() where id=c.id;
 return result;
end $$;

create or replace function public.purge_test_shop_checkouts()
returns integer language plpgsql set search_path = '' as $$
declare c public.shop_checkouts; item jsonb; removed integer;
begin
 for c in select * from public.shop_checkouts where not livemode order by id for update loop
   if c.state in ('reserved','paid') then
     for item in select value from jsonb_array_elements(c.items) order by value->>'product_id', value->>'variant_id' loop
       perform private.move_line_stock(item, 1);
     end loop;
   end if;
 end loop;
 delete from public.shop_checkouts where not livemode;
 delete from public.orders where not livemode;
 get diagnostics removed = row_count;
 return removed;
end $$;

revoke all on function public.reserve_shop_checkout(uuid,uuid,jsonb,integer,text,numeric,boolean,timestamptz) from public, anon, authenticated;
revoke all on function public.complete_shop_checkout(uuid,text,text,text,uuid,jsonb,jsonb,integer) from public, anon, authenticated;
revoke all on function public.release_shop_checkout(uuid) from public, anon, authenticated;
revoke all on function public.purge_test_shop_checkouts() from public, anon, authenticated;
grant execute on function public.reserve_shop_checkout(uuid,uuid,jsonb,integer,text,numeric,boolean,timestamptz) to service_role;
grant execute on function public.complete_shop_checkout(uuid,text,text,text,uuid,jsonb,jsonb,integer) to service_role;
grant execute on function public.release_shop_checkout(uuid) to service_role;
grant execute on function public.purge_test_shop_checkouts() to service_role;

-- The admin product editor saves the course fields with the product: same
-- function, with the course fields read from `product` when present.
create or replace function public.admin_save_product(target_id uuid, product jsonb, variants jsonb, gallery uuid[])
returns uuid language plpgsql set search_path = '' as $$
declare saved uuid; v jsonb; keep uuid[];
begin
 if not (select private.has_admin_capability('products')) then raise exception 'Admins only'; end if;
 if target_id is null then
   insert into public.products(slug,name,short_description,description,sku,price_cents,sale_price_cents,manage_stock,stock_quantity,stock_status,options,featured_media_id,status,sort_order,seo)
   values(product->>'slug',product->>'name',coalesce(product->>'short_description',''),coalesce(product->>'description',''),nullif(product->>'sku',''),(product->>'price_cents')::integer,(product->>'sale_price_cents')::integer,(product->>'manage_stock')::boolean,(product->>'stock_quantity')::integer,(product->>'stock_status')::public.stock_status,coalesce(product->'options','[]'),(product->>'featured_media_id')::uuid,(product->>'status')::public.publish_status,coalesce((product->>'sort_order')::integer,0),coalesce(product->'seo','{}'))
   returning id into saved;
 else
   update public.products set slug=product->>'slug',name=product->>'name',short_description=coalesce(product->>'short_description',''),description=coalesce(product->>'description',''),sku=nullif(product->>'sku',''),price_cents=(product->>'price_cents')::integer,sale_price_cents=(product->>'sale_price_cents')::integer,manage_stock=(product->>'manage_stock')::boolean,stock_quantity=(product->>'stock_quantity')::integer,stock_status=(product->>'stock_status')::public.stock_status,options=coalesce(product->'options','[]'),featured_media_id=(product->>'featured_media_id')::uuid,status=(product->>'status')::public.publish_status,sort_order=coalesce((product->>'sort_order')::integer,0),seo=coalesce(product->'seo','{}')
   where id=target_id returning id into saved;
   if saved is null then raise exception 'Product not found'; end if;
 end if;
 update public.products set
   backorders=coalesce((product->>'backorders')::boolean,backorders),
   hide_stock_status=coalesce((product->>'hide_stock_status')::boolean,hide_stock_status),
   stock_messages=coalesce(product->'stock_messages',stock_messages),
   details=coalesce(product->'details',details),
   details_background_media_id=case when product ? 'details_background_media_id' then (product->>'details_background_media_id')::uuid else details_background_media_id end,
   upsell_ids=case when product ? 'upsell_ids' then array(select jsonb_array_elements_text(product->'upsell_ids'))::uuid[] else upsell_ids end,
   cross_sell_ids=case when product ? 'cross_sell_ids' then array(select jsonb_array_elements_text(product->'cross_sell_ids'))::uuid[] else cross_sell_ids end
 where id=saved;

 -- A variant id may only belong to this product (never reparent).
 if exists(select 1 from jsonb_array_elements(variants) x
           join public.product_variants pv on pv.id=(x.value->>'id')::uuid
           where pv.product_id <> saved) then
   raise exception 'Invalid variant';
 end if;
 select coalesce(array_agg((x.value->>'id')::uuid),'{}') into keep from jsonb_array_elements(variants) x;
 delete from public.product_variants where product_variants.product_id=saved and not (id = any(keep));
 -- Clear option combinations first so reordered/swapped values don't collide.
 update public.product_variants set option_values=jsonb_build_object('_pending',id::text) where product_variants.product_id=saved;
 for v in select value from jsonb_array_elements(variants) with ordinality as t(value, n) order by n loop
   insert into public.product_variants(id,product_id,option_values,sku,price_cents,sale_price_cents,manage_stock,stock_quantity,stock_status,backorders,image_media_id,sort_order)
   values((v->>'id')::uuid,saved,coalesce(v->'option_values','{}'),nullif(v->>'sku',''),(v->>'price_cents')::integer,(v->>'sale_price_cents')::integer,(v->>'manage_stock')::boolean,(v->>'stock_quantity')::integer,(v->>'stock_status')::public.stock_status,coalesce((v->>'backorders')::boolean,false),(v->>'image_media_id')::uuid,(v->>'sort_order')::integer)
   on conflict (id) do update set option_values=excluded.option_values,sku=excluded.sku,price_cents=excluded.price_cents,sale_price_cents=excluded.sale_price_cents,manage_stock=excluded.manage_stock,stock_quantity=excluded.stock_quantity,stock_status=excluded.stock_status,backorders=excluded.backorders,image_media_id=excluded.image_media_id,sort_order=excluded.sort_order;
 end loop;

 delete from public.product_media where product_media.product_id=saved;
 insert into public.product_media(product_id,media_id,sort_order)
 select saved, m, n - 1 from unnest(gallery) with ordinality as g(m, n);
 return saved;
end $$;
revoke all on function public.admin_save_product(uuid,jsonb,jsonb,uuid[]) from public, anon;
grant execute on function public.admin_save_product(uuid,jsonb,jsonb,uuid[]) to authenticated;
