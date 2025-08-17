/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@agent-spend-permissions/shared-types',
    '@agent-spend-permissions/x402-client',
    '@agent-spend-permissions/config'
  ]
}

module.exports = nextConfig