import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignupDto {
  @ApiProperty({ example: 'teacher@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @ApiProperty({ example: 'Demo Teacher' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name: string;

  @ApiProperty({ example: 'Asia/Seoul', required: false })
  @IsOptional()
  @IsString()
  timezone?: string = 'UTC';

  @ApiProperty({ example: 'ko', required: false, enum: ['ko', 'en', 'ja', 'zh-Hant', 'zh-Hans', 'fr'] })
  @IsOptional()
  @IsString()
  locale?: string = 'en';

  @ApiProperty({ example: 'student', required: false, enum: ['student', 'teacher'] })
  @IsOptional()
  @IsIn(['student', 'teacher'])
  role?: 'student' | 'teacher' = 'student';
}

export class LoginDto {
  @ApiProperty({ example: 'teacher@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(1)
  password: string;
}
