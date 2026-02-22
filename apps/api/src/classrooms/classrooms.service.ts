import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClassroomDto } from './dto/create-classroom.dto';

@Injectable()
export class ClassroomsService {
  constructor(private prisma: PrismaService) {}

  async create(studioId: string, dto: CreateClassroomDto, userId: string) {
    // verify studio exists
    const studio = await this.prisma.studio.findUnique({ where: { id: studioId } });
    if (!studio) throw new NotFoundException('Studio not found');

    // 클래스름 최대 5개 제한
    const classroomCount = await this.prisma.classroom.count({ where: { studioId } });
    if (classroomCount >= 5) {
      throw new BadRequestException('클래스룸은 스튜디오당 최대 5개까지 만들 수 있습니다');
    }

    const classroom = await this.prisma.classroom.create({
      data: {
        studioId,
        name: dto.name,
        description: dto.description,
        timezone: dto.timezone || 'UTC',
        createdBy: userId,
      },
    });

    // Auto-add creator as admin
    await this.prisma.classroomMembership.create({
      data: {
        classroomId: classroom.id,
        userId,
        roleInClassroom: 'admin',
        status: 'active',
      },
    });

    return classroom;
  }

  findByStudio(studioId: string) {
    return this.prisma.classroom.findMany({
      where: { studioId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(classroomId: string) {
    const classroom = await this.prisma.classroom.findUnique({
      where: { id: classroomId },
      include: { memberships: { include: { user: true } } },
    });
    if (!classroom) throw new NotFoundException('Classroom not found');
    return classroom;
  }

  getTeachers(classroomId: string) {
    return this.prisma.classroomMembership.findMany({
      where: {
        classroomId,
        roleInClassroom: { in: ['teacher', 'admin'] },
        status: 'active',
      },
      include: { user: true },
    });
  }
}
