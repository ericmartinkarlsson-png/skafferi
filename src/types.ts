export type CategoryId = 'kylskåp' | 'skafferi' | 'förbrukning' | 'övrigt';

export type ProductUnit = 'st' | 'l' | 'dl' | 'g' | 'kg' | 'pkt' | 'rullar' | 'burk' | 'flaska' | 'påse';

export type AppMode = 'normal' | 'påfyllnad' | 'uttag';

export type SortField = 'expiry-asc' | 'expiry-desc' | 'name-asc' | 'quantity-asc' | 'quantity-desc';

export interface Product {
  id: string;
  name: string;
  category: CategoryId;
  quantity: number;
  unit: ProductUnit;
  expirationDate: string; // YYYY-MM-DD
  minQuantity: number;
  barcode?: string;
  locationDetails?: string;
  notes?: string;
  updatedAt: string;
}

export interface ShoppingItem {
  id: string;
  productId?: string;
  name: string;
  category: CategoryId;
  currentQuantity: number;
  minQuantity: number;
  neededQuantity: number;
  unit: ProductUnit;
  isChecked: boolean;
  isManual?: boolean;
}

export interface ExpiryStatus {
  status: 'expired' | 'urgent' | 'warning' | 'good' | 'none';
  daysLeft: number;
  label: string;
  colorClass: string;
  badgeClass: string;
}
