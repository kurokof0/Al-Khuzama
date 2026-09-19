# Al-Khuzama (الخزامى) — Lavender Rose Website Architecture

Premium web architecture for a luxury resort/rest-house with immersive 3D exploration, direct booking, e-commerce add-ons, and GCC/Saudi payment integrations.

## 1. Brand & UX Direction

**Brand name:** Al-Khuzama (الخزامى)  
**Visual focus:** Lavender Rose — lavender accents, warm rose highlights, cream/sand neutrals, soft glass panels, elegant rounded cards, bilingual Arabic/English content.

### Experience principles

- **Mobile-first conversion:** primary CTAs for `Explore 3D`, `Reserve`, and `Shop add-ons` remain reachable on small screens.
- **High-end calm:** generous spacing, muted premium palette, fragrance/garden storytelling, warm hospitality language.
- **Interactive but performant:** WebGL is optional/lazy, Matterport/Spline iframe can be swapped in, and mobile rendering caps pixel ratio.
- **Trust-first checkout:** transparent quote breakdown, deposit due today, accepted methods displayed before payment.
- **Bilingual ready:** Arabic labels and RTL content are already represented in the UI components and schema.

---

## 2. Recommended Solution A — Custom Stack

### Frontend

- **Next.js App Router + React** for SEO, SSR, API routes, routing, and deployment flexibility.
- **CSS/Tailwind design tokens** for Lavender Rose brand UI. This prototype uses CSS variables; production can map the same tokens into Tailwind.
- **Three.js / Spline / Matterport** for interactive virtual tour.
- **Progressive enhancement:** show optimized Three.js fallback first, load Matterport/Spline on demand.

### Backend

- **Next.js Route Handlers** for quote and checkout session creation.
- **PostgreSQL + Prisma/Drizzle** for bookings, products, orders, payments, availability, guests, and tour hotspots.
- **Redis** for temporary booking holds and rate limiting.
- **Object storage/CDN** for 3D assets, images, and video.

### Payments

Integrate through one primary GCC provider plus fallback:

- **Moyasar:** Mada, Apple Pay, Visa/Mastercard, STC Pay support depending on merchant setup.
- **Tap Payments:** strong GCC coverage with KNET/Benefit options if expansion is required.
- **HyperPay:** enterprise-friendly option.
- **Stripe:** useful for international cards where locally available.

> Production rule: never confirm a booking from the client response. Confirm only after a signed payment webhook is verified server-side.

---

## 3. Recommended Solution B — CMS/No-Code Alternative

### WordPress route

- **WordPress + WooCommerce**
- **WooCommerce Bookings** for calendar inventory and slot pricing
- **Moyasar/Tap/HyperPay plugin** for local payments
- **Matterport iframe** embedded in landing/product pages
- **WPML/Polylang** for Arabic/English
- **Pros:** fastest admin setup, lower initial cost
- **Cons:** less bespoke UX, plugin compatibility/performance maintenance

### Webflow route

- **Webflow CMS** for brand pages and store presentation
- **Lodgify/Hostaway/Checkfront/Booknetic embed** for bookings
- **Matterport/Spline embed** for 3D tour
- **External payment checkout** through booking provider
- **Pros:** best no-code design workflow
- **Cons:** limited custom pricing/payment control unless using custom code or external engine

---

## 4. Site Architecture Map

```text
Home
├─ Hero / Lavender Rose story
├─ 3D Virtual Tour
│  ├─ Three.js/Spline fallback
│  ├─ Matterport iframe slot
│  └─ Interactive hotspots: pool, suite, garden, majlis
├─ Booking Engine
│  ├─ Availability calendar
│  ├─ Full-day / day-slot / evening-slot modes
│  ├─ Dynamic pricing quote
│  ├─ Guest count & services
│  └─ Deposit payment checkout
├─ Store
│  ├─ Hospitality add-ons
│  ├─ Event decor
│  ├─ Wellness products
│  ├─ Merchandise
│  └─ Cart / quick checkout
├─ About / Amenities / Gallery / FAQ
├─ Contact / WhatsApp / Location
└─ Admin
   ├─ Calendar management
   ├─ Booking holds and confirmations
   ├─ Product inventory
   ├─ Payment webhooks
   └─ Reports / CRM
```

