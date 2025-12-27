import type { NextConfig } from "next";
import path from "path";
import withFlowbiteReact from "flowbite-react/plugin/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  turbopack: {
    root: path.resolve(__dirname, '../../'),
  },
};

export default withFlowbiteReact(nextConfig);