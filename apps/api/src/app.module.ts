import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StudiosModule } from './studios/studios.module';
import { ClassroomsModule } from './classrooms/classrooms.module';
import { InvitesModule } from './invites/invites.module';
import { CalendarModule } from './calendar/calendar.module';
import { RequestsModule } from './requests/requests.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { TicketsModule } from './tickets/tickets.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    StudiosModule,
    ClassroomsModule,
    InvitesModule,
    CalendarModule,
    RequestsModule,
    AppointmentsModule,
    NotificationsModule,
    TicketsModule,
    QueueModule,
  ],
})
export class AppModule {}
