import { Injectable, Logger } from '@nestjs/common';
import { OAuth2Client, TokenPayload } from 'google-auth-library';

export interface GoogleUserInfo {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  locale?: string;
}

export interface GooglePeopleData {
  phoneE164?: string;
  country?: string;
  addressMain?: string;
  addressDetail?: string;
  postalCode?: string;
}

@Injectable()
export class GoogleOAuthService {
  private readonly logger = new Logger(GoogleOAuthService.name);
  private readonly client: OAuth2Client;

  constructor() {
    this.client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALLBACK_URL,
    );
  }

  /** Build the Google OAuth consent URL */
  buildAuthUrl(state: string): string {
    return this.client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'openid',
        'email',
        'profile',
        'https://www.googleapis.com/auth/user.phonenumbers.read',
        'https://www.googleapis.com/auth/user.addresses.read',
      ],
      state,
      prompt: 'consent',
    });
  }

  /** Exchange authorization code for tokens and return user info */
  async exchangeCode(code: string): Promise<{
    userInfo: GoogleUserInfo;
    accessToken: string;
  }> {
    const { tokens } = await this.client.getToken(code);
    this.client.setCredentials(tokens);

    const ticket = await this.client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload() as TokenPayload;

    return {
      userInfo: {
        sub: payload.sub,
        email: payload.email!,
        name: payload.name || payload.email!.split('@')[0],
        picture: payload.picture,
        locale: payload.locale,
      },
      accessToken: tokens.access_token!,
    };
  }

  /** Verify a standalone ID token (used for mobile code exchange) */
  async verifyIdToken(idToken: string): Promise<GoogleUserInfo> {
    const ticket = await this.client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload() as TokenPayload;

    return {
      sub: payload.sub,
      email: payload.email!,
      name: payload.name || payload.email!.split('@')[0],
      picture: payload.picture,
      locale: payload.locale,
    };
  }

  /** Fetch phone & address from Google People API (best-effort) */
  async fetchPeopleData(googleAccessToken: string): Promise<GooglePeopleData> {
    const result: GooglePeopleData = {};

    try {
      const url =
        'https://people.googleapis.com/v1/people/me?personFields=phoneNumbers,addresses';
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${googleAccessToken}` },
      });

      if (!res.ok) {
        this.logger.warn(`People API returned ${res.status}`);
        return result;
      }

      const data = await res.json();

      // Phone
      const phone = data.phoneNumbers?.[0];
      if (phone?.canonicalForm) {
        result.phoneE164 = phone.canonicalForm;
      }

      // Address
      const addr = data.addresses?.[0];
      if (addr) {
        result.country = addr.countryCode || undefined;
        result.postalCode = addr.postalCode || undefined;
        // Build a single address line from structured parts
        const parts = [
          addr.streetAddress,
          addr.extendedAddress,
          addr.city,
          addr.region,
        ].filter(Boolean);
        if (parts.length) {
          result.addressMain = parts.join(', ');
        }
      }
    } catch (err) {
      this.logger.warn('People API fetch failed', (err as Error).message);
    }

    return result;
  }
}
