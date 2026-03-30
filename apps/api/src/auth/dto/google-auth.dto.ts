import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** Mobile sends the authorization code obtained via expo-auth-session */
export class GoogleMobileExchangeDto {
  @ApiProperty({ description: 'Authorization code from Google OAuth' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Locale preference', required: false, example: 'ko' })
  @IsOptional()
  @IsString()
  locale?: string;
}
