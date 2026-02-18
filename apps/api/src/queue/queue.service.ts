import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NOTIFICATION } from '@gam/shared';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue(QUEUE_NOTIFICATION) private notificationQueue: Queue,
  ) {}

  async enqueueNotification(data: {
    type: string;
    userId: string;
    payload: Record<string, unknown>;
  }) {
    await this.notificationQueue.add('send', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });
  }
}
