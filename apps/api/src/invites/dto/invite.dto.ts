import { IsString, IsEnum, IsOptional, IsDateString, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInviteDto {
  @ApiProperty({ enum: ['student', 'teacher'] })
  @IsEnum(['student', 'teacher'])
  type: 'student' | 'teacher';

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @IsOptional()
  maxUses?: number;
}

export class JoinInviteDto {
  @ApiProperty({ example: 'ABCD1234' })
  @IsString()
  code: string;
}
