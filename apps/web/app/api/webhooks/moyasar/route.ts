/**
 * Moyasar Webhook Endpoint
 *
 * POST /api/webhooks/moyasar
 *
 * Receives payment events from Moyasar, verifies signature,
 * and processes idempotently via webhook-handler.
 */

import { NextRequest, NextResponse } from "next/server";
import { processWebhook } from "../../../../lib/payment/webhook-handler";

export async function POST(request: NextRequest) {
  try {
    // Read raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get("x-moyasar-signature") ?? "";

    if (!signature) {
      return NextResponse.json(
        { error: "Missing webhook signature" },
        { status: 401 }
      );
    }

    const result = await processWebhook("moyasar", rawBody, signature);

    if (!result.success && !result.alreadyProcessed) {
      console.error(`[Moyasar Webhook] Failed: ${result.message}`);

      if (result.message === "Invalid webhook signature") {
        // Signature failure → 200 (don't reveal verification details to attacker)
        return NextResponse.json({ received: true });
      }

      // Processing failure → 500 (gateway should retry)
      return NextResponse.json(
        { received: true, error: result.message },
        { status: 500 }
      );
    }

    // Success or already processed → 200
    return NextResponse.json({
      received: true,
      eventId: result.eventId,
      eventType: result.eventType,
    });
  } catch (error) {
    console.error("[Moyasar Webhook] Unhandled error:", error);
    // Unhandled error → 500 (gateway should retry)
    return NextResponse.json(
      { received: true, error: "Internal processing error" },
      { status: 500 }
    );
  }
}

// Disable body parsing — we need raw body for signature verification
export const runtime = "nodejs";
