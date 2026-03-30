'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LanguageSwitcher } from '../../../components/language-switcher';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const COUNTRY_CITIES: Record<string, { label: string; timezone: string }[]> = {
  KR: [
    // 특별시·광역시·특별자치시
    { label: '서울 / Seoul', timezone: 'Asia/Seoul' },
    { label: '부산 / Busan', timezone: 'Asia/Seoul' },
    { label: '인천 / Incheon', timezone: 'Asia/Seoul' },
    { label: '대구 / Daegu', timezone: 'Asia/Seoul' },
    { label: '대전 / Daejeon', timezone: 'Asia/Seoul' },
    { label: '광주 / Gwangju', timezone: 'Asia/Seoul' },
    { label: '울산 / Ulsan', timezone: 'Asia/Seoul' },
    { label: '세종 / Sejong', timezone: 'Asia/Seoul' },
    // 경기도
    { label: '수원 / Suwon (경기)', timezone: 'Asia/Seoul' },
    { label: '성남 / Seongnam (경기)', timezone: 'Asia/Seoul' },
    { label: '용인 / Yongin (경기)', timezone: 'Asia/Seoul' },
    { label: '고양 / Goyang (경기)', timezone: 'Asia/Seoul' },
    { label: '화성 / Hwaseong (경기)', timezone: 'Asia/Seoul' },
    { label: '부천 / Bucheon (경기)', timezone: 'Asia/Seoul' },
    { label: '남양주 / Namyangju (경기)', timezone: 'Asia/Seoul' },
    { label: '안산 / Ansan (경기)', timezone: 'Asia/Seoul' },
    { label: '안양 / Anyang (경기)', timezone: 'Asia/Seoul' },
    { label: '평택 / Pyeongtaek (경기)', timezone: 'Asia/Seoul' },
    { label: '시흥 / Siheung (경기)', timezone: 'Asia/Seoul' },
    { label: '파주 / Paju (경기)', timezone: 'Asia/Seoul' },
    { label: '의정부 / Uijeongbu (경기)', timezone: 'Asia/Seoul' },
    { label: '김포 / Gimpo (경기)', timezone: 'Asia/Seoul' },
    { label: '광명 / Gwangmyeong (경기)', timezone: 'Asia/Seoul' },
    { label: '하남 / Hanam (경기)', timezone: 'Asia/Seoul' },
    { label: '군포 / Gunpo (경기)', timezone: 'Asia/Seoul' },
    { label: '오산 / Osan (경기)', timezone: 'Asia/Seoul' },
    { label: '이천 / Icheon (경기)', timezone: 'Asia/Seoul' },
    { label: '양주 / Yangju (경기)', timezone: 'Asia/Seoul' },
    { label: '구리 / Guri (경기)', timezone: 'Asia/Seoul' },
    { label: '안성 / Anseong (경기)', timezone: 'Asia/Seoul' },
    { label: '포천 / Pocheon (경기)', timezone: 'Asia/Seoul' },
    { label: '의왕 / Uiwang (경기)', timezone: 'Asia/Seoul' },
    { label: '여주 / Yeoju (경기)', timezone: 'Asia/Seoul' },
    { label: '동두천 / Dongducheon (경기)', timezone: 'Asia/Seoul' },
    { label: '과천 / Gwacheon (경기)', timezone: 'Asia/Seoul' },
    // 강원특별자치도
    { label: '춘천 / Chuncheon (강원)', timezone: 'Asia/Seoul' },
    { label: '원주 / Wonju (강원)', timezone: 'Asia/Seoul' },
    { label: '강릉 / Gangneung (강원)', timezone: 'Asia/Seoul' },
    { label: '동해 / Donghae (강원)', timezone: 'Asia/Seoul' },
    { label: '속초 / Sokcho (강원)', timezone: 'Asia/Seoul' },
    { label: '태백 / Taebaek (강원)', timezone: 'Asia/Seoul' },
    { label: '삼척 / Samcheok (강원)', timezone: 'Asia/Seoul' },
    // 충청북도
    { label: '청주 / Cheongju (충북)', timezone: 'Asia/Seoul' },
    { label: '충주 / Chungju (충북)', timezone: 'Asia/Seoul' },
    { label: '제천 / Jecheon (충북)', timezone: 'Asia/Seoul' },
    // 충청남도
    { label: '천안 / Cheonan (충남)', timezone: 'Asia/Seoul' },
    { label: '아산 / Asan (충남)', timezone: 'Asia/Seoul' },
    { label: '공주 / Gongju (충남)', timezone: 'Asia/Seoul' },
    { label: '보령 / Boryeong (충남)', timezone: 'Asia/Seoul' },
    { label: '서산 / Seosan (충남)', timezone: 'Asia/Seoul' },
    { label: '논산 / Nonsan (충남)', timezone: 'Asia/Seoul' },
    { label: '당진 / Dangjin (충남)', timezone: 'Asia/Seoul' },
    { label: '계룡 / Gyeryong (충남)', timezone: 'Asia/Seoul' },
    // 전북특별자치도
    { label: '전주 / Jeonju (전북)', timezone: 'Asia/Seoul' },
    { label: '군산 / Gunsan (전북)', timezone: 'Asia/Seoul' },
    { label: '익산 / Iksan (전북)', timezone: 'Asia/Seoul' },
    { label: '정읍 / Jeongeup (전북)', timezone: 'Asia/Seoul' },
    { label: '남원 / Namwon (전북)', timezone: 'Asia/Seoul' },
    { label: '김제 / Gimje (전북)', timezone: 'Asia/Seoul' },
    // 전라남도
    { label: '목포 / Mokpo (전남)', timezone: 'Asia/Seoul' },
    { label: '여수 / Yeosu (전남)', timezone: 'Asia/Seoul' },
    { label: '순천 / Suncheon (전남)', timezone: 'Asia/Seoul' },
    { label: '나주 / Naju (전남)', timezone: 'Asia/Seoul' },
    { label: '광양 / Gwangyang (전남)', timezone: 'Asia/Seoul' },
    // 경상북도
    { label: '포항 / Pohang (경북)', timezone: 'Asia/Seoul' },
    { label: '경주 / Gyeongju (경북)', timezone: 'Asia/Seoul' },
    { label: '구미 / Gumi (경북)', timezone: 'Asia/Seoul' },
    { label: '안동 / Andong (경북)', timezone: 'Asia/Seoul' },
    { label: '김천 / Gimcheon (경북)', timezone: 'Asia/Seoul' },
    { label: '영주 / Yeongju (경북)', timezone: 'Asia/Seoul' },
    { label: '영천 / Yeongcheon (경북)', timezone: 'Asia/Seoul' },
    { label: '상주 / Sangju (경북)', timezone: 'Asia/Seoul' },
    { label: '경산 / Gyeongsan (경북)', timezone: 'Asia/Seoul' },
    { label: '문경 / Mungyeong (경북)', timezone: 'Asia/Seoul' },
    // 경상남도
    { label: '창원 / Changwon (경남)', timezone: 'Asia/Seoul' },
    { label: '진주 / Jinju (경남)', timezone: 'Asia/Seoul' },
    { label: '김해 / Gimhae (경남)', timezone: 'Asia/Seoul' },
    { label: '양산 / Yangsan (경남)', timezone: 'Asia/Seoul' },
    { label: '거제 / Geoje (경남)', timezone: 'Asia/Seoul' },
    { label: '통영 / Tongyeong (경남)', timezone: 'Asia/Seoul' },
    { label: '사천 / Sacheon (경남)', timezone: 'Asia/Seoul' },
    { label: '밀양 / Miryang (경남)', timezone: 'Asia/Seoul' },
    // 제주특별자치도
    { label: '제주 / Jeju', timezone: 'Asia/Seoul' },
    { label: '서귀포 / Seogwipo', timezone: 'Asia/Seoul' },
  ],
  JP: [
    { label: '도쿄 / Tokyo', timezone: 'Asia/Tokyo' },
    { label: '요코하마 / Yokohama', timezone: 'Asia/Tokyo' },
    { label: '오사카 / Osaka', timezone: 'Asia/Tokyo' },
    { label: '교토 / Kyoto', timezone: 'Asia/Tokyo' },
    { label: '고베 / Kobe', timezone: 'Asia/Tokyo' },
    { label: '나고야 / Nagoya', timezone: 'Asia/Tokyo' },
    { label: '삿포로 / Sapporo', timezone: 'Asia/Tokyo' },
    { label: '후쿠오카 / Fukuoka', timezone: 'Asia/Tokyo' },
    { label: '히로시마 / Hiroshima', timezone: 'Asia/Tokyo' },
    { label: '센다이 / Sendai', timezone: 'Asia/Tokyo' },
    { label: '나하 / Naha (Okinawa)', timezone: 'Asia/Tokyo' },
  ],
  CN: [
    { label: '베이징 / Beijing', timezone: 'Asia/Shanghai' },
    { label: '상하이 / Shanghai', timezone: 'Asia/Shanghai' },
    { label: '광저우 / Guangzhou', timezone: 'Asia/Shanghai' },
    { label: '선전 / Shenzhen', timezone: 'Asia/Shanghai' },
    { label: '청두 / Chengdu', timezone: 'Asia/Shanghai' },
    { label: '충칭 / Chongqing', timezone: 'Asia/Shanghai' },
    { label: '항저우 / Hangzhou', timezone: 'Asia/Shanghai' },
    { label: '우한 / Wuhan', timezone: 'Asia/Shanghai' },
    { label: '시안 / Xi\'an', timezone: 'Asia/Shanghai' },
    { label: '난징 / Nanjing', timezone: 'Asia/Shanghai' },
    { label: '텐진 / Tianjin', timezone: 'Asia/Shanghai' },
    { label: '우루무치 / Ürümqi', timezone: 'Asia/Urumqi' },
  ],
  TW: [
    { label: '타이베이 / Taipei', timezone: 'Asia/Taipei' },
    { label: '신베이 / New Taipei', timezone: 'Asia/Taipei' },
    { label: '타이중 / Taichung', timezone: 'Asia/Taipei' },
    { label: '타이난 / Tainan', timezone: 'Asia/Taipei' },
    { label: '가오슝 / Kaohsiung', timezone: 'Asia/Taipei' },
    { label: '타오위안 / Taoyuan', timezone: 'Asia/Taipei' },
    { label: '화롄 / Hualien', timezone: 'Asia/Taipei' },
  ],
  HK: [
    { label: '홍콩섬 / Hong Kong Island', timezone: 'Asia/Hong_Kong' },
    { label: '가우룡 / Kowloon', timezone: 'Asia/Hong_Kong' },
    { label: '신제 / New Territories', timezone: 'Asia/Hong_Kong' },
  ],
  US: [
    { label: 'New York, NY (동부)', timezone: 'America/New_York' },
    { label: 'Boston, MA (동부)', timezone: 'America/New_York' },
    { label: 'Philadelphia, PA (동부)', timezone: 'America/New_York' },
    { label: 'Washington, DC (동부)', timezone: 'America/New_York' },
    { label: 'Atlanta, GA (동부)', timezone: 'America/New_York' },
    { label: 'Miami, FL (동부)', timezone: 'America/New_York' },
    { label: 'Detroit, MI (동부)', timezone: 'America/Detroit' },
    { label: 'Chicago, IL (중부)', timezone: 'America/Chicago' },
    { label: 'Houston, TX (중부)', timezone: 'America/Chicago' },
    { label: 'Dallas, TX (중부)', timezone: 'America/Chicago' },
    { label: 'Minneapolis, MN (중부)', timezone: 'America/Chicago' },
    { label: 'New Orleans, LA (중부)', timezone: 'America/Chicago' },
    { label: 'Denver, CO (산악)', timezone: 'America/Denver' },
    { label: 'Salt Lake City, UT (산악)', timezone: 'America/Denver' },
    { label: 'Phoenix, AZ (산악)', timezone: 'America/Phoenix' },
    { label: 'Los Angeles, CA (서부)', timezone: 'America/Los_Angeles' },
    { label: 'San Francisco, CA (서부)', timezone: 'America/Los_Angeles' },
    { label: 'San Jose, CA (서부)', timezone: 'America/Los_Angeles' },
    { label: 'Seattle, WA (서부)', timezone: 'America/Los_Angeles' },
    { label: 'Portland, OR (서부)', timezone: 'America/Los_Angeles' },
    { label: 'Las Vegas, NV (서부)', timezone: 'America/Los_Angeles' },
    { label: 'Honolulu, HI (하와이)', timezone: 'Pacific/Honolulu' },
    { label: 'Anchorage, AK (알래스카)', timezone: 'America/Anchorage' },
  ],
  CA: [
    { label: 'Toronto, ON', timezone: 'America/Toronto' },
    { label: 'Ottawa, ON', timezone: 'America/Toronto' },
    { label: 'Montreal, QC', timezone: 'America/Toronto' },
    { label: 'Quebec City, QC', timezone: 'America/Toronto' },
    { label: 'Halifax, NS', timezone: 'America/Halifax' },
    { label: 'Winnipeg, MB', timezone: 'America/Winnipeg' },
    { label: 'Regina, SK', timezone: 'America/Regina' },
    { label: 'Calgary, AB', timezone: 'America/Edmonton' },
    { label: 'Edmonton, AB', timezone: 'America/Edmonton' },
    { label: 'Vancouver, BC', timezone: 'America/Vancouver' },
    { label: 'Victoria, BC', timezone: 'America/Vancouver' },
  ],
  GB: [
    { label: 'London', timezone: 'Europe/London' },
    { label: 'Birmingham', timezone: 'Europe/London' },
    { label: 'Manchester', timezone: 'Europe/London' },
    { label: 'Leeds', timezone: 'Europe/London' },
    { label: 'Liverpool', timezone: 'Europe/London' },
    { label: 'Bristol', timezone: 'Europe/London' },
    { label: 'Sheffield', timezone: 'Europe/London' },
    { label: 'Glasgow', timezone: 'Europe/London' },
    { label: 'Edinburgh', timezone: 'Europe/London' },
    { label: 'Cardiff', timezone: 'Europe/London' },
    { label: 'Belfast', timezone: 'Europe/London' },
  ],
  FR: [
    { label: 'Paris', timezone: 'Europe/Paris' },
    { label: 'Lyon', timezone: 'Europe/Paris' },
    { label: 'Marseille', timezone: 'Europe/Paris' },
    { label: 'Toulouse', timezone: 'Europe/Paris' },
    { label: 'Nice', timezone: 'Europe/Paris' },
    { label: 'Nantes', timezone: 'Europe/Paris' },
    { label: 'Strasbourg', timezone: 'Europe/Paris' },
    { label: 'Bordeaux', timezone: 'Europe/Paris' },
    { label: 'Lille', timezone: 'Europe/Paris' },
    { label: 'Rennes', timezone: 'Europe/Paris' },
  ],
  DE: [
    { label: 'Berlin', timezone: 'Europe/Berlin' },
    { label: 'Hamburg', timezone: 'Europe/Berlin' },
    { label: 'Munich (München)', timezone: 'Europe/Berlin' },
    { label: 'Cologne (Köln)', timezone: 'Europe/Berlin' },
    { label: 'Frankfurt', timezone: 'Europe/Berlin' },
    { label: 'Stuttgart', timezone: 'Europe/Berlin' },
    { label: 'Düsseldorf', timezone: 'Europe/Berlin' },
    { label: 'Dortmund', timezone: 'Europe/Berlin' },
    { label: 'Essen', timezone: 'Europe/Berlin' },
    { label: 'Leipzig', timezone: 'Europe/Berlin' },
    { label: 'Dresden', timezone: 'Europe/Berlin' },
  ],
  AU: [
    { label: 'Sydney, NSW', timezone: 'Australia/Sydney' },
    { label: 'Canberra, ACT', timezone: 'Australia/Sydney' },
    { label: 'Melbourne, VIC', timezone: 'Australia/Melbourne' },
    { label: 'Brisbane, QLD', timezone: 'Australia/Brisbane' },
    { label: 'Gold Coast, QLD', timezone: 'Australia/Brisbane' },
    { label: 'Cairns, QLD', timezone: 'Australia/Brisbane' },
    { label: 'Adelaide, SA', timezone: 'Australia/Adelaide' },
    { label: 'Perth, WA', timezone: 'Australia/Perth' },
    { label: 'Hobart, TAS', timezone: 'Australia/Hobart' },
    { label: 'Darwin, NT', timezone: 'Australia/Darwin' },
  ],
  NZ: [
    { label: 'Auckland', timezone: 'Pacific/Auckland' },
    { label: 'Wellington', timezone: 'Pacific/Auckland' },
    { label: 'Christchurch', timezone: 'Pacific/Auckland' },
    { label: 'Hamilton', timezone: 'Pacific/Auckland' },
    { label: 'Tauranga', timezone: 'Pacific/Auckland' },
    { label: 'Dunedin', timezone: 'Pacific/Auckland' },
    { label: 'Queenstown', timezone: 'Pacific/Auckland' },
  ],
  SG: [
    { label: '싱가포르 / Singapore', timezone: 'Asia/Singapore' },
  ],
  IN: [
    { label: 'Mumbai', timezone: 'Asia/Kolkata' },
    { label: 'Delhi', timezone: 'Asia/Kolkata' },
    { label: 'Bengaluru', timezone: 'Asia/Kolkata' },
    { label: 'Hyderabad', timezone: 'Asia/Kolkata' },
    { label: 'Chennai', timezone: 'Asia/Kolkata' },
    { label: 'Kolkata', timezone: 'Asia/Kolkata' },
    { label: 'Pune', timezone: 'Asia/Kolkata' },
    { label: 'Ahmedabad', timezone: 'Asia/Kolkata' },
    { label: 'Jaipur', timezone: 'Asia/Kolkata' },
    { label: 'Lucknow', timezone: 'Asia/Kolkata' },
    { label: 'Chandigarh', timezone: 'Asia/Kolkata' },
    { label: 'Goa', timezone: 'Asia/Kolkata' },
  ],
  BR: [
    { label: 'São Paulo', timezone: 'America/Sao_Paulo' },
    { label: 'Rio de Janeiro', timezone: 'America/Sao_Paulo' },
    { label: 'Brasília', timezone: 'America/Sao_Paulo' },
    { label: 'Salvador', timezone: 'America/Bahia' },
    { label: 'Fortaleza', timezone: 'America/Fortaleza' },
    { label: 'Belo Horizonte', timezone: 'America/Sao_Paulo' },
    { label: 'Curitiba', timezone: 'America/Sao_Paulo' },
    { label: 'Porto Alegre', timezone: 'America/Sao_Paulo' },
    { label: 'Recife', timezone: 'America/Recife' },
    { label: 'Manaus', timezone: 'America/Manaus' },
    { label: 'Belém', timezone: 'America/Belem' },
  ],
};

