'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  ARCHITECTURE_SNIPPET,
  BOOKING_MODES,
  HOTSPOTS,
  PAYMENT_METHODS,
  PRODUCTS,
  ROADMAP,
  SCHEMA_PREVIEW,
  SITE_MAP,
  type Product,
} from "@/lib/data";
import {
  CURRENCY_META,
  MODE_LABELS,
  type BookingMode,
  type CurrencyCode,
  calculateBookingQuote,
  formatMoney,
  parseIsoDate,
  toIsoDate,
} from "@/lib/pricing";

const DEMO_TODAY = new Date("2026-09-19T12:00:00");
const MATTERPORT_URL = process.env.NEXT_PUBLIC_MATTERPORT_URL ?? "";

type Availability = "available" | "limited" | "booked";
type CartState = Record<string, number>;

function addDays(date: Date, days: number) {
  const clone = new Date(date);
  clone.setDate(clone.getDate() + days);
  return clone;
}

function addMonths(date: Date, months: number) {
  const clone = new Date(date);
  clone.setMonth(clone.getMonth() + months);
  return clone;
}

function getAvailability(dateIso: string): Availability {
  const date = parseIsoDate(dateIso);
  if (date < DEMO_TODAY) return "booked";

  const day = date.getDate();
  const weekday = date.getDay();
  const fixedSoldOut = ["2026-09-25", "2026-10-02", "2026-10-17", "2026-11-06"];

  if (fixedSoldOut.includes(dateIso) || day % 23 === 0) return "booked";
  if (weekday === 5 || weekday === 6 || day % 7 === 0) return "limited";
  return "available";
}

function formatDisplayDate(dateIso: string) {
  return new Intl.DateTimeFormat("en-SA", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parseIsoDate(dateIso));
}

function buildCalendar(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  return Array.from({ length: totalCells }, (_, index) => {
    const dayNumber = index - startOffset + 1;
    if (dayNumber < 1 || dayNumber > daysInMonth) return null;
    return new Date(year, month, dayNumber);
  });
}

function productById(id: string): Product | undefined {
  return PRODUCTS.find((product) => product.id === id);
}

