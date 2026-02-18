import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';
import { StudiosService } from './studios.service';
import { CreateStudioDto } from './dto/create-studio.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

class JoinStudioDto {
  @IsString() @MinLength(1) @MaxLength(20) code: string;
}

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
    return this.studiosService.findAll(user.id, (user as any).role);
  }

  @Get(':studioId')
  @ApiOperation({ summary: 'Get a single studio' })
  findOne(@Param('studioId') studioId: string) {
    return this.studiosService.findOne(studioId);
  }

  @Post(':studioId/invites')
  @ApiOperation({ summary: 'Generate an invite code for a studio (teacher only)' })
  createInvite(@Param('studioId') studioId: string, @CurrentUser() user: User) {
    return this.studiosService.createInviteCode(studioId, user.id);
  }

  @Get(':studioId/invites')
  @ApiOperation({ summary: 'List invite codes for a studio' })
  listInvites(@Param('studioId') studioId: string) {
    return this.studiosService.getInviteCodes(studioId);
  }

  @Post('join')
  @ApiOperation({ summary: 'Join a studio by invite code' })
  join(@Body() dto: JoinStudioDto, @CurrentUser() user: User) {
    return this.studiosService.joinByInvite(dto.code, user.id);
  }
}

