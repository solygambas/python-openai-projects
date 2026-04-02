"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "devstash-pricing-period";

export function usePricingToggle() {
  const [isYearly, setIsYearly] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "yearly") {
      setIsYearly(true);
    }
  }, []);

  const togglePricing = () => {
    setIsYearly((prev) => {
      const newValue = !prev;
      localStorage.setItem(STORAGE_KEY, newValue ? "yearly" : "monthly");
      return newValue;
    });
  };

  return { isYearly, togglePricing, mounted };
}
