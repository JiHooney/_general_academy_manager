import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { StudiosService } from './studios.service';
import { CreateStudioDto } from './dto/create-studio.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('studios')
@ApiBearerAuth()
@Controller('studios')
export class StudiosController {
  constructor(private studiosService: StudiosService) {}

  @Post()
  @ApiOperation({ summary: 'Create a studio' })
  create(@Body() dto: CreateStudioDto, @CurrentUser() user: User) {
    return this.studiosService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List studios for current user' })
  findAll(@CurrentUser() user: User) {
    return this.studiosService.findAll(user.id);
  }

  @Get(':studioId')
  @ApiOperation({ summary: 'Get a single studio' })
  findOne(@Param('studioId') studioId: string) {
    return this.studiosService.findOne(studioId);
  }
}

