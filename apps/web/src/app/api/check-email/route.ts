import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email') ?? '';

  if (!email || !email.includes('@')) {
    return NextResponse.json({ available: false });
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
  const apiUrl = `${apiBase}/auth/check-email?email=${encodeURIComponent(email)}`;

  try {
    const upstream = await fetch(apiUrl, { cache: 'no-store' });
    if (!upstream.ok) {
      return NextResponse.json({ error: 'upstream error' }, { status: 502 });
    }
    const data = await upstream.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'fetch failed' }, { status: 500 });
  }
}
