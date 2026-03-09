/**
 * Payment Gateway Abstraction Layer
 *
 * Unified interface for all payment gateways (Moyasar, HyperPay, PayTabs).
 * All amounts in minor units (halalas): 100.00 SAR = 10000
 */

// ─── Normalized Types ────────────────────────────────────────────────────────

export type PaymentCurrency = "SAR" | "USD" | "AED";

export type PaymentBrand = "mada" | "visa" | "mastercard" | "amex" | "applepay" | "stcpay";

export type GatewayName = "moyasar" | "hyperpay" | "paytabs";

export type NormalizedPaymentStatus =
  | "pending"
  | "authorized"
  | "captured"
  | "failed"
  | "refunded"
  | "partially_refunded"
  | "voided";

// ─── Payment Request / Response ─────────────────────────────────────────────

export interface CreatePaymentRequest {
  /** Amount in SAR (decimal, e.g., 299.00) */
  amount: number;
  currency: PaymentCurrency;
  description: string;
  /** Internal reference — links to our Invoice */
  metadata: {
    invoiceId: string;
    organizationId: string;
    subscriptionId?: string;
    [key: string]: string | undefined;
  };
  /** Callback URL after payment completes */
  callbackUrl: string;
}

export interface CreatePaymentResponse {
  transactionId: string;     // Our internal ID
  gatewayRef: string;        // Gateway-specific reference
  paymentUrl?: string;       // Redirect URL for hosted checkout
  status: NormalizedPaymentStatus;
  rawResponse?: unknown;     // Full gateway response for debugging
}

export interface VerifyPaymentResponse {
  gatewayRef: string;
  status: NormalizedPaymentStatus;
  amount: number;
  currency: PaymentCurrency;
  brand?: PaymentBrand;
  lastFourDigits?: string;
  paidAt?: Date;
  failureReason?: string;
  rawResponse?: unknown;
}

export interface RefundPaymentRequest {
  gatewayRef: string;
  /** Partial refund amount. If omitted, full refund. */
  amount?: number;
  reason?: string;
}

export interface RefundPaymentResponse {
  refundId: string;
  status: NormalizedPaymentStatus;
  refundedAmount: number;
  rawResponse?: unknown;
}

// ─── Tokenization (recurring payments) ──────────────────────────────────────

export interface TokenizeCardResponse {
  tokenId: string;
  brand: PaymentBrand;
  lastFourDigits: string;
  expiryMonth: number;
  expiryYear: number;
  holderName?: string;
}

export interface ChargeTokenRequest {
  tokenId: string;
  amount: number;
  currency: PaymentCurrency;
  description: string;
  metadata: Record<string, string>;
}

export interface ChargeTokenResponse {
  transactionId: string;
  gatewayRef: string;
  status: NormalizedPaymentStatus;
  failureReason?: string;
  rawResponse?: unknown;
}

// ─── Webhook Types ──────────────────────────────────────────────────────────

export interface WebhookVerificationResult {
  valid: boolean;
  eventId: string;
  eventType: string;
  payload: unknown;
}

// ─── Provider Interface ─────────────────────────────────────────────────────

/**
 * Every payment gateway must implement this interface.
 * The gateway-router selects the active provider at runtime.
 */
export interface PaymentProvider {
  readonly name: GatewayName;

  /** Create a new payment (redirect-based or inline) */
  createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse>;

  /** Verify payment status by gateway reference */
  verifyPayment(gatewayRef: string): Promise<VerifyPaymentResponse>;

  /** Refund a payment (full or partial) */
  refundPayment(request: RefundPaymentRequest): Promise<RefundPaymentResponse>;

  /** Charge a saved token (for recurring billing) */
  chargeToken(request: ChargeTokenRequest): Promise<ChargeTokenResponse>;

  /** Verify webhook signature and parse payload */
  verifyWebhook(rawBody: string, signature: string): Promise<WebhookVerificationResult>;
}
