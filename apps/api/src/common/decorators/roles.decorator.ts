import { SetMetadata } from '@nestjs/common';
import { MembershipRole } from '@orbitly/shared';

export const ROLES_KEY = 'roles';
export const RequireRole = (role: MembershipRole) => SetMetadata(ROLES_KEY, role);
