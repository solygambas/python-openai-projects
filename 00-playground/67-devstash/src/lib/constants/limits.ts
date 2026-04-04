// Free tier limits
export const FREE_TIER_LIMITS = {
  maxItems: 50,
  maxCollections: 3,
} as const;

// AI rate limits (Pro users)
export const AI_RATE_LIMITS = {
  autoTag: { limit: 20, window: "1 h" as const },
  summarize: { limit: 20, window: "1 h" as const },
} as const;
