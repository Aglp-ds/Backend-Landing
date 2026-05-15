import { LeadSource } from '../../../generated/prisma/client';

export interface CreateLeadDto {
  firstName: string;
  lastName?: string;
  fullName?: string;
  email: string;
  phone: string;
  company?: string;
  jobTitle?: string;
  message?: string;
  source?: LeadSource;
  campaignId?: string;
  campaignSlug?: string;
  metadata?: Record<string, unknown>;
}
