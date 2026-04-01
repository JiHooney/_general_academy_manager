import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ClassroomsService } from './classrooms.service';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('classrooms')
@ApiBearerAuth()
@Controller()
export class ClassroomsController {
  constructor(private classroomsService: ClassroomsService) {}

  @Post('studios/:studioId/classrooms')
  @ApiOperation({ summary: 'Create classroom inside a studio' })
  create(
    @Param('studioId') studioId: string,
    @Body() dto: CreateClassroomDto,
    @CurrentUser() user: User,
  ) {
    return this.classroomsService.create(studioId, dto, user.id);
  }

  @Get('classrooms')
  @ApiOperation({ summary: 'List classrooms (filter by studioId)' })
  @ApiQuery({ name: 'studioId', required: true })
  findAll(@Query('studioId') studioId: string) {
    return this.classroomsService.findByStudio(studioId);
  }

  @Get('classrooms/:classroomId')
  @ApiOperation({ summary: 'Get a classroom with members' })
  findOne(@Param('classroomId') classroomId: string) {
    return this.classroomsService.findOne(classroomId);
  }

  @Get('classrooms/:classroomId/teachers')
  @ApiOperation({ summary: 'List teachers in a classroom' })
  getTeachers(@Param('classroomId') classroomId: string) {
    return this.classroomsService.getTeachers(classroomId);
  }

  @Patch('classrooms/:classroomId')
  @ApiOperation({ summary: 'Update classroom name/description' })
  update(
    @Param('classroomId') classroomId: string,
    @Body() dto: { name?: string; description?: string },
    @CurrentUser() user: User,
  ) {
    return this.classroomsService.update(classroomId, dto, user.id);
  }

  @Delete('classrooms/:classroomId')
  @ApiOperation({ summary: 'Delete a classroom' })
  remove(
    @Param('classroomId') classroomId: string,
    @CurrentUser() user: User,
  ) {
    return this.classroomsService.remove(classroomId, user.id);
  }
}
