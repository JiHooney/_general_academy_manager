import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAppointmentDto {
  @ApiPropertyOptional() @IsDateString() @IsOptional() startAt?: string;
  @ApiPropertyOptional() @IsDateString() @IsOptional() endAt?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() note?: string;
  @ApiPropertyOptional({ enum: ['confirmed', 'canceled', 'rescheduled'] })
  @IsEnum(['confirmed', 'canceled', 'rescheduled'])
  @IsOptional()
  status?: string;
}

export class DeleteAppointmentDto {
  @ApiPropertyOptional() @IsString() @IsOptional() reason?: string;
}

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async update(appointmentId: string, dto: UpdateAppointmentDto, userId: string) {
    const appt = await this.prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appt) throw new NotFoundException('Appointment not found');
    if (appt.teacherId !== userId && appt.studentId !== userId)
      throw new ForbiddenException();

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        ...(dto.startAt ? { startAt: new Date(dto.startAt) } : {}),
        ...(dto.endAt ? { endAt: new Date(dto.endAt) } : {}),
        ...(dto.note !== undefined ? { note: dto.note } : {}),
        ...(dto.status ? { status: dto.status } : {}),
      },
    });
  }

  async remove(appointmentId: string, userId: string, reason?: string) {
    const appt = await this.prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appt) throw new NotFoundException('Appointment not found');
    if (appt.teacherId !== userId && appt.studentId !== userId)
      throw new ForbiddenException();

    const isTeacher = appt.teacherId === userId;

    await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'canceled' },
    });

    // 선생님이 삭제할 경우 학생에게 알림 전송
    if (isTeacher) {
      await this.notifications.create(appt.studentId, 'appointment_canceled', {
        appointmentId,
        reason: reason || '선생님이 수업을 삭제했습니다.',
        startAt: appt.startAt.toISOString(),
        endAt: appt.endAt.toISOString(),
      });
    }

    return { success: true };
  }
}
