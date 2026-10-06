/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // Menu and online ordering now live together on /menu.
  async redirects() {
    return [
      { source: "/build", destination: "/menu", permanent: true },
      { source: "/order", destination: "/menu", permanent: true },
      { source: "/parea-mas", destination: "/parea", permanent: true },
    ];
  },
};

export default nextConfig;
