import { Injectable, Logger, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';
import {
  GoogleOAuthService,
  GoogleUserInfo,
  GooglePeopleData,
} from './google-oauth.service';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@gam/shared';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

// Map Google locale tag → SUPPORTED_LOCALES
function normalizeLocale(googleLocale?: string, fallback?: string): string {
  if (!googleLocale) return fallback || DEFAULT_LOCALE;
  const tag = googleLocale.toLowerCase().replace('_', '-');
  // Exact match first
  if ((SUPPORTED_LOCALES as readonly string[]).includes(tag)) return tag;
  // zh-tw → zh-Hant, zh-cn → zh-Hans
  if (tag.startsWith('zh-tw') || tag.startsWith('zh-hant')) return 'zh-Hant';
  if (tag.startsWith('zh-cn') || tag.startsWith('zh-hans') || tag === 'zh') return 'zh-Hans';
  // Prefix match (e.g. "ja-JP" → "ja", "ko-KR" → "ko")
  const prefix = tag.split('-')[0];
  if ((SUPPORTED_LOCALES as readonly string[]).includes(prefix)) return prefix;
  return fallback || DEFAULT_LOCALE;
}

// Map country code → IANA timezone (best-effort)
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

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private googleOAuth: GoogleOAuthService,
  ) {}

  // ── Email/Password Auth ──────────────────────────────────────────────

  async signup(dto: {
    email: string;
    password: string;
    name: string;
    role: 'student' | 'teacher';
    locale?: string;
    country?: string;
    timezone?: string;
    addressMain?: string;
    addressDetail?: string;
    postalCode?: string;
  }) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        role: dto.role,
        authProvider: 'email',
        locale: dto.locale || DEFAULT_LOCALE,
        country: dto.country || null,
        timezone: dto.timezone || (dto.country ? COUNTRY_TIMEZONE[dto.country] || 'UTC' : 'UTC'),
        addressMain: dto.addressMain || null,
        addressDetail: dto.addressDetail || null,
        postalCode: dto.postalCode || null,
      },
    });
    return this.stripSensitive(user);
  }

  async checkEmailAvailability(email: string): Promise<{ available: boolean }> {
    if (!email) return { available: false };
    const existing = await this.prisma.user.findUnique({ where: { email } });
    return { available: !existing };
  }

  async forgotPassword(email: string): Promise<{ sent: boolean }> {
    if (!email) return { sent: false };
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { sent: false };
    // TODO: send password reset email when email service is configured
    return { sent: true };
  }

  async findEmail(nameOrEmail: string): Promise<{ emails: string[] }> {
    if (!nameOrEmail || nameOrEmail.trim().length < 1) return { emails: [] };
    const term = nameOrEmail.trim();
    const users = await this.prisma.user.findMany({
      where: { email: { equals: term, mode: 'insensitive' } },
      select: { email: true },
    });
    const emails = users.map((u) => {
      const [local, domain] = u.email.split('@');
      const visible = local.slice(0, Math.min(2, local.length));
      const masked = visible + '*'.repeat(Math.max(1, local.length - 2));
      return `${masked}@${domain}`;
    });
    return { emails };
  }

  async login(email: string, password: string, res: Response) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid email or password');

    const tokens = this._issueTokens(user.id, user.email, res);
    return { ...tokens, user: this.stripSensitive(user) };
  }

  // ── Google OAuth ─────────────────────────────────────────────────────

  /** Build Google consent URL for web redirect */
  buildGoogleAuthUrl(locale: string, platform: string): string {
    const state = JSON.stringify({ locale, platform });
    return this.googleOAuth.buildAuthUrl(state);
  }

  /** Handle web callback: exchange code → upsert user → issue JWT */
  async handleGoogleCallback(
    code: string,
    stateRaw: string,
    res: Response,
  ): Promise<{ locale: string; needsOnboarding: boolean }> {
    const { locale: stateLocale } = JSON.parse(stateRaw || '{}');

    const { userInfo, accessToken: googleAccessToken } =
      await this.googleOAuth.exchangeCode(code);

    const peopleData = await this.googleOAuth.fetchPeopleData(googleAccessToken);

    const { user, isNew } = await this.upsertGoogleUser(
      userInfo,
      peopleData,
      stateLocale,
    );

    await this._issueTokens(user.id, user.email, res);

    const locale = user.locale || normalizeLocale(userInfo.locale, stateLocale);
    const needsOnboarding = isNew && (!user.country || !user.timezone || user.timezone === 'UTC');

    return { locale, needsOnboarding };
  }

  /** Handle mobile code exchange */
  async handleMobileGoogleExchange(
    code: string,
    locale?: string,
    res?: Response,
  ) {
    const { userInfo, accessToken: googleAccessToken } =
      await this.googleOAuth.exchangeCode(code);

    const peopleData = await this.googleOAuth.fetchPeopleData(googleAccessToken);

    const { user, isNew } = await this.upsertGoogleUser(
      userInfo,
      peopleData,
      locale,
    );

    // For mobile we still set cookies (ignored) but also return tokens in body
    const tokens = this._issueTokens(user.id, user.email, res);

    const needsOnboarding = isNew && (!user.country || !user.timezone || user.timezone === 'UTC');

    return { ...tokens, needsOnboarding, user: this.stripSensitive(user) };
  }

  // ── User upsert ─────────────────────────────────────────────────────

  private async upsertGoogleUser(
    info: GoogleUserInfo,
    people: GooglePeopleData,
    requestLocale?: string,
  ): Promise<{ user: any; isNew: boolean }> {
    // 1) Find by googleSub first, then by email
    let user = await this.prisma.user.findUnique({
      where: { googleSub: info.sub },
    });

    if (user) {
      // Returning user — update picture & name if changed
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          pictureUrl: info.picture,
          name: info.name || user.name,
        },
      });
      return { user, isNew: false };
    }

    // Check if email already exists (legacy migration edge case)
    user = await this.prisma.user.findUnique({
      where: { email: info.email },
    });

    if (user) {
      // Link Google to existing account
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleSub: info.sub,
          authProvider: 'google',
          pictureUrl: info.picture,
          passwordHash: null,
        },
      });
      return { user, isNew: false };
    }

    // 2) Brand new user
    const locale = normalizeLocale(info.locale, requestLocale);
    const country = people.country || undefined;
    const timezone = country
      ? COUNTRY_TIMEZONE[country] || 'UTC'
      : 'UTC';

    user = await this.prisma.user.create({
      data: {
        email: info.email,
        name: info.name,
        googleSub: info.sub,
        authProvider: 'google',
        pictureUrl: info.picture,
        locale,
        timezone,
        country: country || null,
        addressMain: people.addressMain || null,
        addressDetail: people.addressDetail || null,
        postalCode: people.postalCode || null,
        phoneE164: people.phoneE164 || null,
      },
    });
    return { user, isNew: true };
  }

  // ── Existing endpoints (kept) ────────────────────────────────────────

  async refresh(userId: string, email: string, res: Response) {
    return this._issueTokens(userId, email, res);
  }

  logout(res: Response) {
    res.clearCookie('accessToken', COOKIE_OPTS);
    res.clearCookie('refreshToken', COOKIE_OPTS);
    return { message: 'Logged out' };
  }

  async updateMe(
    userId: string,
    dto: {
      locale?: string;
      timezone?: string;
      name?: string;
      country?: string;
      addressMain?: string;
      addressDetail?: string;
      postalCode?: string;
    },
  ) {
    const data: Record<string, unknown> = {};
    if (dto.locale) data.locale = dto.locale;
    if (dto.timezone) data.timezone = dto.timezone;
    if (dto.name) data.name = dto.name;
    if (dto.country) data.country = dto.country;
    if (dto.addressMain !== undefined) data.addressMain = dto.addressMain;
    if (dto.addressDetail !== undefined) data.addressDetail = dto.addressDetail;
    if (dto.postalCode !== undefined) data.postalCode = dto.postalCode;

    const user = await this.prisma.user.update({ where: { id: userId }, data });
    return this.stripSensitive(user);
  }

  // ── Helpers ──────────────────────────────────────────────────────────

  _issueTokens(userId: string, email: string, res?: Response) {
    const payload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

    // Set httpOnly cookies for web clients
    if (res) {
      res.cookie('accessToken', accessToken, {
        ...COOKIE_OPTS,
        maxAge: 15 * 60 * 1000,
      });
      res.cookie('refreshToken', refreshToken, {
        ...COOKIE_OPTS,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    // Also return in body for mobile clients
    return { accessToken, refreshToken, expiresIn: 900 };
  }

  private stripSensitive(user: any) {
    const { passwordHash, ...result } = user;
    return result;
  }
}
