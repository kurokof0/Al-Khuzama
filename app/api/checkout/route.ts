import { NextResponse } from "next/server";
import { CURRENCY_META, convertSar, type CurrencyCode } from "@/lib/pricing";

const SUPPORTED_PAYMENT_METHODS = ["mada", "applepay", "stcpay", "visa", "mastercard"];

type CheckoutPayload = {
  currency?: CurrencyCode;
  dueTodaySar?: number;
  booking?: {
    dateIso?: string;
    mode?: string;
    guests?: number;
  };
  cart?: { productId: string; name: string; quantity: number; unitPriceSar: number }[];
};

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as CheckoutPayload | null;

  if (!payload?.booking?.dateIso || !payload.dueTodaySar) {
    return NextResponse.json({ error: "A booking date and amount due are required." }, { status: 400 });
  }

  const currency: CurrencyCode = payload.currency && payload.currency in CURRENCY_META ? payload.currency : "SAR";
  const convertedAmount = convertSar(payload.dueTodaySar, currency);

  // Production implementation notes:
  // 1. Create booking hold in the database with 10–15 minute expiry.
  // 2. Create provider session through Moyasar, Tap, HyperPay, or Stripe.
  // 3. Send payment methods: Mada, Apple Pay, STC Pay, Visa, Mastercard.
  // 4. Confirm final booking only from signed webhook callbacks.
  const paymentSessionId = `alk_${Date.now().toString(36)}`;

  return NextResponse.json({
    id: paymentSessionId,
    provider: "Moyasar/Tap adapter",
    paymentUrl: `https://payments.example/al-khuzama/${paymentSessionId}`,
    amount: Number(convertedAmount.toFixed(currency === "KWD" ? 3 : 2)),
    currency,
    supportedPaymentMethods: SUPPORTED_PAYMENT_METHODS,
    message:
      "Secure GCC payment session prepared. In production this redirects to Moyasar, Tap, HyperPay, or Stripe with Mada, Apple Pay, STC Pay, Visa, and Mastercard enabled.",
  });
}
