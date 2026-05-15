export interface CreateCampaignDto {
  name: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
  startsAt?: string;
  endsAt?: string;
}
