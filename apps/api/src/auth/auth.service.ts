import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { SignupDto, LoginDto } from './dto/auth.dto';
import { Response } from 'express';

const SALT_ROUNDS = 12;
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const isTeacher = dto.role === 'teacher';
    const trialEndsAt = isTeacher
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30일 무료 체험
      : null;

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        timezone: dto.timezone || 'UTC',
        locale: dto.locale || 'en',
        role: (dto.role as any) ?? 'student',
        trialEndsAt,
      },
    });

    const { passwordHash: _h, ...result } = user;
    return result;
  }

  async login(dto: LoginDto, res: Response) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this._issueTokens(user.id, user.email, res);
  }

  async refresh(userId: string, email: string, res: Response) {
    return this._issueTokens(userId, email, res);
  }

  logout(res: Response) {
    res.clearCookie('accessToken', COOKIE_OPTS);
    res.clearCookie('refreshToken', COOKIE_OPTS);
    return { message: 'Logged out' };
  }

  private _issueTokens(userId: string, email: string, res: Response) {
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
    res.cookie('accessToken', accessToken, {
      ...COOKIE_OPTS,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refreshToken', refreshToken, {
      ...COOKIE_OPTS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Also return in body for mobile clients
    return { accessToken, refreshToken, expiresIn: 900 };
  }
}
