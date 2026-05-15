import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  LeadSource,
  LeadStatus,
  ExportFormat,
} from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { toCsv } from '../common/utils/csv.util';
import type { CreateLeadDto } from './dto/create-lead.dto';
import type { CreateLeadNoteDto } from './dto/create-lead-note.dto';
import type { LeadQueryDto } from './dto/lead-query.dto';
import type { UpdateLeadDto } from './dto/update-lead.dto';

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateLeadDto,
    requestInfo?: { ip?: string; userAgent?: string; referrer?: string },
  ) {
    this.validateRequiredLeadFields(dto);

    const campaignId = await this.resolveCampaignId(
      dto.campaignId,
      dto.campaignSlug,
    );

    const fullName = this.buildFullName(
      dto.firstName,
      dto.lastName,
      dto.fullName,
    );

    return this.prisma.lead.create({
      data: {
        firstName: dto.firstName.trim(),
        lastName: dto.lastName?.trim() || null,
        fullName,
        email: dto.email.trim().toLowerCase(),
        phone: dto.phone.trim(),
        company: dto.company?.trim() || null,
        jobTitle: dto.jobTitle?.trim() || null,
        message: dto.message?.trim() || null,
        source: dto.source ?? LeadSource.LANDING_PAGE,
        campaignId,

        // Prisma 7 es más estricto con campos Json.
        // Si no viene metadata, guardamos JsonNull.
        metadata: this.toJsonOrNull(dto.metadata),

        ipAddress: requestInfo?.ip,
        userAgent: requestInfo?.userAgent,
        referrer: requestInfo?.referrer,
      },
      include: {
        campaign: true,
        assignedTo: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
  }

  async findAll(query: LeadQueryDto) {
    const page = this.toPositiveNumber(query.page, 1);
    const limit = this.toPositiveNumber(query.limit, 10, 100);
    const skip = (page - 1) * limit;
    const where = this.buildWhere(query);

    const [total, data] = await this.prisma.$transaction([
      this.prisma.lead.count({ where }),
      this.prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { registeredAt: 'desc' },
        include: {
          campaign: true,
          assignedTo: {
            select: { id: true, name: true, email: true, role: true },
          },
          notes: {
            orderBy: { createdAt: 'desc' },
            take: 3,
            include: {
              adminUser: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        campaign: true,
        assignedTo: {
          select: { id: true, name: true, email: true, role: true },
        },
        notes: {
          orderBy: { createdAt: 'desc' },
          include: {
            adminUser: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!lead || lead.deletedAt) {
      throw new NotFoundException('Lead no encontrado');
    }

    return lead;
  }

  async update(id: string, dto: UpdateLeadDto) {
    await this.ensureLeadExists(id);

    const fullName =
      dto.firstName || dto.lastName || dto.fullName
        ? this.buildFullName(
            dto.firstName ?? '',
            dto.lastName ?? undefined,
            dto.fullName,
          )
        : undefined;

    return this.prisma.lead.update({
      where: { id },
      data: {
        firstName: dto.firstName?.trim(),
        lastName:
          dto.lastName === undefined ? undefined : dto.lastName?.trim() || null,
        fullName,
        email: dto.email?.trim().toLowerCase(),
        phone: dto.phone?.trim(),
        company:
          dto.company === undefined ? undefined : dto.company?.trim() || null,
        jobTitle:
          dto.jobTitle === undefined ? undefined : dto.jobTitle?.trim() || null,
        message:
          dto.message === undefined ? undefined : dto.message?.trim() || null,
        status: dto.status,
        source: dto.source,
        campaignId: dto.campaignId,
        assignedToId: dto.assignedToId,

        // Si metadata no viene, no se actualiza.
        // Si viene null, se guarda JsonNull.
        metadata:
          dto.metadata === undefined
            ? undefined
            : this.toJsonOrNull(dto.metadata),
      },
      include: {
        campaign: true,
        assignedTo: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
  }

  async softDelete(id: string) {
    await this.ensureLeadExists(id);

    return this.prisma.lead.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async addNote(leadId: string, dto: CreateLeadNoteDto) {
    await this.ensureLeadExists(leadId);

    if (!dto.note?.trim()) {
      throw new BadRequestException('La nota es obligatoria');
    }

    return this.prisma.leadNote.create({
      data: {
        leadId,
        note: dto.note.trim(),
        adminUserId: dto.adminUserId,
      },
      include: {
        adminUser: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async getStats() {
    const [total, newLeads, contacted, qualified, converted, byStatus, bySource] =
      await this.prisma.$transaction([
        this.prisma.lead.count({ where: { deletedAt: null } }),
        this.prisma.lead.count({
          where: { deletedAt: null, status: LeadStatus.NEW },
        }),
        this.prisma.lead.count({
          where: { deletedAt: null, status: LeadStatus.CONTACTED },
        }),
        this.prisma.lead.count({
          where: { deletedAt: null, status: LeadStatus.QUALIFIED },
        }),
        this.prisma.lead.count({
          where: { deletedAt: null, status: LeadStatus.CONVERTED },
        }),

        // Prisma 7 pide orderBy en groupBy.
        this.prisma.lead.groupBy({
          by: ['status'],
          where: { deletedAt: null },
          orderBy: { status: 'asc' },
          _count: { status: true },
        }),

        // Prisma 7 pide orderBy en groupBy.
        this.prisma.lead.groupBy({
          by: ['source'],
          where: { deletedAt: null },
          orderBy: { source: 'asc' },
          _count: { source: true },
        }),
      ]);

    return {
      total,
      newLeads,
      contacted,
      qualified,
      converted,
      byStatus,
      bySource,
    };
  }

  async exportCsv(query: LeadQueryDto) {
    const where = this.buildWhere(query);

    const leads = await this.prisma.lead.findMany({
      where,
      orderBy: { registeredAt: 'desc' },
      include: { campaign: true, assignedTo: true },
    });

    const rows = leads.map((lead) => ({
      id: lead.id,
      nombre: lead.fullName,
      email: lead.email,
      telefono: lead.phone,
      fecha_registro: lead.registeredAt.toISOString(),
    }));

    const csv = toCsv(rows, [
      { key: 'id', label: 'ID' },
      { key: 'nombre', label: 'Nombre' },
      { key: 'email', label: 'Correo' },
      { key: 'telefono', label: 'Telefono' },
      { key: 'fecha_registro', label: 'Fecha de registro' },
    ]);

    await this.prisma.leadExport.create({
      data: {
        fileName: `leads-${new Date().toISOString().slice(0, 10)}.csv`,
        format: ExportFormat.CSV,
        totalRows: leads.length,

        // Convertimos el query a JSON plano para evitar errores de Prisma 7.
        filters: this.toJsonOrNull(this.cleanObject({ ...query })),
      },
    });

    return csv;
  }

  private validateRequiredLeadFields(dto: CreateLeadDto) {
    if (!dto.firstName?.trim()) {
      throw new BadRequestException('El nombre es obligatorio');
    }

    if (!dto.email?.trim()) {
      throw new BadRequestException('El correo es obligatorio');
    }

    if (!dto.phone?.trim()) {
      throw new BadRequestException('El teléfono es obligatorio');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(dto.email)) {
      throw new BadRequestException('El correo no tiene un formato válido');
    }

    const phoneRegex = /^[+]?[(]?[0-9\s().-]{7,25}$/;

    if (!phoneRegex.test(dto.phone)) {
      throw new BadRequestException('El teléfono no tiene un formato válido');
    }
  }

  private buildFullName(firstName: string, lastName?: string, fullName?: string) {
    if (fullName?.trim()) return fullName.trim();

    return [firstName?.trim(), lastName?.trim()].filter(Boolean).join(' ');
  }

  private async resolveCampaignId(campaignId?: string, campaignSlug?: string) {
    if (campaignId) return campaignId;
    if (!campaignSlug) return null;

    const campaign = await this.prisma.campaign.findUnique({
      where: { slug: campaignSlug },
      select: { id: true },
    });

    return campaign?.id ?? null;
  }

  private buildWhere(query: LeadQueryDto): Prisma.LeadWhereInput {
    const where: Prisma.LeadWhereInput = {};

    if (query.includeDeleted !== 'true') {
      where.deletedAt = null;
    }

    if (query.status) where.status = query.status;
    if (query.source) where.source = query.source;
    if (query.campaignId) where.campaignId = query.campaignId;
    if (query.assignedToId) where.assignedToId = query.assignedToId;

    if (query.search?.trim()) {
      const search = query.search.trim();

      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (query.dateFrom || query.dateTo) {
      where.registeredAt = {};

      if (query.dateFrom) {
        where.registeredAt.gte = new Date(query.dateFrom);
      }

      if (query.dateTo) {
        where.registeredAt.lte = new Date(query.dateTo);
      }
    }

    return where;
  }

  private toPositiveNumber(
    value: string | undefined,
    fallback: number,
    max = 1000,
  ) {
    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;

    return Math.min(Math.floor(parsed), max);
  }

  private async ensureLeadExists(id: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      select: { id: true, deletedAt: true },
    });

    if (!lead || lead.deletedAt) {
      throw new NotFoundException('Lead no encontrado');
    }
  }

  /**
   * Prisma 7 es estricto con los campos Json.
   * Este helper convierte valores undefined/null en JsonNull
   * y permite guardar objetos planos como JSON.
   */
  private toJsonOrNull(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
    if (value === undefined || value === null) {
      return Prisma.JsonNull;
    }

    return value as Prisma.InputJsonValue;
  }

  /**
   * Limpia propiedades undefined antes de guardar filtros en JSON.
   */
  private cleanObject<T extends Record<string, unknown>>(object: T) {
    return Object.fromEntries(
      Object.entries(object).filter(([, value]) => value !== undefined),
    );
  }
}