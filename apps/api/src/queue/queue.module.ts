import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueService } from './queue.service';
import { NotificationProcessor } from './notification.processor';
import { QUEUE_NOTIFICATION } from '@gam/shared';

@Module({
  imports: [BullModule.registerQueue({ name: QUEUE_NOTIFICATION })],
  providers: [QueueService, NotificationProcessor],
  exports: [QueueService],
})
export class QueueModule {}
