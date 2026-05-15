import { AdminRole } from '../../../generated/prisma/client';

export interface UpdateAdminUserDto {
  name?: string;
  email?: string;
  passwordHash?: string;
  role?: AdminRole;
  isActive?: boolean;
}
