import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IsString, MinLength, MaxLength, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTicketDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(200) title: string;
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(5000) content: string;
}

export class UpdateTicketDto {
  @ApiPropertyOptional({ enum: ['open', 'in_progress', 'closed'] })
  @IsEnum(['open', 'in_progress', 'closed'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional() @IsString() @MaxLength(5000) @IsOptional() content?: string;
}

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  create(classroomId: string, dto: CreateTicketDto, userId: string) {
    return this.prisma.supportTicket.create({
      data: { classroomId, createdBy: userId, title: dto.title, content: dto.content },
    });
  }

  findByClassroom(classroomId: string) {
    return this.prisma.supportTicket.findMany({
      where: { classroomId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(ticketId: string, dto: UpdateTicketDto) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { ...(dto.status ? { status: dto.status } : {}), ...(dto.content !== undefined ? { content: dto.content } : {}) },
    });
  }
}
