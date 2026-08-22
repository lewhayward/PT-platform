import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Server Actions cap request bodies at 1MB by default - well under the
    // 8MB progress-photo limit this app actually enforces (see
    // uploadProgressPhoto), which made every real phone photo fail before
    // the action's own size check ever ran. Some headroom above 8MB for
    // multipart boundary/field overhead.
    serverActions: {
      bodySizeLimit: "9mb",
    },
  },
};

export default nextConfig;
