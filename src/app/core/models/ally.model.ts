import { Colonia } from './colonia.model';

export type AllyCategory = 'VETERINARIA' | 'ESTETICA_CANINA' | 'TIENDA_ALIMENTOS' | 'FARMACIA_VETERINARIA';

export interface Ally {
  id: string;
  businessName: string;
  category: AllyCategory;
  logoUrl?: string;
  phone: string;
  whatsappPhone?: string;
  coloniaId?: string;
  colonia?: Colonia;
  address: string;
  description?: string;
  hasPromotionForAdopters: boolean;
  promotionDescription?: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
