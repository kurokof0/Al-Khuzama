-- Al-Khuzama production-ready relational schema (PostgreSQL)
-- Covers guests, availability, dynamic pricing, bookings, add-on store, orders, payments, and 3D tour content.

create extension if not exists "uuid-ossp";

create type booking_slot_type as enum ('full_day', 'day_slot', 'evening_slot');
create type booking_status as enum ('draft', 'hold', 'pending_payment', 'confirmed', 'cancelled', 'completed');
create type payment_status as enum ('created', 'authorized', 'captured', 'failed', 'refunded');
create type order_status as enum ('cart', 'pending_payment', 'paid', 'fulfilled', 'cancelled', 'refunded');
create type product_type as enum ('service_addon', 'physical_product', 'digital_gift');

create table guests (
  id uuid primary key default uuid_generate_v4(),
  full_name varchar(160) not null,
  email varchar(180) unique,
  phone varchar(40) unique,
  preferred_locale varchar(10) default 'en-SA',
  marketing_opt_in boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table booking_rate_rules (
  id uuid primary key default uuid_generate_v4(),
  name varchar(120) not null,
  slot_type booking_slot_type not null,
  weekday_price_sar numeric(12, 2) not null,
  weekend_price_sar numeric(12, 2) not null,
  min_guests int not null default 2,
  included_guests int not null default 12,
  extra_guest_price_sar numeric(12, 2) not null default 95,
  deposit_percent numeric(5, 2) not null default 30.00,
  starts_on date,
  ends_on date,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table availability_blocks (
  id uuid primary key default uuid_generate_v4(),
  block_date date not null,
  slot_type booking_slot_type,
  reason varchar(180) not null,
  is_bookable boolean not null default false,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique (block_date, slot_type)
);

create table bookings (
  id uuid primary key default uuid_generate_v4(),
  guest_id uuid references guests(id) on delete set null,
  booking_date date not null,
  slot_type booking_slot_type not null,
  guest_count int not null check (guest_count > 0),
  status booking_status not null default 'draft',
  currency char(3) not null default 'SAR',
  base_rate_sar numeric(12, 2) not null,
  guest_surcharge_sar numeric(12, 2) not null default 0,
  seasonal_adjustment_sar numeric(12, 2) not null default 0,
  service_fee_sar numeric(12, 2) not null default 0,
  vat_sar numeric(12, 2) not null default 0,
  total_sar numeric(12, 2) not null,
  deposit_sar numeric(12, 2) not null,
  balance_sar numeric(12, 2) not null,
  hold_expires_at timestamptz,
  special_requests text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (booking_date, slot_type, status) deferrable initially immediate
);

create index idx_bookings_date_status on bookings (booking_date, status);
create index idx_bookings_guest on bookings (guest_id);

create table products (
  id uuid primary key default uuid_generate_v4(),
  sku varchar(80) unique not null,
  product_type product_type not null,
  name_en varchar(180) not null,
  name_ar varchar(180),
  description_en text,
  description_ar text,
  category varchar(80) not null,
  price_sar numeric(12, 2) not null,
  compare_at_price_sar numeric(12, 2),
  inventory_count int,
  is_active boolean not null default true,
  is_attachable_to_booking boolean not null default true,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_products_active_category on products (is_active, category);

create table orders (
  id uuid primary key default uuid_generate_v4(),
  guest_id uuid references guests(id) on delete set null,
  booking_id uuid references bookings(id) on delete set null,
  status order_status not null default 'cart',
  currency char(3) not null default 'SAR',
  subtotal_sar numeric(12, 2) not null default 0,
  vat_sar numeric(12, 2) not null default 0,
  discount_sar numeric(12, 2) not null default 0,
  total_sar numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  item_name varchar(180) not null,
  quantity int not null check (quantity > 0),
  unit_price_sar numeric(12, 2) not null,
  total_sar numeric(12, 2) not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_order_items_order on order_items (order_id);

create table payments (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid references bookings(id) on delete set null,
  order_id uuid references orders(id) on delete set null,
  provider varchar(40) not null, -- moyasar, tap, hyperpay, stripe
  provider_payment_id varchar(180) unique,
  status payment_status not null default 'created',
  method varchar(40), -- mada, apple_pay, stc_pay, visa, mastercard
  currency char(3) not null default 'SAR',
  amount_sar numeric(12, 2) not null,
  amount_provider_currency numeric(12, 3),
  provider_payload jsonb not null default '{}'::jsonb,
  webhook_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (booking_id is not null or order_id is not null)
);

create index idx_payments_booking on payments (booking_id);
create index idx_payments_order on payments (order_id);

create table tour_hotspots (
  id uuid primary key default uuid_generate_v4(),
  title_en varchar(160) not null,
  title_ar varchar(160),
  description_en text,
  description_ar text,
  asset_provider varchar(40) not null default 'threejs', -- threejs, spline, matterport
  asset_url text,
  position_x numeric(6, 3),
  position_y numeric(6, 3),
  position_z numeric(6, 3),
  display_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
