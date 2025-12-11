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

export interface SEOHistoryRecord {
  id: string;
  value: SEOSettings;
  version_number: number;
  change_reason: string | null;
  created_at: string;
  changed_by: string;
  user?: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
}

export interface SEOExportData {
  exportDate: string;
  version: string;
  settings: SEOSettings;
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

  async saveSettings(
    settings: SEOSettings,
    changeReason?: string
  ): Promise<void> {
    await httpRequestJson<unknown>("/api/admin/settings/seo", {
      method: "POST",
      body: { settings, changeReason },
    });
  },

  async getHistory(limit?: number): Promise<SEOHistoryRecord[]> {
    const params = new URLSearchParams();
    if (limit) {
      params.append("limit", String(limit));
    }

    const result = await httpRequestJson<{ history: SEOHistoryRecord[] }>(
      `/api/admin/settings/seo/history?${params.toString()}`,
      {
        method: "GET",
      }
    );

    return result?.history || [];
  },

  async rollbackToVersion(
    versionId: string,
    changeReason?: string
  ): Promise<SEOSettings> {
    const result = await httpRequestJson<{
      rolledBackTo: number;
      settings: SEOSettings;
    }>("/api/admin/settings/seo/rollback", {
      method: "POST",
      body: { versionId, changeReason },
    });

    return result.settings;
  },

  async exportSettings(): Promise<SEOExportData> {
    const result = await httpRequestJson<SEOExportData>(
      "/api/admin/settings/seo/export",
      {
        method: "GET",
      }
    );

    return result;
  },

  async importSettings(
    settings: SEOSettings,
    changeReason?: string
  ): Promise<void> {
    await httpRequestJson<unknown>("/api/admin/settings/seo/import", {
      method: "POST",
      body: { settings, changeReason },
    });
  },
};


