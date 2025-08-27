/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "static.itdg.com.br",
      },
    ],
  },
};

module.exports = nextConfig;
