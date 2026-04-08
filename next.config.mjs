/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "via.placeholder.com" },
    ],
  },

  experimental: {
    // Keep Playwright and Chromium out of the webpack bundle —
    // they must run as native Node.js modules in the server runtime.
    serverComponentsExternalPackages: ["playwright-core", "@sparticuz/chromium"],
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
};

export default nextConfig;
