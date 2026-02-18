import { SetMetadata } from '@nestjs/common';
import { ClassroomRole } from '@gam/shared';

export const CLASSROOM_ROLES_KEY = 'classroomRoles';
export const ClassroomRoles = (...roles: ClassroomRole[]) =>
  SetMetadata(CLASSROOM_ROLES_KEY, roles);
