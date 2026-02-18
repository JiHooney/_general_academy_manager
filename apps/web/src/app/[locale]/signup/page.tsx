'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { api } from '../../../lib/api';
import { LanguageSwitcher } from '../../../components/language-switcher';

export default function SignupPage({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations('auth');
  const router = useRouter();
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    timezone: 'UTC',
    locale: locale,
  });
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [agreeTrialTerm, setAgreeTrialTerm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'teacher' && !agreeTrialTerm) {
      setError('선생님 가입 시 무료 체험 약관에 동의해야 합니다.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/signup', { ...form, role });
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
            <div className="font-semibold text-sm">학생</div>
            <div className="text-xs text-gray-400 mt-0.5">무료</div>
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
            <div className="font-semibold text-sm">선생님</div>
            <div className="text-xs text-amber-500 mt-0.5">1개월 무료체험</div>
          </button>
        </div>

        {role === 'teacher' && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 space-y-2">
            <p className="font-semibold">⭐ 선생님 요금제</p>
            <ul className="text-xs space-y-1 text-amber-700">
              <li>• 첫 1개월 무료 체험</li>
              <li>• 스튜디오/조직 생성 가능</li>
              <li>• 수업 요청 수락 및 관리</li>
              <li>• 체험 종료 후 구독 결제 필요</li>
            </ul>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTrialTerm}
                onChange={(e) => setAgreeTrialTerm(e.target.checked)}
                className="rounded"
              />
              <span className="text-xs">무료 체험 약관에 동의합니다</span>
            </label>
          </div>
        )}

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

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
          >
            {loading ? '...' : `${role === 'teacher' ? '👨‍🏫 선생님으로 ' : '🎓 학생으로 '}가입하기`}
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
