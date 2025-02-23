export interface Address {
  id?: string;
  userId?: string;
  type: string;  // 'home', 'office', or 'other'
  address: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  createdAt?: string;
}