interface JusoResult {
  roadAddr: string;
  roadAddrPart1: string;
  roadAddrPart2: string;
  zipNo: string;
  siNm: string;
  sggNm: string;
  emdNm: string;
}

export default function SignupPage({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations('auth');
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [timezone, setTimezone] = useState('');
  const [addressMain, setAddressMain] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [jusoQuery, setJusoQuery] = useState('');
  const [jusoResults, setJusoResults] = useState<JusoResult[]>([]);
  const [jusoSearching, setJusoSearching] = useState(false);
  const [showJusoDropdown, setShowJusoDropdown] = useState(false);
  const [signupDone, setSignupDone] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!signupDone) return;
    setCountdown(3);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push(`/${locale}/login?email=${encodeURIComponent(signupEmail)}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [signupDone]);

  const isKoreanAddressSelected = country === 'KR' && Boolean(addressMain);

  const handleCheckEmail = async () => {
    if (!email || !email.includes('@')) {
      setEmailStatus('idle');
      return;
    }
    setEmailStatus('checking');
    setError('');
    try {
      const res = await fetch(`/api/check-email?email=${encodeURIComponent(email)}`);
      if (!res.ok) {
        setEmailStatus('idle');
        setError('이메일 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
        return;
      }
      const { available } = await res.json();
      setEmailStatus(available ? 'available' : 'taken');
    } catch {
      setEmailStatus('idle');
      setError('이메일 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    }
  };

  const handleCountryChange = (code: string) => {
    setCountry(code);
    setJusoQuery('');
    setJusoResults([]);
    setShowJusoDropdown(false);
    setAddressMain('');
    setAddressDetail('');
    setPostalCode('');
    if (code === 'KR') {
      setCity('');
      setTimezone('Asia/Seoul');
    } else {
      const cities = COUNTRY_CITIES[code];
      if (cities && cities.length > 0) {
        setCity(cities[0].label);
        setTimezone(cities[0].timezone);
      } else {
        setCity('');
        setTimezone('');
      }
    }
  };

  const handleCityChange = (label: string) => {
    setCity(label);
    const cities = COUNTRY_CITIES[country] || [];
    const found = cities.find((c) => c.label === label);
    if (found) setTimezone(found.timezone);
  };

  const handleJusoSelect = (item: JusoResult) => {
    setAddressMain(item.roadAddrPart1);
    setAddressDetail('');
    setPostalCode(item.zipNo);
    setCity(item.siNm);
    setTimezone('Asia/Seoul');
    setJusoQuery(item.roadAddr);
    setShowJusoDropdown(false);
    setJusoResults([]);
  };

  const handleJusoSearch = async () => {
    if (country !== 'KR') {
      return;
    }

    const trimmed = jusoQuery.trim();
    if (trimmed.length < 2) {
      setJusoResults([]);
      setShowJusoDropdown(false);
      setError('주소 검색어를 2글자 이상 입력해 주세요.');
      return;
    }

    setError('');
    setAddressMain('');
    setAddressDetail('');
    setPostalCode('');
    setCity('');
    setJusoSearching(true);

    try {
      const res = await fetch(`/api/juso-search?keyword=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      const items: JusoResult[] = data?.results?.juso ?? [];
      setJusoResults(items);
      setShowJusoDropdown(items.length > 0);
      if (items.length === 0) {
        setError('검색 결과가 없습니다.');
      }
    } catch {
      setJusoResults([]);
      setShowJusoDropdown(false);
      setError('주소 검색 중 오류가 발생했습니다.');
    } finally {
      setJusoSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (emailStatus === 'taken') {
        throw new Error(t('emailTaken'));
      }
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, role, locale, country: country || undefined, timezone: timezone || undefined, addressMain: addressMain || undefined, addressDetail: addressDetail || undefined, postalCode: postalCode || undefined }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Signup failed');
      }

      setSignupEmail(email);
      setSignupDone(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (signupDone) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-8 space-y-6 text-center">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">GAM</h1>
            <LanguageSwitcher currentLocale={locale} />
          </div>
          <div className="text-5xl pt-2">✅</div>
          <h2 className="text-xl font-bold text-gray-800">{t('signupComplete')}</h2>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">{t('signupCompleteLoginMsg')}</p>
            <p className="text-base font-semibold text-blue-700 bg-blue-50 rounded-lg px-4 py-2 mt-1">{signupEmail}</p>
          </div>
          <p className="text-xs text-gray-400">{countdown}{t('signupCompleteRedirecting')}</p>
          <button
            onClick={() => router.push(`/${locale}/login?email=${encodeURIComponent(signupEmail)}`)}
            className="w-full bg-blue-600 text-white rounded-lg px-4 py-3 font-medium hover:bg-blue-700 transition"
          >
            {t('goToLogin')}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">GAM</h1>
          <LanguageSwitcher currentLocale={locale} />
        </div>
        <p className="text-gray-500 text-sm -mt-3">{t('signup')}</p>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder={t('name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder={t('email')}
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailStatus('idle'); }}
                required
                className={`flex-1 border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  emailStatus === 'taken' ? 'border-red-400' : emailStatus === 'available' ? 'border-green-400' : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                onClick={handleCheckEmail}
                disabled={emailStatus === 'checking' || !email.includes('@')}
                className="shrink-0 rounded-lg border border-gray-300 px-3 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {emailStatus === 'checking' ? '...' : t('checkEmailBtn')}
              </button>
            </div>
            {emailStatus === 'available' && (
              <p className="mt-1 text-xs text-green-600">✓ {t('emailAvailable')}</p>
            )}
            {emailStatus === 'taken' && (
              <p className="mt-1 text-xs text-red-500">✗ {t('emailTaken')}</p>
            )}
            {emailStatus === 'idle' && email.includes('@') && (
              <p className="mt-1 text-xs text-gray-400">{t('emailCheckRequired')}</p>
            )}
          </div>
          <input
            type="password"
            placeholder={t('password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
                role === 'student'
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t('roleStudent')}
            </button>
            <button
              type="button"
              onClick={() => setRole('teacher')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
                role === 'teacher'
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t('roleTeacher')}
            </button>
          </div>

          {/* Country & City (Timezone) */}
          <select
            value={country}
            onChange={(e) => handleCountryChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">{t('countryLabel')}</option>
            <option value="KR">🇰🇷 한국</option>
            <option value="JP">🇯🇵 日本</option>
            <option value="CN">🇨🇳 中国</option>
            <option value="TW">🇹🇼 台灣</option>
            <option value="HK">🇭🇰 香港</option>
            <option value="US">🇺🇸 United States</option>
            <option value="CA">🇨🇦 Canada</option>
            <option value="GB">🇬🇧 United Kingdom</option>
            <option value="FR">🇫🇷 France</option>
            <option value="DE">🇩🇪 Deutschland</option>
            <option value="AU">🇦🇺 Australia</option>
            <option value="NZ">🇳🇿 New Zealand</option>
            <option value="SG">🇸🇬 Singapore</option>
            <option value="IN">🇮🇳 India</option>
            <option value="BR">🇧🇷 Brasil</option>
          </select>

          {country === 'KR' ? (
            <div className="space-y-2">
              <div className="relative">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="도로명·건물명으로 주소 검색"
                    value={jusoQuery}
                    onChange={(e) => {
                      setJusoQuery(e.target.value);
                      setShowJusoDropdown(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleJusoSearch();
                      }
                    }}
                    autoComplete="off"
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleJusoSearch}
                    disabled={jusoSearching}
                    className="shrink-0 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    {jusoSearching ? '검색 중' : '검색'}
                  </button>
                </div>
                {showJusoDropdown && (
                  <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {jusoResults.map((item, i) => (
                      <li
                        key={i}
                        onMouseDown={() => handleJusoSelect(item)}
                        className="px-4 py-2.5 text-sm hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-800">{item.roadAddrPart1}</div>
                        <div className="text-gray-400 text-xs mt-0.5">
                          {item.roadAddrPart2}{item.roadAddrPart2 ? ' · ' : ''}{item.zipNo}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <input
                type="text"
                value={addressMain}
                readOnly
                placeholder={t('addressSearchPlaceholder')}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm bg-gray-50 text-gray-700"
              />
              <input
                type="text"
                placeholder={t('addressDetailPlaceholder')}
                value={addressDetail}
                onChange={(e) => setAddressDetail(e.target.value)}
                disabled={!isKoreanAddressSelected}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
              />
              <input
                type="text"
                value={postalCode}
                readOnly
                placeholder={t('postalCode')}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm bg-gray-50 text-gray-500"
              />
            </div>
          ) : (
            <>
              {country && COUNTRY_CITIES[country] && (
                <select
                  value={city}
                  onChange={(e) => handleCityChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {COUNTRY_CITIES[country].map((c) => (
                    <option key={c.timezone + c.label} value={c.label}>
                      {c.label}
                    </option>
                  ))}
                </select>
              )}
              <input
                type="text"
                placeholder={t('addressSearchPlaceholder')}
                value={addressMain}
                onChange={(e) => setAddressMain(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder={t('addressDetailPlaceholder')}
                value={addressDetail}
                onChange={(e) => setAddressDetail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder={t('postalCode')}
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </>
          )}

          <button
            type="submit"
            disabled={loading || emailStatus !== 'available'}
            className="w-full bg-blue-600 text-white rounded-lg px-4 py-3 font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '...' : t('signup')}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          {t('haveAccount')}{' '}
          <Link href={`/${locale}/login`} className="text-blue-600 hover:underline">
            {t('login')}
          </Link>
        </p>
      </div>
    </main>
  );
}
