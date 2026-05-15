import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateCampaignDto } from './dto/create-campaign.dto';
import type { UpdateCampaignDto } from './dto/update-campaign.dto';

@Injectable()
export class CampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateCampaignDto) {
    if (!dto.name?.trim()) {
      throw new BadRequestException('El nombre de la campaña es obligatorio');
    }

    return this.prisma.campaign.create({
      data: {
        name: dto.name.trim(),
        slug: dto.slug?.trim() || this.slugify(dto.name),
        description: dto.description?.trim() || null,
        isActive: dto.isActive ?? true,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
      },
    });
  }

  findAll(query: { active?: string; search?: string }) {
    return this.prisma.campaign.findMany({
      where: {
        isActive: query.active === undefined ? undefined : query.active === 'true',
        OR: query.search
          ? [
              { name: { contains: query.search, mode: 'insensitive' } },
              { slug: { contains: query.search, mode: 'insensitive' } },
            ]
          : undefined,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { leads: true } },
      },
    });
  }

  async findOne(id: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: {
        _count: { select: { leads: true } },
      },
    });

    if (!campaign) throw new NotFoundException('Campaña no encontrada');
    return campaign;
  }

  async findBySlug(slug: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { slug },
      include: {
        _count: { select: { leads: true } },
      },
    });

    if (!campaign) throw new NotFoundException('Campaña no encontrada');
    return campaign;
  }

  async update(id: string, dto: UpdateCampaignDto) {
    await this.findOne(id);

    return this.prisma.campaign.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        slug: dto.slug?.trim(),
        description: dto.description === undefined ? undefined : dto.description?.trim() || null,
        isActive: dto.isActive,
        startsAt: dto.startsAt === undefined ? undefined : dto.startsAt ? new Date(dto.startsAt) : null,
        endsAt: dto.endsAt === undefined ? undefined : dto.endsAt ? new Date(dto.endsAt) : null,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.campaign.delete({ where: { id } });
  }

  private slugify(text: string) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
}