---

## 5. Data Architecture

The production schema is in [`db/schema.sql`](../db/schema.sql). Core entities:

### Bookings

- `guests`: customer profile, contact, locale preference
- `booking_rate_rules`: weekday/weekend/seasonal/slot pricing
- `availability_blocks`: maintenance, private events, manual blackout dates
- `bookings`: date, slot, status, guest count, pricing breakdown, deposit/balance

### Commerce

- `products`: add-ons, physical products, gifts, services
- `orders`: guest cart/order optionally linked to booking
- `order_items`: purchased add-ons/products

### Payments

- `payments`: provider, method, amount, status, signed webhook payload

### 3D Content

- `tour_hotspots`: hotspot copy, positions, provider asset URL, display order

---

## 6. Dynamic Pricing Logic

Current prototype logic lives in [`lib/pricing.ts`](../lib/pricing.ts):

```ts
const BASE_PRICES_SAR = {
  "full-day": { weekday: 2800, weekend: 4200 },
  "day-slot": { weekday: 1650, weekend: 2400 },
  "evening-slot": { weekday: 1900, weekend: 2850 },
};

export function isSaudiWeekend(dateIso: string) {
  const day = new Date(`${dateIso}T12:00:00`).getDay();
  return day === 5 || day === 6; // Friday / Saturday
}

export function calculateBookingQuote({ dateIso, mode, guests }) {
  const isWeekend = isSaudiWeekend(dateIso);
  const baseRateSar = BASE_PRICES_SAR[mode][isWeekend ? "weekend" : "weekday"];
  const guestSurchargeSar = Math.max(0, guests - 12) * 95;
  const subtotalSar = baseRateSar + guestSurchargeSar;
  const serviceFeeSar = Math.round(subtotalSar * 0.025);
  const vatSar = Math.round((subtotalSar + serviceFeeSar) * 0.15);
  const totalSar = subtotalSar + serviceFeeSar + vatSar;
  return { totalSar, depositSar: Math.round(totalSar * 0.3) };
}
```

Production enhancements:

1. Pull rates from `booking_rate_rules`.
2. Apply public holiday and high-season premiums.
3. Add coupon/partner logic.
4. Apply cleaning/security deposits separately if needed.
5. Store every quote snapshot on booking creation to avoid later price drift.

---

## 7. Key API Routes

### Quote endpoint

`POST /api/quote`

```json
{
  "dateIso": "2026-09-22",
  "mode": "full-day",
  "guests": 14
}
```

Returns a booking quote with base rate, VAT, total, deposit, and balance.

### Checkout endpoint

`POST /api/checkout`

```ts
const session = await paymentProvider.createSession({
  amount: dueTodaySar,
  currency: "SAR",
  methods: ["mada", "applepay", "stcpay", "visa", "mastercard"],
  metadata: { bookingId, orderId },
  successUrl: `${siteUrl}/booking/success`,
  cancelUrl: `${siteUrl}/booking/cancelled`,
});
```

Webhook flow:

```text
Payment provider → /api/webhooks/payments
1. Verify signature
2. Load payment by provider_payment_id
3. Mark payment captured/failed
4. Confirm booking or release hold
5. Send email/WhatsApp confirmation
```

---

## 8. 3D Showcase Implementation Plan

### Phase 1 — Current prototype

- Lightweight Three.js scene with resort model impression.
- Overlay hotspots independent of WebGL mesh picking for mobile speed.
- Pixel ratio capped for smooth mobile performance.

### Phase 2 — Production 3D

Option A: **Matterport**

```tsx
<iframe
  title="Al-Khuzama virtual tour"
  src={process.env.NEXT_PUBLIC_MATTERPORT_URL}
  allowFullScreen
/>
```

Option B: **Spline**

