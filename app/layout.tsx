import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./globals-layout.css";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import I18nProvider from "@/components/providers/I18nProvider";
import { AntdAppProvider } from "@/components/providers/AntdProvider";
import { getSiteSettingsServer } from "@/lib/utils/site-settings";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#690F0F",
};

// Generate metadata dynamically from site settings
export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await getSiteSettingsServer();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    return {
      title: settings.siteTitle || "PR1AS - Nền tảng kết nối Client & Worker",
      description:
        settings.siteDescription ||
        "Tìm kiếm và thuê Worker chuyên nghiệp hoặc cung cấp dịch vụ và kiếm thu nhập",
      keywords: settings.siteKeywords
        ? settings.siteKeywords.split(",").map((k) => k.trim())
        : ["worker", "client", "dịch vụ", "tìm việc", "thuê người", "PR1AS"],
      authors: [{ name: settings.siteName || "PR1AS Team" }],
      openGraph: {
        title: settings.siteTitle || "PR1AS - Nền tảng kết nối Client & Worker",
        description:
          settings.siteDescription ||
          "Tìm kiếm và thuê Worker chuyên nghiệp hoặc cung cấp dịch vụ và kiếm thu nhập",
        type: "website",
        images: settings.ogImage
          ? [
              {
                url: settings.ogImage,
                width: 1200,
                height: 630,
                alt: settings.siteName || "PR1AS",
              },
            ]
          : [],
        siteName: settings.siteName || "PR1AS",
      },
      twitter: {
        card: "summary_large_image",
        title: settings.siteTitle || "PR1AS",
        description: settings.siteDescription || "",
        images: settings.ogImage ? [settings.ogImage] : [],
      },
      metadataBase: new URL(siteUrl),
    };
  } catch (error) {
    // Fallback to default metadata
    return {
      title: "PR1AS - Nền tảng kết nối Client & Worker",
      description:
        "Tìm kiếm và thuê Worker chuyên nghiệp hoặc cung cấp dịch vụ và kiếm thu nhập",
      keywords: [
        "worker",
        "client",
        "dịch vụ",
        "tìm việc",
        "thuê người",
        "PR1AS",
      ],
      authors: [{ name: "PR1AS Team" }],
      openGraph: {
        title: "PR1AS - Nền tảng kết nối Client & Worker",
        description:
          "Tìm kiếm và thuê Worker chuyên nghiệp hoặc cung cấp dịch vụ và kiếm thu nhập",
        type: "website",
      },
    };
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="antialiased font-sans">
        <AntdRegistry>
          <AntdAppProvider>
            <I18nProvider>{children}</I18nProvider>
          </AntdAppProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
