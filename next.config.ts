import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project. Without it, Turbopack walks up and
  // picks the parent dir (there's a lockfile there too), then resolves
  // node_modules from the wrong place at dev runtime — which broke
  // @supabase/supabase-js resolution.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
