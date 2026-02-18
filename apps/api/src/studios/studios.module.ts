import { Module } from '@nestjs/common';
import { StudiosService } from './studios.service';
import { StudiosController } from './studios.controller';
import { OrganizationsController } from './organizations.controller';

@Module({
  controllers: [StudiosController, OrganizationsController],
  providers: [StudiosService],
})
export class StudiosModule {}
