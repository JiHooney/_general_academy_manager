import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@gam/shared'],
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000'] },
  },
  // Windows 파일 잠금으로 인한 캐시 손상 방지
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default withNextIntl(nextConfig);
