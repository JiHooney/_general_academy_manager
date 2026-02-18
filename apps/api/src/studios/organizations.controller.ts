import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { StudiosService } from './studios.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

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
}
