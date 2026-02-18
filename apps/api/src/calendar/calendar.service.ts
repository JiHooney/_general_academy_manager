import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) {}

  async getCalendar(classroomId: string, from: string, to: string) {
    const fromDate = new Date(from);
    const toDate = new Date(to);

    const [appointments, requests] = await Promise.all([
      this.prisma.appointment.findMany({
        where: {
          classroomId,
          startAt: { gte: fromDate },
          endAt: { lte: toDate },
          status: { not: 'canceled' },
        },
        include: {
          teacher: { select: { id: true, name: true, email: true } },
          student: { select: { id: true, name: true, email: true } },
        },
        orderBy: { startAt: 'asc' },
      }),
      this.prisma.bookingRequest.findMany({
        where: {
          classroomId,
          startAt: { gte: fromDate },
          endAt: { lte: toDate },
          status: 'pending',
        },
        include: {
          student: { select: { id: true, name: true, email: true } },
          requestedTeacher: { select: { id: true, name: true, email: true } },
        },
        orderBy: { startAt: 'asc' },
      }),
    ]);

    return { appointments, pendingRequests: requests };
  }

  async recommendTeachers(classroomId: string, startAt: string, endAt: string) {
    const start = new Date(startAt);
    const end = new Date(endAt);

    // Get all teachers in the classroom
    const memberships = await this.prisma.classroomMembership.findMany({
      where: {
        classroomId,
        roleInClassroom: { in: ['teacher', 'admin'] },
        status: 'active',
      },
      include: { user: true },
    });

    // Find teachers with conflicting confirmed appointments
    const busyTeacherIds = await this.prisma.appointment
      .findMany({
        where: {
          teacherId: { in: memberships.map((m) => m.userId) },
          status: 'confirmed',
          startAt: { lt: end },
          endAt: { gt: start },
        },
        select: { teacherId: true },
      })
      .then((a) => new Set(a.map((x) => x.teacherId)));

    const available = memberships
      .filter((m) => !busyTeacherIds.has(m.userId))
      .map((m) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        timezone: m.user.timezone,
      }));

    return available;
  }

  async getMyCalendar(userId: string, from: string, to: string) {
    const fromDate = new Date(from);
    const toDate = new Date(to);

    const [appointments, pendingRequests] = await Promise.all([
      this.prisma.appointment.findMany({
        where: {
          OR: [{ teacherId: userId }, { studentId: userId }],
          startAt: { gte: fromDate },
          endAt: { lte: toDate },
          status: { not: 'canceled' },
        },
        include: {
          teacher: { select: { id: true, name: true, email: true } },
          student: { select: { id: true, name: true, email: true } },
          classroom: { select: { id: true, name: true } },
        },
        orderBy: { startAt: 'asc' },
      }),
      this.prisma.bookingRequest.findMany({
        where: {
          OR: [
            { studentId: userId },
            { requestedTeacherId: userId },
          ],
          startAt: { gte: fromDate },
          endAt: { lte: toDate },
          status: 'pending',
        },
        include: {
          student: { select: { id: true, name: true, email: true } },
          requestedTeacher: { select: { id: true, name: true, email: true } },
          classroom: { select: { id: true, name: true } },
        },
        orderBy: { startAt: 'asc' },
      }),
    ]);

    return { appointments, pendingRequests };
  }
}
