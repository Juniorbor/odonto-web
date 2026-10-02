import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
    ignoreIssue: [
      {
        path: '**/next.config.ts',
        description: /whole project was traced/i,
      },
    ],
  },
  serverExternalPackages: ["pg", "pdfmake"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
