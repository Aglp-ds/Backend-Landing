import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AdminRole } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateAdminUserDto) {
    if (!dto.name?.trim()) throw new BadRequestException('El nombre es obligatorio');
    if (!dto.email?.trim()) throw new BadRequestException('El correo es obligatorio');
    if (!dto.passwordHash?.trim()) {
      throw new BadRequestException('passwordHash es obligatorio');
    }

    return this.prisma.adminUser.create({
      data: {
        name: dto.name.trim(),
        email: dto.email.trim().toLowerCase(),
        passwordHash: dto.passwordHash,
        role: dto.role ?? AdminRole.ADMIN,
        isActive: dto.isActive ?? true,
      },
      select: this.safeSelect(),
    });
  }

  findAll(query: { active?: string; search?: string }) {
    return this.prisma.adminUser.findMany({
      where: {
        isActive: query.active === undefined ? undefined : query.active === 'true',
        OR: query.search
          ? [
              { name: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ]
          : undefined,
      },
      orderBy: { createdAt: 'desc' },
      select: this.safeSelect(),
    });
  }

  async findOne(id: string) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { id },
      select: this.safeSelect(),
    });

    if (!admin) throw new NotFoundException('Usuario administrador no encontrado');
    return admin;
  }

  async update(id: string, dto: UpdateAdminUserDto) {
    await this.findOne(id);

    return this.prisma.adminUser.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        email: dto.email?.trim().toLowerCase(),
        passwordHash: dto.passwordHash,
        role: dto.role,
        isActive: dto.isActive,
      },
      select: this.safeSelect(),
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.adminUser.delete({
      where: { id },
      select: this.safeSelect(),
    });
  }

  // Nunca devolvemos passwordHash en respuestas del API.
  private safeSelect() {
    return {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    } as const;
  }
}
