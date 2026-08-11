export interface PromotionBanner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl?: string;
  imageBase64: string;
  targetUrl: string;
  buttonText: string;
  targetType: string;
  isActive: boolean;
  displayOrder: number;
  startAt?: string; // ISO date string
  endAt?: string; // ISO date string
  createdAt?: string;
  updatedAt?: string;
  alias?: string;
}

export interface CreatePromotionBannerRequest {
  title: string;
  subtitle: string;
  imageBase64: string;
  targetUrl: string;
  buttonText: string;
  targetType?: string;
  isActive: boolean;
  displayOrder: number;
  startAt?: string | null;
  endAt?: string | null;
}

export type UpdatePromotionBannerRequest = CreatePromotionBannerRequest;
