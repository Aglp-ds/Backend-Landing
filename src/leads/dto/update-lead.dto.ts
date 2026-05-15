import { LeadSource, LeadStatus } from '../../../generated/prisma/client';

export interface UpdateLeadDto {
  firstName?: string;
  lastName?: string | null;
  fullName?: string;
  email?: string;
  phone?: string;
  company?: string | null;
  jobTitle?: string | null;
  message?: string | null;
  status?: LeadStatus;
  source?: LeadSource;
  campaignId?: string | null;
  assignedToId?: string | null;
  metadata?: Record<string, unknown> | null;
}