export default function ResortExperience() {
  const [currency, setCurrency] = useState<CurrencyCode>("SAR");
  const [selectedDate, setSelectedDate] = useState(toIsoDate(addDays(DEMO_TODAY, 3)));
  const [calendarMonth, setCalendarMonth] = useState(new Date(DEMO_TODAY.getFullYear(), DEMO_TODAY.getMonth(), 1));
  const [mode, setMode] = useState<BookingMode>("full-day");
  const [guests, setGuests] = useState(14);
  const [activeSpotId, setActiveSpotId] = useState(HOTSPOTS[0].id);
  const [tourMode, setTourMode] = useState<"3d" | "matterport">("3d");
  const [cart, setCart] = useState<CartState>({
    "floating-breakfast": 1,
    "spa-kit": 1,
  });
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const quote = useMemo(
    () => calculateBookingQuote({ dateIso: selectedDate, mode, guests }),
    [selectedDate, mode, guests],
  );

  const cartLines = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, quantity]) => ({ product: productById(id), quantity }))
        .filter((line): line is { product: Product; quantity: number } => Boolean(line.product) && line.quantity > 0),
    [cart],
  );

  const cartSubtotalSar = cartLines.reduce((sum, line) => sum + line.product.priceSar * line.quantity, 0);
  const storeVatSar = Math.round(cartSubtotalSar * 0.15);
  const dueTodaySar = quote.depositSar + cartSubtotalSar + storeVatSar;
  const activeSpot = HOTSPOTS.find((spot) => spot.id === activeSpotId) ?? HOTSPOTS[0];

  const calendarDays = useMemo(() => buildCalendar(calendarMonth), [calendarMonth]);

  function addToCart(productId: string) {
    setCart((current) => ({ ...current, [productId]: (current[productId] ?? 0) + 1 }));
  }

  function updateQuantity(productId: string, delta: number) {
    setCart((current) => {
      const nextQuantity = Math.max(0, (current[productId] ?? 0) + delta);
      const next = { ...current };
      if (nextQuantity === 0) delete next[productId];
      else next[productId] = nextQuantity;
      return next;
    });
  }

  async function startCheckout() {
    setIsCheckingOut(true);
    setCheckoutMessage("");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currency,
          booking: { dateIso: selectedDate, mode, guests, quote },
          cart: cartLines.map((line) => ({
            productId: line.product.id,
            name: line.product.name,
            quantity: line.quantity,
            unitPriceSar: line.product.priceSar,
          })),
          dueTodaySar,
        }),
      });

      const payload = (await response.json()) as { message?: string; paymentUrl?: string };
      setCheckoutMessage(
        payload.message ??
          `Secure payment link prepared. Continue via ${payload.paymentUrl ?? "the selected GCC payment gateway"}.`,
      );
    } catch {
      setCheckoutMessage("Payment session could not be created. Please retry or contact concierge support.");
    } finally {
      setIsCheckingOut(false);
    }
  }

  return (
    <div className="site-shell">
      <header className="topbar" aria-label="Main navigation">
        <a href="#home" className="brand-mark" aria-label="Al-Khuzama home">
          <span className="brand-flower">✦</span>
          <span>
            <strong>Al-Khuzama</strong>
            <em>الخزامى · Lavender Rose</em>
          </span>
        </a>

        <nav className="nav-links" aria-label="Section navigation">
          <a href="#tour">3D Tour</a>
          <a href="#booking">Booking</a>
          <a href="#store">Store</a>
          <a href="#architecture">Roadmap</a>
        </nav>

        <div className="topbar-actions">
          <label className="currency-picker">
            <span>Currency</span>
            <select value={currency} onChange={(event) => setCurrency(event.target.value as CurrencyCode)}>
              {Object.keys(CURRENCY_META).map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </label>
          <a className="nav-cta" href="#booking">
            Reserve
          </a>
        </div>
      </header>

      <main>
        <section id="home" className="hero-section section-pad">
          <div className="hero-orb hero-orb-one" />
          <div className="hero-orb hero-orb-two" />

          <div className="hero-copy">
            <div className="eyebrow">Premium rest-house · Riyadh-ready GCC booking</div>
            <h1>
              A Lavender Rose escape designed for private moments, elegant stays, and effortless booking.
            </h1>
            <p className="hero-lede">
              Al-Khuzama (الخزامى) blends soothing lavender accents, rose warmth, immersive 3D discovery, instant
              reservation deposits, and curated hospitality add-ons in one mobile-first luxury website.
            </p>
            <div className="hero-actions">
              <a className="primary-button" href="#tour">
                Explore the 3D villa
              </a>
              <a className="ghost-button" href="#store">
                Shop add-ons
              </a>
            </div>
            <dl className="stat-strip" aria-label="Resort highlights">
              <div>
                <dt>900m²</dt>
                <dd>Lavender rose garden</dd>
              </div>
              <div>
                <dt>30%</dt>
                <dd>Instant deposit hold</dd>
              </div>
              <div>
                <dt>7</dt>
                <dd>GCC payment rails</dd>
              </div>
            </dl>
          </div>

          <aside className="hero-reservation-card" aria-label="Booking preview">
            <div className="card-glow" />
            <p className="mini-label">Next available private stay</p>
            <h2>{formatDisplayDate(selectedDate)}</h2>
            <div className="availability-pill">
              <span /> Live availability · {getAvailability(selectedDate)}
            </div>
            <div className="price-stack">
              <span>Deposit today</span>
              <strong>{formatMoney(quote.depositSar, currency)}</strong>
              <small>Total stay value: {formatMoney(quote.totalSar, currency)}</small>
            </div>
            <div className="payment-row" aria-label="Supported payments">
              {PAYMENT_METHODS.slice(0, 5).map((method) => (
                <span key={method}>{method}</span>
              ))}
            </div>
          </aside>
        </section>

        <section id="tour" className="section-pad tour-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Immersive discovery</span>
              <h2>High-performance 3D showcase with luxury hotspots.</h2>
            </div>
            <p>
              Use an optimized Three.js fallback today, then drop in a Matterport or Spline URL when the final scan is
              ready. Hotspots guide guests through the pool, suites, garden, and majlis.
            </p>
          </div>

          <div className="tour-grid">
            <div className="viewer-card">
              <div className="viewer-tabs" role="tablist" aria-label="Tour mode">
                <button
                  className={tourMode === "3d" ? "is-active" : ""}
                  onClick={() => setTourMode("3d")}
                  type="button"
                  role="tab"
                  aria-selected={tourMode === "3d"}
                >
                  Three.js villa
                </button>
                <button
                  className={tourMode === "matterport" ? "is-active" : ""}
                  onClick={() => setTourMode("matterport")}
                  type="button"
                  role="tab"
                  aria-selected={tourMode === "matterport"}
                >
                  Matterport-ready
                </button>
              </div>

              {tourMode === "3d" ? (
                <TourScene activeSpotId={activeSpotId} onSpotChange={setActiveSpotId} />
              ) : (
                <div className="matterport-frame">
                  {MATTERPORT_URL ? (
                    <iframe src={MATTERPORT_URL} title="Al-Khuzama Matterport virtual tour" allowFullScreen />
                  ) : (
                    <div className="matterport-placeholder">
                      <span>Embed slot</span>
                      <h3>Matterport / Spline URL ready</h3>
                      <p>
                        Add <code>NEXT_PUBLIC_MATTERPORT_URL</code> to load the final scan. The layout preserves a
                        cinematic 16:10 viewport and lazy-load strategy.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <aside className="hotspot-panel">
              <span className="panel-kicker">Selected detail</span>
              <h3>{activeSpot.title}</h3>
              <p className="arabic-line" dir="rtl">
                {activeSpot.arabic}
              </p>
              <p>{activeSpot.description}</p>
              <strong>{activeSpot.metric}</strong>
              <div className="hotspot-list">
                {HOTSPOTS.map((spot) => (
                  <button
                    key={spot.id}
                    className={spot.id === activeSpotId ? "is-active" : ""}
                    onClick={() => setActiveSpotId(spot.id)}
                    type="button"
                  >
                    {spot.title}
                  </button>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section id="booking" className="section-pad booking-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Direct reservation engine</span>
              <h2>Calendar availability, dynamic pricing, and deposit checkout.</h2>
            </div>
            <p>
              Weekend, weekday, slot, guest surcharge, seasonal adjustments, VAT, and deposit calculations are all
              modeled in reusable pricing logic.
            </p>
          </div>

          <div className="booking-layout">
            <div className="calendar-card luxury-card">
              <div className="calendar-header">
                <button type="button" onClick={() => setCalendarMonth((date) => addMonths(date, -1))}>
                  ←
                </button>
                <h3>
                  {new Intl.DateTimeFormat("en-SA", { month: "long", year: "numeric" }).format(calendarMonth)}
                </h3>
                <button type="button" onClick={() => setCalendarMonth((date) => addMonths(date, 1))}>
                  →
                </button>
              </div>

              <div className="weekdays" aria-hidden="true">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>

              <div className="calendar-grid" role="grid" aria-label="Availability calendar">
                {calendarDays.map((date, index) => {
                  if (!date) return <span key={`blank-${index}`} className="calendar-blank" />;

                  const iso = toIsoDate(date);
                  const availability = getAvailability(iso);
                  const disabled = availability === "booked";
                  const isSelected = iso === selectedDate;

                  return (
                    <button
                      key={iso}
                      className={`calendar-day ${availability} ${isSelected ? "is-selected" : ""}`}
                      disabled={disabled}
                      type="button"
                      onClick={() => setSelectedDate(iso)}
                      aria-label={`${formatDisplayDate(iso)}, ${availability}`}
                    >
                      <strong>{date.getDate()}</strong>
                      <span>{availability === "limited" ? "Few" : availability === "booked" ? "Sold" : "Open"}</span>
                    </button>
                  );
                })}
              </div>

              <div className="calendar-legend">
                <span><i className="legend-dot open" /> Open</span>
                <span><i className="legend-dot limited" /> Limited / weekend</span>
                <span><i className="legend-dot sold" /> Sold</span>
              </div>
            </div>

            <div className="booking-controls luxury-card">
              <div>
                <span className="panel-kicker">Selected stay</span>
                <h3>{formatDisplayDate(selectedDate)}</h3>
                <p>{quote.isWeekend ? "Weekend premium applies" : "Weekday serenity rate"}</p>
              </div>

              <div className="mode-grid">
                {BOOKING_MODES.map((bookingMode) => (
                  <button
                    type="button"
                    key={bookingMode.id}
                    className={mode === bookingMode.id ? "is-active" : ""}
                    onClick={() => setMode(bookingMode.id)}
                  >
                    <strong>{bookingMode.short}</strong>
                    <span>{bookingMode.helper}</span>
                  </button>
                ))}
              </div>

              <label className="guest-slider">
                <span>
                  Guests <strong>{guests}</strong>
                </span>
                <input
                  type="range"
                  min="2"
                  max="40"
                  value={guests}
                  onChange={(event) => setGuests(Number(event.target.value))}
                />
              </label>

              <div className="quote-card">
                <div>
                  <span>{MODE_LABELS[mode]}</span>
                  <strong>{formatMoney(quote.baseRateSar, currency)}</strong>
                </div>
                <div>
                  <span>Guest / seasonal adjustments</span>
                  <strong>{formatMoney(quote.guestSurchargeSar + quote.seasonalAdjustmentSar, currency)}</strong>
                </div>
                <div>
                  <span>Service fee + VAT</span>
                  <strong>{formatMoney(quote.serviceFeeSar + quote.vatSar, currency)}</strong>
                </div>
                <div className="quote-total">
                  <span>Total booking</span>
                  <strong>{formatMoney(quote.totalSar, currency)}</strong>
                </div>
                <div className="quote-deposit">
                  <span>Deposit due now</span>
                  <strong>{formatMoney(quote.depositSar, currency)}</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="store" className="section-pad store-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Add-ons & boutique store</span>
              <h2>Curated hospitality services and Lavender Rose products.</h2>
            </div>
            <p>
              Guests can enrich a reservation or purchase gifts independently through a lightweight cart and quick
              checkout flow.
            </p>
          </div>

          <div className="store-layout">
            <div className="product-grid">
              {PRODUCTS.map((product) => (
                <article key={product.id} className="product-card luxury-card">
                  <div className="product-icon" aria-hidden="true">{product.icon}</div>
                  <div className="product-copy">
                    <span className="product-category">{product.category}</span>
                    {product.badge ? <em>{product.badge}</em> : null}
                    <h3>{product.name}</h3>
                    <p className="arabic-line" dir="rtl">{product.arabicName}</p>
                    <p>{product.description}</p>
                  </div>
                  <div className="product-footer">
                    <strong>{formatMoney(product.priceSar, currency)}</strong>
                    <button type="button" onClick={() => addToCart(product.id)}>
                      Add
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <aside className="cart-card luxury-card" aria-label="Shopping cart and checkout">
              <span className="panel-kicker">Quick checkout</span>
              <h3>Reservation + add-ons</h3>
              <div className="cart-lines">
                <div className="cart-line reserved">
                  <div>
                    <strong>Booking deposit</strong>
                    <span>{formatDisplayDate(selectedDate)}</span>
                  </div>
                  <b>{formatMoney(quote.depositSar, currency)}</b>
                </div>

                {cartLines.length === 0 ? (
                  <p className="empty-cart">No add-ons yet. Choose a service to personalize the stay.</p>
                ) : (
                  cartLines.map((line) => (
                    <div className="cart-line" key={line.product.id}>
                      <div>
                        <strong>{line.product.name}</strong>
                        <span>{formatMoney(line.product.priceSar, currency)} each</span>
                      </div>
                      <div className="quantity-stepper" aria-label={`Quantity for ${line.product.name}`}>
                        <button type="button" onClick={() => updateQuantity(line.product.id, -1)}>
                          −
                        </button>
                        <span>{line.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(line.product.id, 1)}>
                          +
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="cart-summary">
                <div>
                  <span>Add-ons VAT</span>
                  <strong>{formatMoney(storeVatSar, currency)}</strong>
                </div>
                <div>
                  <span>Due today</span>
                  <strong>{formatMoney(dueTodaySar, currency)}</strong>
                </div>
              </div>

              <button className="checkout-button" type="button" onClick={startCheckout} disabled={isCheckingOut}>
                {isCheckingOut ? "Creating secure link..." : "Pay deposit with GCC gateway"}
              </button>

              {checkoutMessage ? <p className="checkout-message">{checkoutMessage}</p> : null}

              <div className="payment-methods">
                {PAYMENT_METHODS.map((method) => (
                  <span key={method}>{method}</span>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section id="architecture" className="section-pad architecture-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Implementation blueprint</span>
              <h2>Roadmap, site architecture, schema, and production integration plan.</h2>
            </div>
            <p>
              This website prototype is paired with a documented custom-stack architecture that can evolve into a
              production booking, commerce, and operations platform.
            </p>
          </div>

          <div className="architecture-grid">
            <article className="luxury-card">
              <span className="panel-kicker">Site architecture map</span>
              <div className="site-map-grid">
                {SITE_MAP.map((group) => (
                  <div key={group.title}>
                    <h3>{group.title}</h3>
                    <ul>
                      {group.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </article>

            <article className="luxury-card roadmap-card">
              <span className="panel-kicker">Step-by-step roadmap</span>
              {ROADMAP.map((item) => (
                <div className="roadmap-item" key={item.phase}>
                  <time>{item.duration}</time>
                  <div>
                    <h3>{item.phase}</h3>
                    <p>{item.output}</p>
                  </div>
                </div>
              ))}
            </article>

            <article className="luxury-card code-card">
              <span className="panel-kicker">Custom stack</span>
              <h3>Next.js + React + Three.js + Payment APIs</h3>
              <pre>{ARCHITECTURE_SNIPPET}</pre>
            </article>

            <article className="luxury-card code-card">
              <span className="panel-kicker">Database model</span>
              <h3>Bookings, products, orders, payments</h3>
              <pre>{SCHEMA_PREVIEW}</pre>
            </article>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div>
          <strong>Al-Khuzama · الخزامى</strong>
          <p>Lavender Rose luxury resort website prototype with 3D exploration, direct booking, and GCC payments.</p>
        </div>
        <a href="#home">Back to top ↑</a>
      </footer>
    </div>
  );
}

function TourScene({
  activeSpotId,
  onSpotChange,
}: {
  activeSpotId: string;
  onSpotChange: (spotId: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog("#f4eef2", 7, 16);

    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0.2, 2.2, 6.2);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const resortGroup = new THREE.Group();
    scene.add(resortGroup);

    const ambientLight = new THREE.AmbientLight("#fff3e1", 1.8);
    const keyLight = new THREE.DirectionalLight("#fff8ed", 2.8);
    keyLight.position.set(3.5, 6, 4.5);
    const roseLight = new THREE.PointLight("#d7a1bd", 8, 10);
    roseLight.position.set(-3, 2.2, 2.5);
    scene.add(ambientLight, keyLight, roseLight);

    const sandMaterial = new THREE.MeshStandardMaterial({ color: "#dcc9b7", roughness: 0.92 });
    const gardenMaterial = new THREE.MeshStandardMaterial({ color: "#8e7a67", roughness: 0.85 });
    const lavenderMaterial = new THREE.MeshStandardMaterial({ color: "#8d6aa0", roughness: 0.74 });
    const roseMaterial = new THREE.MeshStandardMaterial({ color: "#c07c9e", roughness: 0.58 });
    const stoneMaterial = new THREE.MeshStandardMaterial({ color: "#efe2d3", roughness: 0.78 });
    const roofMaterial = new THREE.MeshStandardMaterial({ color: "#7f5a83", roughness: 0.7 });
    const waterMaterial = new THREE.MeshPhysicalMaterial({
      color: "#9bd8df",
      roughness: 0.08,
      metalness: 0.02,
      transmission: 0.18,
      transparent: true,
      opacity: 0.72,
    });

    const ground = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 4.15, 0.18, 72), sandMaterial);
    ground.position.y = -0.16;
    resortGroup.add(ground);

    const garden = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.05, 1.55), gardenMaterial);
    garden.position.set(1.55, -0.02, 0.7);
    garden.rotation.y = -0.18;
    resortGroup.add(garden);

    const pool = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.09, 1.15), waterMaterial);
    pool.position.set(-1.35, 0.02, 0.55);
    pool.rotation.y = 0.16;
    resortGroup.add(pool);

    const villaBody = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.95, 1.15), stoneMaterial);
    villaBody.position.set(0.45, 0.42, -0.55);
    resortGroup.add(villaBody);

    const villaWing = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.72, 0.95), stoneMaterial);
    villaWing.position.set(1.55, 0.31, -0.05);
    villaWing.rotation.y = -0.18;
    resortGroup.add(villaWing);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.55, 0.55, 4), roofMaterial);
    roof.position.set(0.45, 1.18, -0.55);
    roof.rotation.y = Math.PI / 4;
    resortGroup.add(roof);

    const majlisCanopy = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.14, 0.85), roofMaterial);
    majlisCanopy.position.set(1.55, 0.78, -0.05);
    majlisCanopy.rotation.y = -0.18;
    resortGroup.add(majlisCanopy);

    const path = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 2.8), new THREE.MeshStandardMaterial({ color: "#ead7c4", roughness: 0.9 }));
    path.position.set(-0.2, 0.02, 0.82);
    path.rotation.y = -0.78;
    resortGroup.add(path);

    const lavenderGeo = new THREE.ConeGeometry(0.055, 0.34, 8);
    const lavenderField = new THREE.InstancedMesh(lavenderGeo, lavenderMaterial, 62);
    const roseField = new THREE.InstancedMesh(new THREE.SphereGeometry(0.055, 10, 10), roseMaterial, 34);
    const matrix = new THREE.Matrix4();

    for (let i = 0; i < 62; i += 1) {
      const row = Math.floor(i / 11);
      const col = i % 11;
      const x = 0.72 + col * 0.18 + (row % 2) * 0.04;
      const z = 0.15 + row * 0.18;
      matrix.makeTranslation(x, 0.17, z);
      lavenderField.setMatrixAt(i, matrix);
    }

    for (let i = 0; i < 34; i += 1) {
      const angle = (i / 34) * Math.PI * 2;
      const radius = 2.95 + Math.sin(i) * 0.17;
      matrix.makeTranslation(Math.cos(angle) * radius, 0.16, Math.sin(angle) * radius);
      roseField.setMatrixAt(i, matrix);
    }

    resortGroup.add(lavenderField, roseField);

    let pointerX = 0;
    let pointerY = 0;
    const onPointerMove = (event: PointerEvent) => {
      const rect = parent.getBoundingClientRect();
      pointerX = (event.clientX - rect.left) / rect.width - 0.5;
      pointerY = (event.clientY - rect.top) / rect.height - 0.5;
    };
    parent.addEventListener("pointermove", onPointerMove);

    const resize = () => {
      const width = parent.clientWidth || 800;
      const height = parent.clientHeight || 460;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(parent);

    let animationId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      const elapsed = clock.getElapsedTime();
      resortGroup.rotation.y = Math.sin(elapsed * 0.28) * 0.16 + pointerX * 0.42;
      resortGroup.rotation.x = -0.1 + pointerY * 0.08;
      lavenderField.rotation.y = Math.sin(elapsed * 0.5) * 0.015;
      camera.position.x = pointerX * 0.55;
      camera.lookAt(0.15, 0.34, 0);
      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
      parent.removeEventListener("pointermove", onPointerMove);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.InstancedMesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
    };
  }, []);

  return (
    <div className="tour-canvas-wrap">
      <canvas ref={canvasRef} aria-label="Interactive 3D model of Al-Khuzama resort" />
      <div className="hotspot-layer" aria-label="3D resort hotspots">
        {HOTSPOTS.map((spot) => (
          <button
            key={spot.id}
            type="button"
            className={`hotspot-dot ${spot.id === activeSpotId ? "is-active" : ""}`}
            style={{ left: `${spot.position.x}%`, top: `${spot.position.y}%` }}
            onClick={() => onSpotChange(spot.id)}
            aria-label={`View ${spot.title}`}
          >
            <span />
          </button>
        ))}
      </div>
      <div className="viewer-note">
        <strong>Optimized WebGL</strong>
        <span>Drag or move to orbit · tap hotspots</span>
      </div>
    </div>
  );
}
