import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // next/image's default loader needs a server to resize images on the fly,
  // which a static export doesn't have. The only <Image> on the page is the
  // small header logo, so skip optimization rather than wire up a remote
  // loader for one 22px icon.
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
