import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker / minimal deployments
  output: process.env.DOCKER_BUILD === "1" ? "standalone" : undefined,

  // Production security headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // HSTS only meaningful on HTTPS — enable in real production
          ...(process.env.NODE_ENV === "production"
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=63072000; includeSubDomains; preload",
                },
              ]
            : []),
        ],
      },
    ];
  },

  // Avoid accidental exposure of server-only env
  poweredByHeader: false,

  experimental: {
    // Server Actions body size limit (file uploads later)
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
