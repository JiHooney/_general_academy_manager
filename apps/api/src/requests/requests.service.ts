import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { QueueService } from '../queue/queue.service';
import { ERROR_CODES } from '@gam/shared';
import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookingRequestDto {
  @ApiPropertyOptional() @IsUUID() @IsOptional() requestedTeacherId?: string;
  @ApiProperty() @IsDateString() startAt: string;
  @ApiProperty() @IsDateString() endAt: string;
  @ApiPropertyOptional() @IsString() @IsOptional() message?: string;
}

export class UpdateBookingRequestDto {
  @ApiPropertyOptional() @IsDateString() @IsOptional() startAt?: string;
  @ApiPropertyOptional() @IsDateString() @IsOptional() endAt?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() message?: string;
}

@Injectable()
export class RequestsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private queue: QueueService,
  ) {}

  async create(classroomId: string, dto: CreateBookingRequestDto, studentId: string) {
    const request = await this.prisma.bookingRequest.create({
      data: {
        classroomId,
        studentId,
        requestedTeacherId: dto.requestedTeacherId,
        startAt: new Date(dto.startAt),
        endAt: new Date(dto.endAt),
        message: dto.message,
        status: 'pending',
      },
    });

    // Notify teacher(s)
    if (dto.requestedTeacherId) {
      await this.notifications.create(dto.requestedTeacherId, 'booking_request', {
        requestId: request.id,
        classroomId,
        studentId,
        startAt: dto.startAt,
        endAt: dto.endAt,
      });
      await this.queue.enqueueNotification({
        type: 'booking_request',
        userId: dto.requestedTeacherId,
        payload: { requestId: request.id },
      });
    } else {
      // Notify all teachers in classroom
      const teachers = await this.prisma.classroomMembership.findMany({
        where: { classroomId, roleInClassroom: { in: ['teacher', 'admin'] }, status: 'active' },
      });
      await Promise.all(
        teachers.map((t) =>
          this.notifications.create(t.userId, 'booking_request', {
            requestId: request.id,
            classroomId,
          }),
        ),
      );
    }

    return request;
  }

  findByClassroom(classroomId: string, status?: string) {
    return this.prisma.bookingRequest.findMany({
      where: { classroomId, ...(status ? { status } : {}) },
      include: {
        student: { select: { id: true, name: true, email: true } },
        requestedTeacher: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async accept(requestId: string, teacherId: string) {
    const req = await this.prisma.bookingRequest.findUnique({ where: { id: requestId } });
    if (!req) throw new NotFoundException('Request not found');
    if (req.status !== 'pending') throw new ForbiddenException('Request is not pending');

    // Conflict check in transaction
    return this.prisma.$transaction(async (tx) => {
      const conflict = await tx.appointment.findFirst({
        where: {
          teacherId,
          status: 'confirmed',
          startAt: { lt: req.endAt },
          endAt: { gt: req.startAt },
        },
      });

      if (conflict) {
        throw new ConflictException({
          message: ERROR_CODES.SCHEDULE_CONFLICT,
          code: ERROR_CODES.SCHEDULE_CONFLICT,
        });
      }

      const [updatedRequest, appointment] = await Promise.all([
        tx.bookingRequest.update({
          where: { id: requestId },
          data: { status: 'accepted', respondedAt: new Date() },
        }),
        tx.appointment.create({
          data: {
            classroomId: req.classroomId,
            teacherId,
            studentId: req.studentId,
            startAt: req.startAt,
            endAt: req.endAt,
            status: 'confirmed',
          },
        }),
      ]);

      await this.notifications.create(req.studentId, 'booking_accepted', {
        requestId,
        appointmentId: appointment.id,
      });
      await this.queue.enqueueNotification({
        type: 'booking_accepted',
        userId: req.studentId,
        payload: { appointmentId: appointment.id },
      });

      return { request: updatedRequest, appointment };
    });
  }

  async reject(requestId: string, teacherId: string) {
    const req = await this.prisma.bookingRequest.findUnique({ where: { id: requestId } });
    if (!req) throw new NotFoundException('Request not found');
    if (req.status !== 'pending') throw new ForbiddenException('Request is not pending');

    const updated = await this.prisma.bookingRequest.update({
      where: { id: requestId },
      data: { status: 'rejected', respondedAt: new Date() },
    });

    await this.notifications.create(req.studentId, 'booking_rejected', { requestId });
    return updated;
  }

  async cancel(requestId: string, userId: string) {
    const req = await this.prisma.bookingRequest.findUnique({ where: { id: requestId } });
    if (!req) throw new NotFoundException('Request not found');
    if (req.studentId !== userId) throw new ForbiddenException();

    return this.prisma.bookingRequest.update({
      where: { id: requestId },
      data: { status: 'canceled', respondedAt: new Date() },
    });
  }

  async update(requestId: string, userId: string, dto: UpdateBookingRequestDto) {
    const req = await this.prisma.bookingRequest.findUnique({ where: { id: requestId } });
    if (!req) throw new NotFoundException('Request not found');
    if (req.studentId !== userId) throw new ForbiddenException();
    if (req.status !== 'pending') throw new ForbiddenException('Only pending requests can be edited');

    return this.prisma.bookingRequest.update({
      where: { id: requestId },
      data: {
        ...(dto.startAt ? { startAt: new Date(dto.startAt) } : {}),
        ...(dto.endAt ? { endAt: new Date(dto.endAt) } : {}),
        ...(dto.message !== undefined ? { message: dto.message } : {}),
      },
    });
  }

  findPendingForTeacher(teacherId: string) {
    return this.prisma.bookingRequest.findMany({
      where: {
        status: 'pending',
        OR: [
          { requestedTeacherId: teacherId },
          {
            requestedTeacherId: null,
            classroom: {
              memberships: { some: { userId: teacherId, roleInClassroom: { in: ['teacher', 'admin'] }, status: 'active' } },
            },
          },
        ],
      },
      include: {
        student: { select: { id: true, name: true, email: true } },
        classroom: { select: { id: true, name: true } },
      },
      orderBy: { startAt: 'asc' },
    });
  }
}
