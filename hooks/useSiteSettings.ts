"use client";

import { useState, useEffect } from "react";
import { getSiteSettings, type SEOSettings } from "@/lib/utils/site-settings";

/**
 * React hook to fetch and use site settings
 */
export function useSiteSettings() {
  const [settings, setSettings] = useState<SEOSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await getSiteSettings();
        if (mounted) {
          setSettings(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error("Unknown error"));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchSettings();

    return () => {
      mounted = false;
    };
  }, []);

  return { settings, loading, error };
}