```tsx
<iframe
  title="Al-Khuzama Spline tour"
  src="https://my.spline.design/al-khuzama"
/>
```

Option C: **Custom Three.js**

- Use compressed `.glb` models.
- Apply Draco/Meshopt compression.
- Lazy-load model below the fold.
- Use KTX2/Basis textures.
- Prefer baked lighting over real-time shadows.
- Add hotspot data from database.

---

## 9. Step-by-Step Development Roadmap

### Week 1 — Brand, UX, and content

- Define Lavender Rose design tokens.
- Finalize English/Arabic copy.
- Design mobile-first booking funnel.
- Confirm payment provider and merchant requirements.

### Weeks 2–3 — Frontend foundation

- Build Next.js app shell, SEO metadata, accessibility patterns.
- Implement hero, amenities, gallery, FAQ, and contact.
- Implement Three.js/Spline/Matterport showcase.
- Add analytics events for tour hotspot clicks and booking CTA clicks.

### Weeks 4–5 — Booking engine

- Build availability calendar and booking mode selection.
- Create pricing service from database rules.
- Add booking holds with expiry.
- Add admin calendar controls.
- Add email/WhatsApp notification templates.

### Weeks 6–7 — Store and checkout

- Build product catalog, cart, coupons, and order creation.
- Integrate payment provider sandbox.
- Implement signed webhooks.
- Enable Mada, Apple Pay, STC Pay, Visa, Mastercard.
- Add refund/cancellation logic.

### Week 8 — Admin, QA, and launch

- Finish admin dashboard and reports.
- Perform performance optimization and mobile testing.
- Security review: validation, rate limits, webhook verification.
- Deploy to Vercel or AWS.
- Connect domain, CDN, analytics, and backup jobs.

---

## 10. Deployment Architecture

```text
User Browser
  ↓
CDN / Edge Cache
  ↓
Next.js App (Vercel/AWS)
  ├─ Public pages
  ├─ API routes: quote, checkout, webhooks
  ├─ Auth-protected admin
  ↓
PostgreSQL database
  ↓
Payment Provider: Moyasar/Tap/HyperPay/Stripe
  ↓
Webhook confirmation → booking/order status update
```

### Recommended services

- **Hosting:** Vercel Pro or AWS Amplify/ECS
- **Database:** Supabase Postgres, Neon, RDS, or PlanetScale for MySQL alternative
- **Cache/locks:** Upstash Redis
- **Media:** Cloudflare R2, AWS S3 + CloudFront
- **Email:** Resend, SendGrid, AWS SES
- **WhatsApp:** Twilio or official WhatsApp Cloud API provider
- **Analytics:** Plausible, PostHog, GA4

---

## 11. Security & Compliance Checklist

- Validate every booking quote server-side.
- Use booking holds to avoid double-booking.
- Confirm payments via signed webhooks only.
- Store no raw card data; rely on provider-hosted checkout/tokenization.
- Add rate limits to quote/checkout endpoints.
- Audit admin actions.
- Add privacy policy, terms, refund policy, VAT invoice data.
- Use environment variables for provider secrets.

---

## 12. Environment Variables

```bash
NEXT_PUBLIC_SITE_URL=https://al-khuzama.example
NEXT_PUBLIC_MATTERPORT_URL=https://my.matterport.com/show/?m=MODEL_ID
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
MOYASAR_SECRET_KEY=...
MOYASAR_PUBLISHABLE_KEY=...
MOYASAR_WEBHOOK_SECRET=...
TAP_SECRET_KEY=...
HYPERPAY_ENTITY_ID=...
```

---

## 13. Current Prototype Files

```text
app/page.tsx
components/ResortExperience.tsx
lib/pricing.ts
lib/data.ts
app/api/quote/route.ts
app/api/checkout/route.ts
db/schema.sql
docs/ARCHITECTURE.md
```

This provides a working Lavender Rose website foundation with interactive UI, 3D showcase placeholder/fallback, booking quote engine, cart, payment session mock, and production implementation guide.
