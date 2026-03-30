'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { api } from '../../../lib/api';

const COUNTRY_TIMEZONE: Record<string, string> = {
  KR: 'Asia/Seoul',
  JP: 'Asia/Tokyo',
  CN: 'Asia/Shanghai',
  TW: 'Asia/Taipei',
  HK: 'Asia/Hong_Kong',
  US: 'America/New_York',
  CA: 'America/Toronto',
  GB: 'Europe/London',
  FR: 'Europe/Paris',
  DE: 'Europe/Berlin',
  AU: 'Australia/Sydney',
  NZ: 'Pacific/Auckland',
  SG: 'Asia/Singapore',
  IN: 'Asia/Kolkata',
  BR: 'America/Sao_Paulo',
};

const COUNTRIES = [
  { code: 'KR', name: '대한민국 (Korea)' },
  { code: 'JP', name: '일본 (Japan)' },
  { code: 'CN', name: '중국 (China)' },
  { code: 'TW', name: '대만 (Taiwan)' },
  { code: 'HK', name: '홍콩 (Hong Kong)' },
  { code: 'US', name: '미국 (USA)' },
  { code: 'CA', name: '캐나다 (Canada)' },
  { code: 'GB', name: '영국 (UK)' },
  { code: 'FR', name: '프랑스 (France)' },
  { code: 'DE', name: '독일 (Germany)' },
  { code: 'AU', name: '호주 (Australia)' },
  { code: 'SG', name: '싱가포르 (Singapore)' },
  { code: 'IN', name: '인도 (India)' },
  { code: 'BR', name: '브라질 (Brazil)' },
  { code: 'OTHER', name: '기타 (Other)' },
];

export default function OnboardingPage({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations('auth');
  const router = useRouter();
  const [country, setCountry] = useState('KR');
  const [timezone, setTimezone] = useState('Asia/Seoul');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Auto-detect timezone from browser
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (detected) setTimezone(detected);
  }, []);

  useEffect(() => {
    const tz = COUNTRY_TIMEZONE[country] || timezone;
    setTimezone(tz);
  }, [country]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.patch('/auth/me', { country, timezone });
      router.push(`/${locale}/dashboard`);
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-8 space-y-6">
        <h1 className="text-2xl font-bold">{t('onboardingTitle')}</h1>
        <p className="text-gray-500 text-sm">{t('onboardingDesc')}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              🌍 {t('countryLabel')}
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              {t('timezoneLabel')}: {timezone}
            </p>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
          >
            {loading ? '...' : t('continue')}
          </button>
        </form>

        <button
          onClick={() => router.push(`/${locale}/dashboard`)}
          className="w-full text-sm text-gray-500 hover:underline"
        >
          {t('skipForNow')}
        </button>
      </div>
    </main>
  );
}
