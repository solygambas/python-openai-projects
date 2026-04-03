import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  checkItemLimit,
  checkCollectionLimit,
  canUploadFiles,
  canUseAI,
  FREE_TIER_LIMITS,
} from "./usage-limits";
import prisma from "./prisma";

// Mock the prisma module
vi.mock("./prisma", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
    item: {
      count: vi.fn(),
    },
    collection: {
      count: vi.fn(),
    },
  },
}));

describe("usage-limits", () => {
  const mockUserId = "user-123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("FREE_TIER_LIMITS", () => {
    it("should have correct limits defined", () => {
      expect(FREE_TIER_LIMITS.maxItems).toBe(50);
      expect(FREE_TIER_LIMITS.maxCollections).toBe(3);
    });
  });

  describe("checkItemLimit", () => {
    it("should return true for Pro users", async () => {
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        isPro: true,
      });
      (prisma.item.count as ReturnType<typeof vi.fn>).mockResolvedValue(100);

      const result = await checkItemLimit(mockUserId);
      expect(result).toBe(true);
      expect(prisma.item.count).not.toHaveBeenCalled();
    });

    it("should return true for free users under limit", async () => {
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        isPro: false,
      });
      (prisma.item.count as ReturnType<typeof vi.fn>).mockResolvedValue(25);

      const result = await checkItemLimit(mockUserId);
      expect(result).toBe(true);
    });

    it("should throw error for free users at limit", async () => {
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        isPro: false,
      });
      (prisma.item.count as ReturnType<typeof vi.fn>).mockResolvedValue(50);

      await expect(checkItemLimit(mockUserId)).rejects.toThrow(
        `Free tier limit reached: ${FREE_TIER_LIMITS.maxItems} items`,
      );
    });

    it("should throw error for free users over limit", async () => {
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        isPro: false,
      });
      (prisma.item.count as ReturnType<typeof vi.fn>).mockResolvedValue(55);

      await expect(checkItemLimit(mockUserId)).rejects.toThrow(
        `Free tier limit reached: ${FREE_TIER_LIMITS.maxItems} items`,
      );
    });

    it("should throw error if user not found", async () => {
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        null,
      );

      await expect(checkItemLimit(mockUserId)).rejects.toThrow(
        "User not found",
      );
    });
  });

  describe("checkCollectionLimit", () => {
    it("should return true for Pro users", async () => {
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        isPro: true,
      });
      (prisma.collection.count as ReturnType<typeof vi.fn>).mockResolvedValue(
        10,
      );

      const result = await checkCollectionLimit(mockUserId);
      expect(result).toBe(true);
      expect(prisma.collection.count).not.toHaveBeenCalled();
    });

    it("should return true for free users under limit", async () => {
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        isPro: false,
      });
      (prisma.collection.count as ReturnType<typeof vi.fn>).mockResolvedValue(
        2,
      );

      const result = await checkCollectionLimit(mockUserId);
      expect(result).toBe(true);
    });

    it("should throw error for free users at limit", async () => {
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        isPro: false,
      });
      (prisma.collection.count as ReturnType<typeof vi.fn>).mockResolvedValue(
        3,
      );

      await expect(checkCollectionLimit(mockUserId)).rejects.toThrow(
        `Free tier limit reached: ${FREE_TIER_LIMITS.maxCollections} collections`,
      );
    });

    it("should throw error for free users over limit", async () => {
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        isPro: false,
      });
      (prisma.collection.count as ReturnType<typeof vi.fn>).mockResolvedValue(
        5,
      );

      await expect(checkCollectionLimit(mockUserId)).rejects.toThrow(
        `Free tier limit reached: ${FREE_TIER_LIMITS.maxCollections} collections`,
      );
    });

    it("should throw error if user not found", async () => {
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        null,
      );

      await expect(checkCollectionLimit(mockUserId)).rejects.toThrow(
        "User not found",
      );
    });
  });

  describe("canUploadFiles", () => {
    it("should return true for Pro users", async () => {
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        isPro: true,
      });

      const result = await canUploadFiles(mockUserId);
      expect(result).toBe(true);
    });

    it("should throw error for free users", async () => {
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        isPro: false,
      });

      await expect(canUploadFiles(mockUserId)).rejects.toThrow(
        "File uploads are a Pro feature",
      );
    });

    it("should throw error if user not found", async () => {
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        null,
      );

      await expect(canUploadFiles(mockUserId)).rejects.toThrow(
        "User not found",
      );
    });
  });

  describe("canUseAI", () => {
    it("should return true for Pro users", async () => {
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        isPro: true,
      });

      const result = await canUseAI(mockUserId);
      expect(result).toBe(true);
    });

    it("should throw error for free users", async () => {
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        isPro: false,
      });

      await expect(canUseAI(mockUserId)).rejects.toThrow(
        "AI features are a Pro feature",
      );
    });

    it("should throw error if user not found", async () => {
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        null,
      );

      await expect(canUseAI(mockUserId)).rejects.toThrow("User not found");
    });
  });
});
