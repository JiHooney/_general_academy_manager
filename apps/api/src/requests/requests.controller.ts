import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { RequestsService, CreateBookingRequestDto, UpdateBookingRequestDto } from './requests.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('requests')
@ApiBearerAuth()
@Controller()
export class RequestsController {
  constructor(private requestsService: RequestsService) {}

  @Post('classrooms/:classroomId/requests')
  @ApiOperation({ summary: 'Submit a booking request' })
  create(
    @Param('classroomId') classroomId: string,
    @Body() dto: CreateBookingRequestDto,
    @CurrentUser() user: User,
  ) {
    return this.requestsService.create(classroomId, dto, user.id);
  }

  @Get('classrooms/:classroomId/requests')
  @ApiOperation({ summary: 'List booking requests for a classroom' })
  @ApiQuery({ name: 'status', required: false })
  findAll(@Param('classroomId') classroomId: string, @Query('status') status?: string) {
    return this.requestsService.findByClassroom(classroomId, status);
  }

  @Get('requests/pending')
  @ApiOperation({ summary: 'Get pending requests for current teacher' })
  pendingForTeacher(@CurrentUser() user: User) {
    return this.requestsService.findPendingForTeacher(user.id);
  }

  @Patch('requests/:requestId')
  @ApiOperation({ summary: 'Update a booking request (student)' })
  update(
    @Param('requestId') requestId: string,
    @Body() dto: UpdateBookingRequestDto,
    @CurrentUser() user: User,
  ) {
    return this.requestsService.update(requestId, user.id, dto);
  }

  @Post('requests/:requestId/accept')
  @ApiOperation({ summary: 'Accept a booking request (teacher)' })
  accept(@Param('requestId') requestId: string, @CurrentUser() user: User) {
    return this.requestsService.accept(requestId, user.id);
  }

  @Post('requests/:requestId/reject')
  @ApiOperation({ summary: 'Reject a booking request (teacher)' })
  reject(@Param('requestId') requestId: string, @CurrentUser() user: User) {
    return this.requestsService.reject(requestId, user.id);
  }

  @Post('requests/:requestId/cancel')
  @ApiOperation({ summary: 'Cancel a booking request (student)' })
  cancel(@Param('requestId') requestId: string, @CurrentUser() user: User) {
    return this.requestsService.cancel(requestId, user.id);
  }
}
