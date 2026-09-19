import type { BookingMode } from "./pricing";

export const HOTSPOTS = [
  {
    id: "pool",
    title: "Lavender-edge infinity pool",
    arabic: "مسبح بإطلالة الخزامى",
    description:
      "A rose-lit pool deck with shaded cabanas, chilled towels, and evening ambient lighting for private gatherings.",
    metric: "28°C water",
    position: { x: 24, y: 58 },
  },
  {
    id: "suite",
    title: "Signature guest suite",
    arabic: "جناح الضيافة الرئيسي",
    description:
      "Warm stone, linen textures, smart climate, and premium bedding designed for restorative overnight stays.",
    metric: "2 king rooms",
    position: { x: 53, y: 38 },
  },
  {
    id: "garden",
    title: "Lavender rose garden",
    arabic: "حديقة الورد والخزامى",
    description:
      "A fragrance-first garden walk with outdoor dining points and photography moments throughout the property.",
    metric: "900 m² garden",
    position: { x: 76, y: 64 },
  },
  {
    id: "majlis",
    title: "Indoor majlis lounge",
    arabic: "مجلس داخلي فاخر",
    description:
      "A private, high-comfort lounge for families, corporate retreats, and elegant evening hospitality.",
    metric: "24 guests",
    position: { x: 61, y: 52 },
  },
];

export type Product = {
  id: string;
  name: string;
  arabicName: string;
  category: "Hospitality" | "Celebration" | "Wellness" | "Merchandise";
  priceSar: number;
  description: string;
  badge?: string;
  icon: string;
};

export const PRODUCTS: Product[] = [
  {
    id: "floating-breakfast",
    name: "Floating Lavender Breakfast",
    arabicName: "إفطار عائم بالخزامى",
    category: "Hospitality",
    priceSar: 320,
    badge: "Guest favorite",
    icon: "☕",
    description: "Poolside breakfast tray with Saudi dates, pastries, fresh fruit, and lavender rose drinks.",
  },
  {
    id: "rose-decor",
    name: "Lavender Rose Event Decor",
    arabicName: "تنسيق ورد وخزامى",
    category: "Celebration",
    priceSar: 1450,
    badge: "Premium",
    icon: "🌹",
    description: "Tablescape styling, floral arch, candles, and brand-color linen for private events.",
  },
  {
    id: "private-chef",
    name: "Private Chef Majlis Dinner",
    arabicName: "عشاء شيف خاص",
    category: "Hospitality",
    priceSar: 1800,
    icon: "🍽️",
    description: "A curated three-course dinner with Arabic coffee service and dedicated hospitality staff.",
  },
  {
    id: "spa-kit",
    name: "Lavender Wellness Ritual Kit",
    arabicName: "مجموعة عناية الخزامى",
    category: "Wellness",
    priceSar: 260,
    icon: "🕯️",
    description: "Aromatherapy candle, bath salts, linen mist, and herbal tea packed as a keepsake gift.",
  },
  {
    id: "photo-session",
    name: "Golden Hour Photo Session",
    arabicName: "جلسة تصوير وقت الغروب",
    category: "Celebration",
    priceSar: 750,
    badge: "Limited slots",
    icon: "📸",
    description: "A 45-minute editorial-style shoot around the villa, pool, and lavender rose garden.",
  },
  {
    id: "signature-robe",
    name: "Al-Khuzama Signature Robe",
    arabicName: "روب الخزامى الفاخر",
    category: "Merchandise",
    priceSar: 390,
    icon: "🪻",
    description: "Soft resort robe with embroidered Al-Khuzama monogram in lavender rose thread.",
  },
];

export const BOOKING_MODES: { id: BookingMode; short: string; helper: string }[] = [
  {
    id: "full-day",
    short: "Full Day",
    helper: "Private access, event-ready, best for families and celebrations.",
  },
  {
    id: "day-slot",
    short: "Day Slot",
    helper: "Bright garden, pool and lunch-focused experience.",
  },
  {
    id: "evening-slot",
    short: "Evening Slot",
    helper: "Rose-lit lounge, dinner, and night-swim ambience.",
  },
];

export const PAYMENT_METHODS = ["Mada", "Apple Pay", "STC Pay", "Visa", "Mastercard", "Tap", "Moyasar"];

export const SITE_MAP = [
  {
    title: "Discover",
    items: ["Hero story", "3D showcase", "Matterport / Spline embed", "Hotspots", "Gallery moments"],
  },
  {
    title: "Reserve",
    items: ["Live availability", "Dynamic pricing", "Guest count", "Deposit checkout", "Booking confirmation"],
  },
  {
    title: "Store",
    items: ["Add-on services", "Gift products", "Cart drawer", "Independent checkout", "Order history"],
  },
  {
    title: "Operations",
    items: ["Admin calendar", "Inventory", "Coupons", "Payment webhooks", "Guest CRM"],
  },
];

export const ROADMAP = [
  {
    phase: "01 · Brand & UX Sprint",
    duration: "Week 1",
    output: "Lavender Rose design system, bilingual content model, conversion-focused mobile wireframes.",
  },
  {
    phase: "02 · Interactive Showcase",
    duration: "Weeks 2–3",
    output: "Matterport iframe support plus optimized Three.js/Spline fallback with hotspots and lazy loading.",
  },
  {
    phase: "03 · Booking Engine MVP",
    duration: "Weeks 4–5",
    output: "Availability calendar, seasonal pricing, booking holds, deposit payment link, guest notifications.",
  },
  {
    phase: "04 · Store & Payments",
    duration: "Weeks 6–7",
    output: "Add-on catalog, cart, coupons, multi-currency display, Tap/Moyasar/HyperPay integration.",
  },
  {
    phase: "05 · Admin & Launch",
    duration: "Week 8",
    output: "Admin dashboard, analytics, SEO, performance hardening, UAT, and production deployment.",
  },
];

export const ARCHITECTURE_SNIPPET = `app/
  page.tsx                 # Public Lavender Rose website
  api/quote/route.ts       # Server price quote endpoint
  api/checkout/route.ts    # Payment session endpoint
components/
  ResortExperience.tsx     # 3D tour, booking, store, roadmap UI
lib/
  pricing.ts               # Weekend/slot pricing + currency formatting
  data.ts                  # Products, hotspots, roadmap content
db/schema.sql              # Production relational schema`;

export const SCHEMA_PREVIEW = `bookings
- id, guest_id, booking_date, slot_type, guest_count
- status, subtotal, vat, deposit_amount, balance_amount
- payment_provider, payment_status

products
- id, sku, name_en, name_ar, price_sar, inventory_count

orders
- id, guest_id, booking_id, currency, total_amount, status

order_items
- order_id, product_id, quantity, unit_price`;
