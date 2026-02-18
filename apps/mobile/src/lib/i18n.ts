import { I18n } from 'i18n-js';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@gam/shared';
import en from '../../../../packages/i18n/locales/en.json';
import ko from '../../../../packages/i18n/locales/ko.json';
import ja from '../../../../packages/i18n/locales/ja.json';

const translations: Record<string, object> = { en, ko, ja };

export const i18n = new I18n(translations);
i18n.defaultLocale = DEFAULT_LOCALE;
i18n.locale = DEFAULT_LOCALE;
i18n.enableFallback = true;

export function setLocale(locale: string) {
  if (SUPPORTED_LOCALES.includes(locale as any)) {
    i18n.locale = locale;
  }
}
