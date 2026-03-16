import { CampaignStatus, HomeType } from '@prisma/client';

export interface CreateCampaignDto {
  name: string;
  description?: string;
  goalAmount?: number;
  startDate?: string;
  endDate?: string;
  status?: CampaignStatus;
  homeTypes?: HomeType[];
}

export interface UpdateCampaignDto extends Partial<CreateCampaignDto> {}

export interface UserContext {
  id: string;
  role: string;
  email: string;
}
