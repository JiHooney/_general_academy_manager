import { Controller, Patch, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AppointmentsService, UpdateAppointmentDto, DeleteAppointmentDto } from './appointments.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('appointments')
@ApiBearerAuth()
@Controller('appointments')
export class AppointmentsController {
  constructor(private appointmentsService: AppointmentsService) {}

  @Patch(':appointmentId')
  @ApiOperation({ summary: 'Update an appointment' })
  update(
    @Param('appointmentId') appointmentId: string,
    @Body() dto: UpdateAppointmentDto,
    @CurrentUser() user: User,
  ) {
    return this.appointmentsService.update(appointmentId, dto, user.id);
  }

  @Delete(':appointmentId')
  @ApiOperation({ summary: 'Cancel (soft-delete) an appointment' })
  remove(
    @Param('appointmentId') appointmentId: string,
    @Body() dto: DeleteAppointmentDto,
    @CurrentUser() user: User,
  ) {
    return this.appointmentsService.remove(appointmentId, user.id, dto.reason);
  }
}
