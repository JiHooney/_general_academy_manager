import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CalendarService } from './calendar.service';
import { IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

class RecommendDto {
  @ApiProperty() @IsDateString() startAt: string;
  @ApiProperty() @IsDateString() endAt: string;
}

@ApiTags('calendar')
@ApiBearerAuth()
@Controller()
export class CalendarController {
  constructor(private calendarService: CalendarService) {}

  @Get('classrooms/:classroomId/calendar')
  @ApiOperation({ summary: 'Get calendar data (appointments + pending requests)' })
  @ApiQuery({ name: 'from', required: true, description: 'ISO datetime' })
  @ApiQuery({ name: 'to', required: true, description: 'ISO datetime' })
  getCalendar(
    @Param('classroomId') classroomId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.calendarService.getCalendar(classroomId, from, to);
  }

  @Post('classrooms/:classroomId/teachers/recommend')
  @ApiOperation({ summary: 'Get available teachers for a time range' })
  recommend(@Param('classroomId') classroomId: string, @Body() dto: RecommendDto) {
    return this.calendarService.recommendTeachers(classroomId, dto.startAt, dto.endAt);
  }

  @Get('calendar/my')
  @ApiOperation({ summary: 'Get my appointments (all classrooms) for a date range' })
  @ApiQuery({ name: 'from', required: true })
  @ApiQuery({ name: 'to', required: true })
  getMyCalendar(
    @CurrentUser() user: User,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.calendarService.getMyCalendar(user.id, from, to);
  }
}
