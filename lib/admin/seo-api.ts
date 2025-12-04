/**
 * Admin SEO Settings API Client
 */

import { httpRequestJson } from "@/lib/http/client";

export interface SEOSettings {
  siteName: string;
  siteTitle: string;
  siteDescription: string;
  siteKeywords: string;
  ogImage: string;
  headerLogo: string;
  headerTagline: string;
  headerContactPhone: string;
  headerContactEmail: string;
  footerCompanyName: string;
  footerAddress: string;
  footerPhone: string;
  footerEmail: string;
  footerCopyright: string;
  footerAbout: string;
  facebookUrl: string;
  twitterUrl: string;
  instagramUrl: string;
  linkedinUrl: string;
}

export const adminSEOAPI = {
  async getSettings(): Promise<SEOSettings | null> {
    const result = await httpRequestJson<SEOSettings>(
      "/api/admin/settings/seo",
      {
        method: "GET",
      }
    );

    return result ?? null;
  },

  async saveSettings(settings: SEOSettings): Promise<void> {
    await httpRequestJson<unknown>("/api/admin/settings/seo", {
      method: "POST",
      body: { settings },
    });
  },
};


