import type { LeadSource, LeadStatus } from '../../../generated/prisma/client';

export class LeadQueryDto {
  page?: string;
  limit?: string;
  search?: string;
  status?: LeadStatus;
  source?: LeadSource;
  campaignId?: string;
  assignedToId?: string;
  dateFrom?: string;
  dateTo?: string;
  includeDeleted?: string;
}