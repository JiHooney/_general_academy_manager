import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { SUPPORTED_LOCALES } from '@gam/shared';

export default getRequestConfig(async ({ locale }) => {
  // locale이 지원 목록에 없으면 404
  if (!SUPPORTED_LOCALES.includes(locale as any)) notFound();

  return {
    locale,
    messages: (await import(`../../../packages/i18n/locales/${locale}.json`)).default,
  };
});
