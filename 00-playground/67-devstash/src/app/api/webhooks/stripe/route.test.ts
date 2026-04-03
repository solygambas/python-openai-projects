import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

// Mock @/lib/stripe
vi.mock("@/lib/stripe", () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
    subscriptions: {
      retrieve: vi.fn(),
    },
  },
}));

// Mock @/lib/prisma
vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";

describe("Stripe Webhook Handler", () => {
  const mockHeaders = headers as ReturnType<typeof vi.fn>;
  const mockConstructEvent = stripe.webhooks.constructEvent as ReturnType<
    typeof vi.fn
  >;
  const mockSubscriptionsRetrieve = stripe.subscriptions.retrieve as ReturnType<
    typeof vi.fn
  >;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Signature verification", () => {
    it("returns 400 when stripe-signature header is missing", async () => {
      mockHeaders.mockResolvedValue({
        get: vi.fn().mockReturnValue(null),
      });

      const request = new Request("http://localhost/api/webhooks/stripe", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Missing stripe-signature header");
    });

    it("returns 400 when signature verification fails", async () => {
      mockHeaders.mockResolvedValue({
        get: vi.fn().mockReturnValue("invalid-signature"),
      });
      mockConstructEvent.mockImplementation(() => {
        throw new Error("Invalid signature");
      });

      const request = new Request("http://localhost/api/webhooks/stripe", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid signature");
    });
  });

  describe("checkout.session.completed", () => {
    it("activates Pro status for user", async () => {
      mockHeaders.mockResolvedValue({
        get: vi.fn().mockReturnValue("valid-signature"),
      });
      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: {
          object: {
            metadata: { userId: "user-123" },
            subscription: "sub-123",
            customer: "cus-123",
          },
        },
      });
      mockSubscriptionsRetrieve.mockResolvedValue({
        id: "sub-123",
        status: "active",
      });
      (prisma.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "user-123",
        isPro: true,
      });

      const request = new Request("http://localhost/api/webhooks/stripe", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: {
          stripeCustomerId: "cus-123",
          stripeSubscriptionId: "sub-123",
          isPro: true,
        },
      });
    });
  });

  describe("customer.subscription.updated", () => {
    it("updates isPro to true for active subscription", async () => {
      mockHeaders.mockResolvedValue({
        get: vi.fn().mockReturnValue("valid-signature"),
      });
      mockConstructEvent.mockReturnValue({
        type: "customer.subscription.updated",
        data: {
          object: {
            id: "sub-123",
            customer: "cus-123",
            status: "active",
          },
        },
      });
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "user-123",
        stripeCustomerId: "cus-123",
      });
      (prisma.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "user-123",
        isPro: true,
      });

      const request = new Request("http://localhost/api/webhooks/stripe", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      await response.json();

      expect(response.status).toBe(200);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: {
          isPro: true,
          stripeSubscriptionId: "sub-123",
        },
      });
    });

    it("updates isPro to false for canceled subscription", async () => {
      mockHeaders.mockResolvedValue({
        get: vi.fn().mockReturnValue("valid-signature"),
      });
      mockConstructEvent.mockReturnValue({
        type: "customer.subscription.updated",
        data: {
          object: {
            id: "sub-123",
            customer: "cus-123",
            status: "canceled",
          },
        },
      });
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "user-123",
        stripeCustomerId: "cus-123",
      });
      (prisma.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "user-123",
        isPro: false,
      });

      const request = new Request("http://localhost/api/webhooks/stripe", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      await response.json();

      expect(response.status).toBe(200);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: {
          isPro: false,
          stripeSubscriptionId: "sub-123",
        },
      });
    });
  });

  describe("customer.subscription.deleted", () => {
    it("revokes Pro status", async () => {
      mockHeaders.mockResolvedValue({
        get: vi.fn().mockReturnValue("valid-signature"),
      });
      mockConstructEvent.mockReturnValue({
        type: "customer.subscription.deleted",
        data: {
          object: {
            customer: "cus-123",
          },
        },
      });
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "user-123",
        stripeCustomerId: "cus-123",
      });
      (prisma.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "user-123",
        isPro: false,
      });

      const request = new Request("http://localhost/api/webhooks/stripe", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      await response.json();

      expect(response.status).toBe(200);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: {
          isPro: false,
          stripeSubscriptionId: null,
        },
      });
    });
  });

  describe("invoice.payment_failed", () => {
    it("logs payment failure without revoking access", async () => {
      const consoleSpy = vi.spyOn(console, "log");
      mockHeaders.mockResolvedValue({
        get: vi.fn().mockReturnValue("valid-signature"),
      });
      mockConstructEvent.mockReturnValue({
        type: "invoice.payment_failed",
        data: {
          object: {
            id: "inv-123",
            customer: "cus-123",
          },
        },
      });
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "user-123",
        stripeCustomerId: "cus-123",
      });

      const request = new Request("http://localhost/api/webhooks/stripe", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      await response.json();

      expect(response.status).toBe(200);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Payment failed for user user-123, invoice: inv-123",
      );
      // Should not update user - payment failures are retried
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe("unhandled events", () => {
    it("returns 200 for unhandled event types", async () => {
      mockHeaders.mockResolvedValue({
        get: vi.fn().mockReturnValue("valid-signature"),
      });
      mockConstructEvent.mockReturnValue({
        type: "some.other.event",
        data: {},
      });

      const request = new Request("http://localhost/api/webhooks/stripe", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
    });
  });
});
