'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '../../../../lib/api';
import { NavHeader } from '../../../../components/nav-header';

export default function StudioJoinPage({ params: { locale } }: { params: { locale: string } }) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [success, setSuccess] = useState(false);

  const joinMutation = useMutation({
    mutationFn: () => api.post('/invites/join', { code }),
    onSuccess: () => setSuccess(true),
  });

  return (
    <>
      <NavHeader locale={locale} title="스튜디오 참가" showBack backHref={`/${locale}/studios`} />

      <main className="max-w-lg mx-auto p-6">
        {success ? (
          <div className="bg-white border rounded-xl p-8 text-center space-y-4 shadow-sm">
            <div className="text-5xl">🎉</div>
            <p className="text-xl font-bold text-gray-800">참가 완료!</p>
            <p className="text-gray-500">클래스룸에 성공적으로 참가했습니다.</p>
            <button
              onClick={() => router.push(`/${locale}/studios`)}
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition"
            >
              스튜디오 목록으로
            </button>
          </div>
        ) : (
          <div className="bg-white border rounded-xl p-6 space-y-5 shadow-sm">
            <h1 className="text-xl font-bold">스튜디오 참가</h1>
            <p className="text-sm text-gray-500">선생님에게 받은 초대 코드를 입력하세요.</p>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">초대 코드</label>
              <input
                placeholder="예) 4487C417"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full border rounded-lg px-3 py-2 font-mono text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-primary-500"
                maxLength={12}
              />
            </div>

            {joinMutation.isError && (
              <p className="text-red-500 text-sm">{(joinMutation.error as any)?.message || '유효하지 않은 코드입니다.'}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => joinMutation.mutate()}
                disabled={!code || joinMutation.isPending}
                className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition disabled:opacity-50 font-medium"
              >
                {joinMutation.isPending ? '참가 중...' : '참가하기'}
              </button>
              <button
                onClick={() => router.back()}
                className="flex-1 border py-2 rounded-lg hover:bg-gray-50 transition"
              >
                취소
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
