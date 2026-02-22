'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { api } from '../../../lib/api';
import { LanguageSwitcher } from '../../../components/language-switcher';

// 국가 → 기본 timezone 매핑
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
  MX: 'America/Mexico_City',
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

interface JusoItem {
  roadAddr: string;
  zipNo: string;
  jibunAddr: string;
}

export default function SignupPage({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations('auth');
  const router = useRouter();
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    timezone: 'Asia/Seoul',
    locale: locale,
  });
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 주소 관련 state
  const [country, setCountry] = useState('KR');
  const [addressMain, setAddressMain] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [postalCode, setPostalCode] = useState('');
  // 한국 도로명주소 검색
  const [jusoQuery, setJusoQuery] = useState('');
  const [jusoResults, setJusoResults] = useState<JusoItem[]>([]);
  const [jusoLoading, setJusoLoading] = useState(false);
  const [jusoSelected, setJusoSelected] = useState(false);
  const searchTimer = useRef<NodeJS.Timeout | null>(null);

  // 국가 변경 시 timezone 자동 설정
  useEffect(() => {
    const tz = COUNTRY_TIMEZONE[country] || 'UTC';
    setForm((prev) => ({ ...prev, timezone: tz }));
    // 국가 바뀌면 주소 초기화
    setAddressMain('');
    setAddressDetail('');
    setPostalCode('');
    setJusoQuery('');
    setJusoResults([]);
    setJusoSelected(false);
  }, [country]);

  // 한국 도로명주소 API 검색 (디바운스 300ms)
  const searchJuso = async (keyword: string) => {
    if (!keyword.trim() || keyword.length < 2) { setJusoResults([]); return; }
    setJusoLoading(true);
    try {
      const key = process.env.NEXT_PUBLIC_JUSO_API_KEY || 'devU01TX0FVVEgyMDIwMDcwOTEzMDAxNTExMjc=';
      const url = `https://business.juso.go.kr/addrlink/addrLinkApi.do?confmKey=${key}&currentPage=1&countPerPage=10&keyword=${encodeURIComponent(keyword)}&resultType=json`;
      const res = await fetch(url);
      const json = await res.json();
      setJusoResults(json?.results?.juso || []);
    } catch {
      setJusoResults([]);
    } finally {
      setJusoLoading(false);
    }
  };

  const handleJusoInput = (val: string) => {
    setJusoQuery(val);
    setJusoSelected(false);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => searchJuso(val), 300);
  };

  const selectJusoItem = (item: JusoItem) => {
    setAddressMain(item.roadAddr);
    setPostalCode(item.zipNo);
    setJusoQuery(item.roadAddr);
    setJusoResults([]);
    setJusoSelected(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/signup', {
        ...form,
        role,
        country,
        addressMain: addressMain || undefined,
        addressDetail: addressDetail || undefined,
        postalCode: postalCode || undefined,
      });
      router.push(`/${locale}/login`);
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-8 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t('signup')}</h1>
          <LanguageSwitcher currentLocale={locale} />
        </div>

        {/* 역할 선택 */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole('student')}
            className={`border-2 rounded-xl p-3 text-center transition ${
              role === 'student'
                ? 'border-primary-600 bg-primary-50 text-primary-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-2xl mb-1">🎓</div>
            <div className="font-semibold text-sm">{t('roleStudent')}</div>
          </button>
          <button
            type="button"
            onClick={() => setRole('teacher')}
            className={`border-2 rounded-xl p-3 text-center transition ${
              role === 'teacher'
                ? 'border-amber-500 bg-amber-50 text-amber-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-2xl mb-1">👨‍🏫</div>
            <div className="font-semibold text-sm">{t('roleTeacher')}</div>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {(['name', 'email', 'password'] as const).map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t(field)}
              </label>
              <input
                type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          ))}

          {/* ─── 국가 선택 ─────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">🌍 {t('countryLabel')}</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">{t('timezoneLabel')}: {form.timezone}</p>
          </div>

          {/* ─── 한국 도로명주소 검색 ────────────────────────── */}
          {country === 'KR' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">📍 {t('address')}</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder={t('addressSearchPlaceholder')}
                  value={jusoQuery}
                  onChange={(e) => handleJusoInput(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
                {jusoLoading && (
                  <span className="absolute right-3 top-2.5 text-gray-400 text-xs">{t('searching')}</span>
                )}
              </div>
              {jusoResults.length > 0 && !jusoSelected && (
                <ul className="border border-gray-200 rounded-lg divide-y max-h-48 overflow-y-auto shadow-sm">
                  {jusoResults.map((item, i) => (
                    <li
                      key={i}
                      onClick={() => selectJusoItem(item)}
                      className="px-3 py-2 hover:bg-primary-50 cursor-pointer text-sm"
                    >
                      <p className="font-medium">{item.roadAddr}</p>
                      <p className="text-xs text-gray-400">{item.zipNo} · {item.jibunAddr}</p>
                    </li>
                  ))}
                </ul>
              )}
              {postalCode && (
                <p className="text-xs text-gray-500">📮 {t('postalCode')}: {postalCode}</p>
              )}
              <input
                type="text"
                placeholder={t('addressDetailPlaceholder')}
                value={addressDetail}
                onChange={(e) => setAddressDetail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
            </div>
          )}

          {/* ─── 해외 주소 폼 ────────────────────────────────── */}
          {country !== 'KR' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">📍 {t('address')}</label>
              <input
                type="text"
                placeholder="Address Line 1"
                value={addressMain}
                onChange={(e) => setAddressMain(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
              <input
                type="text"
                placeholder="Address Line 2 / Apt / Suite (optional)"
                value={addressDetail}
                onChange={(e) => setAddressDetail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
              <input
                type="text"
                placeholder="Postal Code / ZIP"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
          >
            {loading ? '...' : (role === 'teacher' ? t('signupAsTeacher') : t('signupAsStudent'))}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600">
          {t('haveAccount')}{' '}
          <a href={`/${locale}/login`} className="text-primary-600 hover:underline">
            {t('login')}
          </a>
        </p>
      </div>
    </main>
  );
}
