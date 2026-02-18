import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { CLASSROOM_ROLES_KEY } from '../decorators/classroom-roles.decorator';
import { ClassroomRole } from '@gam/shared';

@Injectable()
export class ClassroomRolesGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<ClassroomRole[]>(
      CLASSROOM_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const classroomId =
      request.params?.classroomId || request.body?.classroomId;

    if (!classroomId) return true;

    const membership = await this.prisma.classroomMembership.findUnique({
      where: { classroomId_userId: { classroomId, userId: user.id } },
    });

    if (!membership || membership.status !== 'active') {
      throw new ForbiddenException('Not a member of this classroom');
    }

    if (!requiredRoles.includes(membership.roleInClassroom as ClassroomRole)) {
      throw new ForbiddenException('Insufficient classroom role');
    }

    request.membership = membership;
    return true;
  }
}
