import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get('keyword') ?? '';
  const page = searchParams.get('page') ?? '1';

  const trimmed = keyword.trim();
  if (trimmed.length < 2) {
    return NextResponse.json({ results: { common: { totalCount: '0' }, juso: [] } });
  }

  const confmKey = process.env.JUSO_API_KEY ?? 'TESTJUSOGOKR';

  const apiUrl = new URL('https://business.juso.go.kr/addrlink/addrLinkApi.do');
  apiUrl.searchParams.set('confmKey', confmKey);
  apiUrl.searchParams.set('currentPage', page);
  apiUrl.searchParams.set('countPerPage', '10');
  apiUrl.searchParams.set('keyword', trimmed);
  apiUrl.searchParams.set('resultType', 'json');

  try {
    const upstream = await fetch(apiUrl.toString(), { cache: 'no-store' });
    if (!upstream.ok) {
      return NextResponse.json({ error: 'upstream error' }, { status: 502 });
    }
    const data = await upstream.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'fetch failed' }, { status: 500 });
  }
}
