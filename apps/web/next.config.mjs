import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@gam/shared'],
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000'] },
  },
};

export default withNextIntl(nextConfig);
