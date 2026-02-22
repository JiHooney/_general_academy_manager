import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudioDto } from './dto/create-studio.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class StudiosService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateStudioDto, userId: string) {
    // 직접 생성한 스튜디오 개수 확인
    const ownedCount = await this.prisma.studio.count({ where: { createdBy: userId } });

    if (ownedCount >= 1) {
      // 2개 이상은 구독 필요
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new ForbiddenException('User not found');
      if (user.role !== 'admin' && !user.isSubscribed) {
        throw new ForbiddenException(
          '스튜디오를 2개 이상 만들려면 구독이 필요합니다. 첫 번째 스튜디오는 무료입니다.',
        );
      }
    }

    const studio = await this.prisma.studio.create({
      data: { name: dto.name, createdBy: userId },
    });

    // 생성자는 자동으로 teacher 멤버로 추가
    await (this.prisma as any).studioMembership.upsert({
      where: { studioId_userId: { studioId: studio.id, userId } },
      update: {},
      create: { studioId: studio.id, userId, role: 'teacher' },
    });

    return studio;
  }

  findAll(userId: string) {
    // 내가 만든 스튜디오 + 멤버십으로 참가한 스튜디오
    return this.prisma.studio.findMany({
      where: {
        OR: [
          { createdBy: userId },
          { memberships: { some: { userId } } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const studio = await this.prisma.studio.findUnique({
      where: { id },
      include: { classrooms: true },
    });
    if (!studio) throw new NotFoundException('Studio not found');
    return studio;
  }

  /** 스튜디오 초대코드 생성 (teacher만) */
  async createInviteCode(studioId: string, userId: string) {
    const studio = await this.prisma.studio.findUnique({ where: { id: studioId } });
    if (!studio) throw new NotFoundException('Studio not found');

    const membership = await (this.prisma as any).studioMembership.findUnique({
      where: { studioId_userId: { studioId, userId } },
    });
    if (!membership || membership.role !== 'teacher') {
      throw new ForbiddenException('Only studio teachers can create invite codes');
    }

    const code = randomBytes(4).toString('hex').toUpperCase();
    return (this.prisma as any).studioInviteCode.create({
      data: { studioId, code, createdBy: userId },
    });
  }

  /** 초대코드로 스튜디오 참가 */
  async joinByInvite(code: string, userId: string) {
    const invite = await (this.prisma as any).studioInviteCode.findUnique({ where: { code } });
    if (!invite) throw new NotFoundException('초대 코드를 찾을 수 없습니다');
    if (invite.isRevoked) throw new BadRequestException('만료된 초대 코드입니다');
    if (invite.expiresAt && new Date() > invite.expiresAt)
      throw new BadRequestException('초대 코드가 만료되었습니다');
    if (invite.maxUses && invite.usedCount >= invite.maxUses)
      throw new BadRequestException('초대 코드 사용 한도를 초과했습니다');

    const existing = await (this.prisma as any).studioMembership.findUnique({
      where: { studioId_userId: { studioId: invite.studioId, userId } },
    });
    if (existing) return { message: '이미 참가한 스튜디오입니다', studioId: invite.studioId };

    await (this.prisma as any).studioMembership.create({
      data: { studioId: invite.studioId, userId, role: 'student' },
    });
    await (this.prisma as any).studioInviteCode.update({
      where: { id: invite.id },
      data: { usedCount: { increment: 1 } },
    });

    return { message: '스튜디오에 참가했습니다', studioId: invite.studioId };
  }

  /** 스튜디오의 현재 유효한 초대코드 목록 */
  getInviteCodes(studioId: string) {
    return (this.prisma as any).studioInviteCode.findMany({
      where: { studioId, isRevoked: false },
      orderBy: { createdAt: 'desc' },
    });
  }
}
