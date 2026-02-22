import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudioDto } from './dto/create-studio.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class StudiosService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateStudioDto, userId: string) {
    const studio = await this.prisma.studio.create({
      data: {
        name: dto.name,
        organizationId: dto.organizationId,
        createdBy: userId,
      },
    });
    // 생성자는 자동으로 teacher 멤버로 추가
    await (this.prisma as any).studioMembership.upsert({
      where: { studioId_userId: { studioId: studio.id, userId } },
      update: {},
      create: { studioId: studio.id, userId, role: 'teacher' },
    });
    return studio;
  }

  findAll(userId: string, role?: string) {
    if (role === 'teacher' || role === 'admin') {
      // 선생님: 자신이 소유한 조직의 스튜디오 + 멤버인 스튜디오
      return this.prisma.studio.findMany({
        where: {
          OR: [
            { organization: { ownerUserId: userId } },
            { memberships: { some: { userId } } },
          ],
        },
        include: { organization: true },
        orderBy: { createdAt: 'desc' },
      });
    }
    // 학생: 멤버십이 있는 스튜디오만
    return this.prisma.studio.findMany({
      where: { memberships: { some: { userId } } },
      include: { organization: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOrganizations(userId: string) {
    // 소유한 조직 + 소속 스튜디오가 있는 조직 모두 반환
    return this.prisma.organization.findMany({
      where: {
        OR: [
          { ownerUserId: userId },
          { studios: { some: { memberships: { some: { userId } } } } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createOrganization(name: string, userId: string) {
    // 구독 여부 확인: trialEndsAt > now 이거나 admin
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ForbiddenException('User not found');
    if (user.role !== 'admin') {
      const isTrialActive = user.trialEndsAt && user.trialEndsAt > new Date();
      if (!isTrialActive) {
        throw new ForbiddenException('조직을 생성하려면 활성 구독 또는 무료 체험이 필요합니다');
      }
    }
    return this.prisma.organization.create({
      data: { name, ownerUserId: userId },
    });
  }

  async findOne(id: string) {
    const studio = await this.prisma.studio.findUnique({
      where: { id },
      include: { organization: true, classrooms: true },
    });
    if (!studio) throw new NotFoundException('Studio not found');
    return studio;
  }

  /** 스튜디오 초대코드 생성 (선생님/오너만) */
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
    if (invite.expiresAt && new Date() > invite.expiresAt) throw new BadRequestException('초대 코드가 만료되었습니다');
    if (invite.maxUses && invite.usedCount >= invite.maxUses) throw new BadRequestException('초대 코드 사용 한도를 초과했습니다');

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
