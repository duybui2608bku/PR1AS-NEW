import type { NextConfig } from "next";

// Extract Supabase hostname
const getSupabaseHostname = (): string | undefined => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return undefined;
  try {
    return new URL(supabaseUrl).hostname;
  } catch {
    return undefined;
  }
};

const supabaseHostname = getSupabaseHostname();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "qr.sepay.vn", pathname: "/img/**" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.pinimg.com" },
      { protocol: "https", hostname: "i.ibytecdn.org" },
      ...(supabaseHostname
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHostname,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
      {
        protocol: "https" as const,
        hostname: "supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `
              default-src 'self';
              connect-src 'self'
                https://*.supabase.co
                https://*.supabase.com
                https://cfig.ibytecdn.org;
              img-src 'self' blob: data: https:;
              media-src 'self' blob: https:;
              script-src 'self' 'unsafe-inline' 'unsafe-eval';
              style-src 'self' 'unsafe-inline';
            `
              .replace(/\s+/g, " ")
              .trim(),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
