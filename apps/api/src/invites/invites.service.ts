import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInviteDto, JoinInviteDto } from './dto/invite.dto';
import { randomBytes } from 'crypto';
import { ERROR_CODES } from '@gam/shared';

@Injectable()
export class InvitesService {
  constructor(private prisma: PrismaService) {}

  async create(classroomId: string, dto: CreateInviteDto, userId: string) {
    const code = randomBytes(4).toString('hex').toUpperCase();

    return this.prisma.inviteCode.create({
      data: {
        classroomId,
        code,
        type: dto.type,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        maxUses: dto.maxUses,
        createdBy: userId,
      },
    });
  }

  async join(dto: JoinInviteDto, userId: string) {
    const invite = await this.prisma.inviteCode.findUnique({
      where: { code: dto.code },
    });

    if (!invite) throw new NotFoundException('Invite code not found');
    if (invite.isRevoked)
      throw new BadRequestException({ code: ERROR_CODES.INVITE_REVOKED });
    if (invite.expiresAt && new Date() > invite.expiresAt)
      throw new BadRequestException({ code: ERROR_CODES.INVITE_EXPIRED });
    if (invite.maxUses && invite.usedCount >= invite.maxUses)
      throw new BadRequestException({ code: ERROR_CODES.INVITE_MAX_USES });

    // Check if already member
    const existing = await this.prisma.classroomMembership.findUnique({
      where: { classroomId_userId: { classroomId: invite.classroomId, userId } },
    });
    if (existing && existing.status === 'active') {
      return { message: 'Already a member', classroomId: invite.classroomId };
    }

    await this.prisma.$transaction([
      this.prisma.classroomMembership.upsert({
        where: { classroomId_userId: { classroomId: invite.classroomId, userId } },
        update: { status: 'active', roleInClassroom: invite.type },
        create: {
          classroomId: invite.classroomId,
          userId,
          roleInClassroom: invite.type,
          status: 'active',
        },
      }),
      this.prisma.inviteCode.update({
        where: { id: invite.id },
        data: { usedCount: { increment: 1 } },
      }),
    ]);

    return { message: 'Joined successfully', classroomId: invite.classroomId };
  }

  async revoke(classroomId: string, inviteId: string, userId: string) {
    const invite = await this.prisma.inviteCode.findFirst({
      where: { id: inviteId, classroomId },
    });
    if (!invite) throw new NotFoundException('Invite not found');

    const membership = await this.prisma.classroomMembership.findUnique({
      where: { classroomId_userId: { classroomId, userId } },
    });
    if (!membership || !['admin', 'teacher'].includes(membership.roleInClassroom)) {
      throw new ForbiddenException();
    }

    return this.prisma.inviteCode.update({
      where: { id: inviteId },
      data: { isRevoked: true },
    });
  }
}
