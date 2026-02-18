import { Module } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [NotificationsModule, QueueModule],
  controllers: [RequestsController],
  providers: [RequestsService],
})
export class RequestsModule {}
