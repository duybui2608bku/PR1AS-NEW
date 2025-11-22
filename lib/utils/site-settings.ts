/**
 * Utility functions for fetching and using site settings
 */

export interface SEOSettings {
  // General SEO
  siteName: string;
  siteTitle: string;
  siteDescription: string;
  siteKeywords: string;
  ogImage: string;

  // Header Settings
  headerLogo: string;
  headerTagline: string;
  headerContactPhone: string;
  headerContactEmail: string;

  // Footer Settings
  footerCompanyName: string;
  footerAddress: string;
  footerPhone: string;
  footerEmail: string;
  footerCopyright: string;
  footerAbout: string;

  // Social Media
  facebookUrl: string;
  twitterUrl: string;
  instagramUrl: string;
  linkedinUrl: string;
}

const defaultSettings: SEOSettings = {
  siteName: "PR1AS",
  siteTitle: "PR1AS - Connecting Workers and Clients",
  siteDescription: "Professional service marketplace platform",
  siteKeywords: "services, marketplace, workers, professionals",
  ogImage: "",
  headerLogo: "/logo.png",
  headerTagline: "Connect. Work. Succeed.",
  headerContactPhone: "",
  headerContactEmail: "",
  footerCompanyName: "PR1AS Ltd.",
  footerAddress: "",
  footerPhone: "",
  footerEmail: "",
  footerCopyright: "© 2025 PR1AS. All rights reserved.",
  footerAbout: "",
  facebookUrl: "",
  twitterUrl: "",
  instagramUrl: "",
  linkedinUrl: "",
};

/**
 * Fetch site settings from API (client-side)
 */
export async function getSiteSettings(): Promise<SEOSettings> {
  try {
    const response = await fetch("/api/admin/settings/seo", {
      cache: "no-store", // Always fetch fresh data
    });

    if (!response.ok) {
      return defaultSettings;
    }

    const result = await response.json();
    return result.data || defaultSettings;
  } catch (error) {
    return defaultSettings;
  }
}

/**
 * Fetch site settings from database (server-side)
 * Uses Supabase server client directly for better performance
 */
export async function getSiteSettingsServer(): Promise<SEOSettings> {
  try {
    // Dynamic import to avoid issues with server/client boundaries
    const { createAdminClient } = await import("@/lib/supabase/server");
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .eq("key", "seo_settings")
      .single();

    if (error && error.code !== "PGRST116") {
      return defaultSettings;
    }

    if (!data) {
      return defaultSettings;
    }

    return (data.value as SEOSettings) || defaultSettings;
  } catch (error) {
    return defaultSettings;
  }
}

