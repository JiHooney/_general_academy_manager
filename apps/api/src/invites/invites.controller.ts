import { Controller, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InvitesService } from './invites.service';
import { CreateInviteDto, JoinInviteDto } from './dto/invite.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('invites')
@ApiBearerAuth()
@Controller()
export class InvitesController {
  constructor(private invitesService: InvitesService) {}

  @Post('classrooms/:classroomId/invites')
  @ApiOperation({ summary: 'Create an invite code for a classroom' })
  create(
    @Param('classroomId') classroomId: string,
    @Body() dto: CreateInviteDto,
    @CurrentUser() user: User,
  ) {
    return this.invitesService.create(classroomId, dto, user.id);
  }

  @Post('invites/join')
  @ApiOperation({ summary: 'Join a classroom using an invite code' })
  join(@Body() dto: JoinInviteDto, @CurrentUser() user: User) {
    return this.invitesService.join(dto, user.id);
  }

  @Post('classrooms/:classroomId/invites/:inviteId/revoke')
  @ApiOperation({ summary: 'Revoke an invite code' })
  revoke(
    @Param('classroomId') classroomId: string,
    @Param('inviteId') inviteId: string,
    @CurrentUser() user: User,
  ) {
    return this.invitesService.revoke(classroomId, inviteId, user.id);
  }
}
