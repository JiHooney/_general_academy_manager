import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TicketsService, CreateTicketDto, UpdateTicketDto } from './tickets.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('tickets')
@ApiBearerAuth()
@Controller()
export class TicketsController {
  constructor(private ticketsService: TicketsService) {}

  @Post('classrooms/:classroomId/tickets')
  @ApiOperation({ summary: 'Create a support ticket' })
  create(
    @Param('classroomId') classroomId: string,
    @Body() dto: CreateTicketDto,
    @CurrentUser() user: User,
  ) {
    return this.ticketsService.create(classroomId, dto, user.id);
  }

  @Get('classrooms/:classroomId/tickets')
  @ApiOperation({ summary: 'List tickets for a classroom' })
  findAll(@Param('classroomId') classroomId: string) {
    return this.ticketsService.findByClassroom(classroomId);
  }

  @Patch('tickets/:ticketId')
  @ApiOperation({ summary: 'Update a ticket status or content' })
  update(@Param('ticketId') ticketId: string, @Body() dto: UpdateTicketDto) {
    return this.ticketsService.update(ticketId, dto);
  }
}
