import { IsString, MinLength, MaxLength, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStudioDto {
  @ApiProperty({ example: 'Main Studio' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'uuid-of-org' })
  @IsUUID()
  organizationId: string;
}
