/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@sovereign/identity',
    '@sovereign/ledger',
    '@sovereign/compliance',
    '@sovereign/products',
  ],
};

module.exports = nextConfig;
