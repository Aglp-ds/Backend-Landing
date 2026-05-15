import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Ip,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import type { CreateLeadDto } from './dto/create-lead.dto';
import type { CreateLeadNoteDto } from './dto/create-lead-note.dto';
import type { LeadQueryDto } from './dto/lead-query.dto';
import type { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadsService } from './leads.service';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  // Endpoint público para capturar leads desde la landing page.
  @Post()
  create(
    @Body() dto: CreateLeadDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
    @Headers('referer') referrer?: string,
  ) {
    return this.leadsService.create(dto, { ip, userAgent, referrer });
  }

  // Lista leads con paginación y filtros para el panel administrativo.
  @Get()
  findAll(@Query() query: LeadQueryDto) {
    return this.leadsService.findAll(query);
  }

  // Resumen para dashboard: totales por estado y origen.
  @Get('stats/summary')
  getStats() {
    return this.leadsService.getStats();
  }

  // Exporta los leads en formato CSV usando los mismos filtros del listado.
  @Get('export/csv')
  async exportCsv(@Query() query: LeadQueryDto, @Res() res: Response) {
    const csv = await this.leadsService.exportCsv(query);
    const fileName = `leads-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    return res.send(csv);
  }

  // Obtiene un lead específico con campaña, asignado y notas.
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.leadsService.findOne(id);
  }

  // Actualiza datos, estado, campaña o usuario asignado del lead.
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLeadDto) {
    return this.leadsService.update(id, dto);
  }

  // Agrega una nota interna al lead.
  @Post(':id/notes')
  addNote(@Param('id') id: string, @Body() dto: CreateLeadNoteDto) {
    return this.leadsService.addNote(id, dto);
  }

  // Eliminación lógica: no borra físicamente, solo marca deletedAt.
  @Delete(':id')
  softDelete(@Param('id') id: string) {
    return this.leadsService.softDelete(id);
  }
}