import { AdminRole } from '../../../generated/prisma/client';

export interface CreateAdminUserDto {
  name: string;
  email: string;
  passwordHash: string;
  role?: AdminRole;
  isActive?: boolean;
}
