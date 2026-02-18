'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { NavHeader } from '../../../components/nav-header';

interface Me {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function DashboardPage({ params: { locale } }: { params: { locale: string } }) {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Me>('/auth/me')
      .then(setMe)
      .catch(() => router.push(`/${locale}/login`))
      .finally(() => setLoading(false));
  }, [locale, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        불러오는 중...
      </div>
    );
  }

  if (!me) return null;

  const isTeacher = me.role === 'teacher' || me.role === 'admin';

  return (
    <>
      <NavHeader locale={locale} title="대시보드" role={me.role} />

      <main className="max-w-2xl mx-auto p-6 space-y-6">
        {/* 인사말 */}
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <p className="text-gray-500 text-sm">안녕하세요,</p>
          <h1 className="text-2xl font-bold text-gray-800 mt-1">{me.name}</h1>
          <p className="text-sm text-gray-400 mt-1">{me.email}</p>
          <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${
            isTeacher ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {isTeacher ? '👨‍🏫 선생님' : '🎓 학생'}
          </span>
        </div>

        {/* 메뉴 그리드 */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            href={`/${locale}/studios`}
            className="bg-white border rounded-xl p-5 hover:shadow-md transition flex flex-col items-center gap-2 text-center"
          >
            <span className="text-4xl">🏫</span>
            <span className="font-semibold text-gray-800">스튜디오 목록</span>
            <span className="text-xs text-gray-400">가입한 스튜디오 보기</span>
          </Link>

          <Link
            href={`/${locale}/studios/create`}
            className="bg-white border rounded-xl p-5 hover:shadow-md transition flex flex-col items-center gap-2 text-center"
          >
            <span className="text-4xl">➕</span>
            <span className="font-semibold text-gray-800">스튜디오 생성</span>
            <span className="text-xs text-gray-400">새 스튜디오 만들기</span>
          </Link>

          <Link
            href={`/${locale}/studios/join`}
            className="bg-white border rounded-xl p-5 hover:shadow-md transition flex flex-col items-center gap-2 text-center"
          >
            <span className="text-4xl">🔑</span>
            <span className="font-semibold text-gray-800">스튜디오 참가</span>
            <span className="text-xs text-gray-400">초대 코드로 참가</span>
          </Link>

          {isTeacher && (
            <Link
              href={`/${locale}/requests`}
              className="bg-amber-50 border border-amber-200 rounded-xl p-5 hover:shadow-md transition flex flex-col items-center gap-2 text-center"
            >
              <span className="text-4xl">📋</span>
              <span className="font-semibold text-amber-700">수업 요청 관리</span>
              <span className="text-xs text-amber-500">선생님 전용</span>
            </Link>
          )}

          {isTeacher && (
            <Link
              href={`/${locale}/organizations/create`}
              className="bg-amber-50 border border-amber-200 rounded-xl p-5 hover:shadow-md transition flex flex-col items-center gap-2 text-center"
            >
              <span className="text-4xl">🏢</span>
              <span className="font-semibold text-amber-700">조직 생성</span>
              <span className="text-xs text-amber-500">선생님 전용</span>
            </Link>
          )}
        </div>
      </main>
    </>
  );
}
