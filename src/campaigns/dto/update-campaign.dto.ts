export interface UpdateCampaignDto {
  name?: string;
  slug?: string;
  description?: string | null;
  isActive?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
}
