/**
 * Webhook Event Handler
 *
 * Processes inbound payment webhooks with:
 * - Signature verification
 * - Idempotent processing (WebhookEvent table)
 * - Event routing to subscription state machine
 */

import { db } from "@repo/db";
import { getGateway } from "./gateway-router";
import { transitionSubscription } from "./subscription-machine";
import { invalidateEntitlements } from "../entitlements";
import type { GatewayName } from "./types";

// ─── Webhook Processing ─────────────────────────────────────────────────────

export interface WebhookProcessResult {
  success: boolean;
  eventId: string;
  eventType: string;
  message: string;
  alreadyProcessed?: boolean;
}

/**
 * Process an incoming webhook from a payment gateway.
 * Returns 200 immediately — heavy work should be deferred if needed.
 */
export async function processWebhook(
  gateway: GatewayName,
  rawBody: string,
  signature: string
): Promise<WebhookProcessResult> {
  const adapter = getGateway(gateway);

  // 1. Verify signature
  const verification = await adapter.verifyWebhook(rawBody, signature);
  if (!verification.valid) {
    return {
      success: false,
      eventId: verification.eventId || "unknown",
      eventType: verification.eventType || "unknown",
      message: "Invalid webhook signature",
    };
  }

  const { eventId, eventType, payload } = verification;

  // 2. Idempotency check — skip if already processed
  const existingEvent = await db.webhookEvent.findUnique({
    where: { gateway_eventId: { gateway, eventId } },
  });

  if (existingEvent?.processedAt) {
    return {
      success: true,
      eventId,
      eventType,
      message: "Event already processed",
      alreadyProcessed: true,
    };
  }

  // 3. Store webhook event (mark as processing)
  await db.webhookEvent.upsert({
    where: { gateway_eventId: { gateway, eventId } },
    create: {
      gateway,
      eventId,
      eventType,
      payload: payload as any,
    },
    update: {
      eventType,
      payload: payload as any,
    },
  });

  // 4. Route event to handler
  try {
    await routeWebhookEvent(gateway, eventType, payload);

    // Mark as processed
    await db.webhookEvent.update({
      where: { gateway_eventId: { gateway, eventId } },
      data: { processedAt: new Date() },
    });

    return {
      success: true,
      eventId,
      eventType,
      message: `Processed ${eventType} successfully`,
    };
  } catch (error) {
    // Log error but don't throw — we already returned 200
    const errorMessage = error instanceof Error ? error.message : String(error);
    await db.webhookEvent.update({
      where: { gateway_eventId: { gateway, eventId } },
      data: { error: errorMessage },
    });

    return {
      success: false,
      eventId,
      eventType,
      message: `Error processing event: ${errorMessage}`,
    };
  }
}

// ─── Event Routing ──────────────────────────────────────────────────────────

async function routeWebhookEvent(
  gateway: GatewayName,
  eventType: string,
  payload: unknown
): Promise<void> {
  const data = payload as any;

  // Moyasar event structure: { id, type, data: { id, status, amount, metadata, ... } }
  const paymentData = data?.data ?? data;
  const metadata = paymentData?.metadata ?? {};
  const invoiceId = metadata?.invoiceId;

  if (!invoiceId) {
    console.warn(`[Webhook] No invoiceId in metadata for ${eventType}`);
    return;
  }

  // Find the invoice and its subscription
  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    include: { subscription: true },
  });

  if (!invoice) {
    console.warn(`[Webhook] Invoice not found: ${invoiceId}`);
    return;
  }

  switch (eventType) {
    case "payment.paid":
    case "payment.captured":
    case "payment_completed": {
      // Update payment transaction
      await db.paymentTransaction.updateMany({
        where: {
          invoiceId: invoice.id,
          gatewayRef: paymentData.id,
        },
        data: {
          status: "CAPTURED",
          completedAt: new Date(),
          metadata: paymentData,
        },
      });

      // Update invoice
      await db.invoice.update({
        where: { id: invoice.id },
        data: {
          status: "PAID",
          paidAt: new Date(),
        },
      });

      // Transition subscription to ACTIVE
      if (invoice.subscriptionId) {
        await transitionSubscription(
          invoice.subscriptionId,
          "ACTIVE",
          `webhook:${gateway}`
        );
        invalidateEntitlements(invoice.organizationId);
      }
      break;
    }

    case "payment.failed":
    case "payment_failed": {
      // Update payment transaction
      await db.paymentTransaction.updateMany({
        where: {
          invoiceId: invoice.id,
          gatewayRef: paymentData.id,
        },
        data: {
          status: "FAILED",
          failureReason: paymentData?.source?.message ?? "Payment failed",
          completedAt: new Date(),
          metadata: paymentData,
        },
      });

      // If subscription exists, check dunning status
      if (invoice.subscriptionId && invoice.subscription) {
        const currentStatus = invoice.subscription.status;
        if (currentStatus === "ACTIVE" || currentStatus === "TRIALING") {
          await transitionSubscription(
            invoice.subscriptionId,
            "PAST_DUE",
            `webhook:${gateway}`,
            "Payment failed"
          );
          invalidateEntitlements(invoice.organizationId);
        }
      }
      break;
    }

    case "payment.refunded":
    case "refund.created": {
      await db.paymentTransaction.updateMany({
        where: {
          invoiceId: invoice.id,
          gatewayRef: paymentData.id,
        },
        data: {
          status: "REFUNDED",
          refundedAmount: paymentData.refunded ? paymentData.refunded / 100 : undefined,
          completedAt: new Date(),
          metadata: paymentData,
        },
      });

      await db.invoice.update({
        where: { id: invoice.id },
        data: { status: "REFUNDED" },
      });

      break;
    }

    default:
      console.log(`[Webhook] Unhandled event type: ${eventType}`);
  }
}
