export type BookingMode = "full-day" | "day-slot" | "evening-slot";
export type CurrencyCode = "SAR" | "AED" | "USD" | "KWD";

export const CURRENCY_META: Record<
  CurrencyCode,
  { label: string; symbol: string; rateFromSar: number; locale: string }
> = {
  SAR: { label: "Saudi Riyal", symbol: "ر.س", rateFromSar: 1, locale: "en-SA" },
  AED: { label: "UAE Dirham", symbol: "د.إ", rateFromSar: 0.98, locale: "en-AE" },
  USD: { label: "US Dollar", symbol: "$", rateFromSar: 0.266, locale: "en-US" },
  KWD: { label: "Kuwaiti Dinar", symbol: "د.ك", rateFromSar: 0.0815, locale: "en-KW" },
};

export const MODE_LABELS: Record<BookingMode, string> = {
  "full-day": "Full-day private resort access",
  "day-slot": "Day slot · 10 AM – 4 PM",
  "evening-slot": "Evening slot · 6 PM – 12 AM",
};

const BASE_PRICES_SAR: Record<BookingMode, { weekday: number; weekend: number }> = {
  "full-day": { weekday: 2800, weekend: 4200 },
  "day-slot": { weekday: 1650, weekend: 2400 },
  "evening-slot": { weekday: 1900, weekend: 2850 },
};

export type BookingQuote = {
  dateIso: string;
  mode: BookingMode;
  isWeekend: boolean;
  baseRateSar: number;
  guestSurchargeSar: number;
  seasonalAdjustmentSar: number;
  subtotalSar: number;
  serviceFeeSar: number;
  vatSar: number;
  totalSar: number;
  depositSar: number;
  balanceSar: number;
};

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseIsoDate(dateIso: string): Date {
  return new Date(`${dateIso}T12:00:00`);
}

export function isSaudiWeekend(dateIso: string): boolean {
  const day = parseIsoDate(dateIso).getDay();
  return day === 5 || day === 6; // Friday / Saturday
}

export function getSeasonalAdjustment(dateIso: string, mode: BookingMode): number {
  const date = parseIsoDate(dateIso);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const isPeakCoolSeason = month >= 11 || month <= 2;
  const lavenderWeekendPremium = isSaudiWeekend(dateIso) && day >= 20 ? 350 : 0;
  const winterPremium = isPeakCoolSeason ? (mode === "full-day" ? 500 : 220) : 0;
  return winterPremium + lavenderWeekendPremium;
}

export function calculateBookingQuote({
  dateIso,
  mode,
  guests,
}: {
  dateIso: string;
  mode: BookingMode;
  guests: number;
}): BookingQuote {
  const isWeekend = isSaudiWeekend(dateIso);
  const baseRateSar = BASE_PRICES_SAR[mode][isWeekend ? "weekend" : "weekday"];
  const guestSurchargeSar = Math.max(0, guests - 12) * 95;
  const seasonalAdjustmentSar = getSeasonalAdjustment(dateIso, mode);
  const subtotalSar = baseRateSar + guestSurchargeSar + seasonalAdjustmentSar;
  const serviceFeeSar = Math.round(subtotalSar * 0.025);
  const vatSar = Math.round((subtotalSar + serviceFeeSar) * 0.15);
  const totalSar = subtotalSar + serviceFeeSar + vatSar;
  const depositSar = Math.round(totalSar * 0.3);
  const balanceSar = totalSar - depositSar;

  return {
    dateIso,
    mode,
    isWeekend,
    baseRateSar,
    guestSurchargeSar,
    seasonalAdjustmentSar,
    subtotalSar,
    serviceFeeSar,
    vatSar,
    totalSar,
    depositSar,
    balanceSar,
  };
}

export function convertSar(amountSar: number, currency: CurrencyCode): number {
  return amountSar * CURRENCY_META[currency].rateFromSar;
}

export function formatMoney(amountSar: number, currency: CurrencyCode): string {
  const converted = convertSar(amountSar, currency);
  return new Intl.NumberFormat(CURRENCY_META[currency].locale, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "KWD" ? 3 : 0,
  }).format(converted);
}
