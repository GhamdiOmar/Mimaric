import { NextResponse } from "next/server";
import { autoExpireReservations } from "../../../actions/reservations";

/**
 * RED: Cron endpoint to auto-expire PENDING reservations past their expiresAt.
 * Intended to be called hourly via Vercel Cron or similar scheduler.
 *
 * GET /api/cron/expire-reservations?secret=CRON_SECRET
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  // Basic auth — compare with env variable
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await autoExpireReservations();
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("[Cron] expire-reservations failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
