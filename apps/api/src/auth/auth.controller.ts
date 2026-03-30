import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Query,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, MinLength, IsIn } from 'class-validator';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { GoogleMobileExchangeDto } from './dto/google-auth.dto';
import { JwtRefreshGuard } from './guards/jwt-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { User } from '@prisma/client';

export class FindEmailDto {
  @IsString() name: string;
}

export class ForgotPasswordDto {
  @IsEmail() email: string;
}

export class SignupDto {
  @IsEmail() email: string;
  @IsString() @MinLength(6) password: string;
  @IsString() name: string;
  @IsIn(['student', 'teacher']) role: 'student' | 'teacher';
  @IsOptional() @IsString() locale?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() timezone?: string;
  @IsOptional() @IsString() addressMain?: string;
  @IsOptional() @IsString() addressDetail?: string;
  @IsOptional() @IsString() postalCode?: string;
}

export class LoginDto {
  @IsEmail() email: string;
  @IsString() password: string;
}

export class UpdateMeDto {
  @IsOptional() @IsString() locale?: string;
  @IsOptional() @IsString() timezone?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() addressMain?: string;
  @IsOptional() @IsString() addressDetail?: string;
  @IsOptional() @IsString() postalCode?: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  // ── Email/Password ──────────────────────────────────────────────────

  @Public()
  @Get('check-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check if an email is already registered' })
  checkEmail(@Query('email') email: string) {
    return this.authService.checkEmailAvailability(email);
  }

  @Public()
  @Post('find-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Find registered emails by name' })
  findEmail(@Body() dto: FindEmailDto) {
    return this.authService.findEmail(dto.name);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset email' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create account with email & password' })
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email & password' })
  login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(dto.email, dto.password, res);
  }

  // ── Google OAuth: Web ───────────────────────────────────────────────

  @Public()
  @Get('google/start')
  @ApiOperation({ summary: 'Redirect to Google OAuth consent screen' })
  googleStart(
    @Query('locale') locale: string = 'ko',
    @Query('platform') platform: string = 'web',
    @Res() res: Response,
  ) {
    const url = this.authService.buildGoogleAuthUrl(locale, platform);
    res.redirect(url);
  }

  @Public()
  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth callback (web)' })
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    if (!code) throw new BadRequestException('Missing authorization code');

    try {
      const { locale, needsOnboarding } =
        await this.authService.handleGoogleCallback(code, state, res);

      const webOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
      const redirectPath = needsOnboarding
        ? `/${locale}/onboarding`
        : `/${locale}/dashboard`;

      res.redirect(`${webOrigin}${redirectPath}`);
    } catch (err) {
      this.logger.error('Google callback failed', (err as Error).stack);
      const webOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
      res.redirect(`${webOrigin}/ko/login?error=google_auth_failed`);
    }
  }

  // ── Google OAuth: Mobile ────────────────────────────────────────────

  @Public()
  @Post('google/mobile/exchange')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange Google auth code for JWT (mobile)' })
  async googleMobileExchange(
    @Body() dto: GoogleMobileExchangeDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.handleMobileGoogleExchange(
      dto.code,
      dto.locale,
      res,
    );
  }

  // ── Kept endpoints ──────────────────────────────────────────────────

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token cookie' })
  refresh(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.refresh(user.id, user.email, res);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear auth cookies' })
  logout(@Res({ passthrough: true }) res: Response) {
    return this.authService.logout(res);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  me(@CurrentUser() user: User) {
    const { passwordHash: _, ...result } = user as any;
    return result;
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  updateMe(@CurrentUser() user: User, @Body() dto: UpdateMeDto) {
    return this.authService.updateMe((user as any).id, dto);
  }
}
