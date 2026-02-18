import { Controller, Get, Post, Body, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';
import { StudiosService } from './studios.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

class CreateOrganizationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name: string;
}

@ApiTags('organizations')
@ApiBearerAuth()
@Controller('organizations')
export class OrganizationsController {
  constructor(private studiosService: StudiosService) {}

  @Get()
  @ApiOperation({ summary: 'List organizations owned by current user' })
  findAll(@CurrentUser() user: User) {
    return this.studiosService.findOrganizations(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new organization (teacher only)' })
  create(
    @Body() dto: CreateOrganizationDto,
    @CurrentUser() user: User,
  ) {
    const role = (user as any).role;
    if (role !== 'teacher' && role !== 'admin') {
      throw new ForbiddenException('Only teachers can create organizations');
    }
    return this.studiosService.createOrganization(dto.name, user.id);
  }
}
