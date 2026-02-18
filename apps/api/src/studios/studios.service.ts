import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudioDto } from './dto/create-studio.dto';

@Injectable()
export class StudiosService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateStudioDto, userId: string) {
    return this.prisma.studio.create({
      data: {
        name: dto.name,
        organizationId: dto.organizationId,
        createdBy: userId,
      },
    });
  }

  findAll(userId: string) {
    // Return studios belonging to user's organizations
    return this.prisma.studio.findMany({
      where: { organization: { ownerUserId: userId } },
      include: { organization: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOrganizations(userId: string) {
    return this.prisma.organization.findMany({
      where: { ownerUserId: userId },
      orderBy: { createdAt: 'desc' },
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
}
