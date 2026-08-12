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
  serverExternalPackages: ["pg", "pdfmake", "@netlify/blobs"],
};

export default nextConfig;
