import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },

  images: {
    remotePatterns: [
      // Supabase Storage (artist photos, portfolio images, event covers)
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Cloudflare CDN (future image CDN)
      {
        protocol: "https",
        hostname: "**.stagd.app",
      },
      // Unsplash (for mock data)
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      // QR Code Generators
      {
        protocol: "https",
        hostname: "api.qrserver.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.qrfy.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "qrfy.com",
        pathname: "/**",
      },
    ],
    formats: ["image/webp"],
    deviceSizes: [375, 640, 768, 1024, 1280, 1536],
    imageSizes: [64, 96, 128, 256, 384],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },

  // Redirect /u/username → /username (future deep link compat)
  async redirects() {
    return [
      {
        source: "/u/:username",
        destination: "/:username",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
