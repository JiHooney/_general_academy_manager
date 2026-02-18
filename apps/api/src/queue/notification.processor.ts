import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { QUEUE_NOTIFICATION } from '@gam/shared';

@Processor(QUEUE_NOTIFICATION)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  async process(job: Job) {
    this.logger.log(`Processing notification job ${job.id}: ${JSON.stringify(job.data)}`);
    // TODO: integrate real push/email provider here
    // e.g. FCM, APNS, SendGrid, etc.
    await new Promise((r) => setTimeout(r, 100)); // simulate async work
    this.logger.log(`Notification job ${job.id} processed`);
  }
}
