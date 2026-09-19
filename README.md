# Al-Khuzama · الخزامى

**Al-Khuzama Resort — Lavender Rose luxury rest-house website prototype.**

A premium, mobile-first Next.js application that lets guests explore the resort through an interactive 3D showcase, reserve dates with dynamic pricing and deposit checkout, and personalize their stay with curated add-ons and products.

## Features

- Lavender Rose visual identity with warm neutral luxury styling
- Interactive Three.js resort showcase with clickable hotspots
- Matterport/Spline iframe-ready virtual tour slot
- Responsive direct booking engine with calendar availability
- Weekend/weekday and slot-based dynamic pricing
- Multi-currency display: SAR, AED, USD, KWD
- Add-on/e-commerce store with cart and quick checkout
- GCC payment gateway blueprint for Mada, Apple Pay, STC Pay, Visa/Mastercard via Moyasar/Tap/HyperPay
- Production architecture guide and PostgreSQL schema

## Getting started

```bash
npm install
npm run dev
```

Open the local preview provided by the dev server.

## Useful scripts

```bash
npm run dev      # Start Next.js development server
npm run build    # Build production app
npm run start    # Serve production build
```

## Optional virtual tour embed

Add a Matterport or Spline URL to the environment:

```bash
NEXT_PUBLIC_MATTERPORT_URL="https://my.matterport.com/show/?m=MODEL_ID"
```

## Key files

- `components/ResortExperience.tsx` — complete interactive website UI
- `lib/pricing.ts` — dynamic pricing and currency formatting
- `lib/data.ts` — products, hotspots, roadmap, architecture copy
- `app/api/quote/route.ts` — quote endpoint
- `app/api/checkout/route.ts` — mocked payment session endpoint
- `db/schema.sql` — production database schema
- `docs/ARCHITECTURE.md` — roadmap, architecture map, implementation guide, snippets
