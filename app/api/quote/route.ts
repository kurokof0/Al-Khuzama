import { NextResponse } from "next/server";
import { calculateBookingQuote, type BookingMode } from "@/lib/pricing";

const VALID_MODES: BookingMode[] = ["full-day", "day-slot", "evening-slot"];

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { dateIso?: string; mode?: BookingMode; guests?: number }
    | null;

  if (!body?.dateIso || !body.mode || !VALID_MODES.includes(body.mode)) {
    return NextResponse.json({ error: "dateIso and valid booking mode are required" }, { status: 400 });
  }

  const guests = Number.isFinite(body.guests) ? Math.max(1, Number(body.guests)) : 2;
  const quote = calculateBookingQuote({ dateIso: body.dateIso, mode: body.mode, guests });

  return NextResponse.json({ quote });
}
