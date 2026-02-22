import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStudioDto {
  @ApiProperty({ example: 'My Studio' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;
}
