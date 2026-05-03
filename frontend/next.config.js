/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // No rewrites — the frontend reaches each service directly via
  // NEXT_PUBLIC_*_URL env vars (see frontend/lib/api.ts).
  // In local dev, those vars default to http://localhost:8080/api/*
  // which is the Nginx gateway from docker-compose.
};
module.exports = nextConfig;
