import withFlowbiteReact from "flowbite-react/plugin/nextjs";
import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "pub-71fda1d803484e71bca8dc68bc991812.r2.dev",
      },
    ],
  },
  turbopack: {
    root: path.resolve(__dirname, "../../"),
  },
};

export default withFlowbiteReact(nextConfig);
