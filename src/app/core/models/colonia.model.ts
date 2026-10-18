export interface Colonia {
  id: string;
  name: string;
  postalCode?: string;
  zoneType: 'URBANA' | 'COMUNIDAD_RURAL';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
