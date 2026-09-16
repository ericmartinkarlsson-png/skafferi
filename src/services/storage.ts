import { Product, ShoppingItem } from '../types';
import { INITIAL_PRODUCTS } from '../data/initialData';

const STORAGE_KEY_PRODUCTS = 'bjornstugan_inventory_products_v1';
const STORAGE_KEY_MANUAL_SHOPPING = 'bjornstugan_manual_shopping_v1';
const STORAGE_KEY_AUTH = 'bjornstugan_auth_v1';

export const AUTH_PASSCODE = 'Björnstugan1337';

export function loadStoredProducts(): Product[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_PRODUCTS);
    if (!data) {
      // Save initial data on first launch
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : INITIAL_PRODUCTS;
  } catch (error) {
    console.error('Failed to load products from storage:', error);
    return INITIAL_PRODUCTS;
  }
}

export function saveStoredProducts(products: Product[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
  } catch (error) {
    console.error('Failed to save products to storage:', error);
  }
}

export function loadManualShoppingItems(): ShoppingItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_MANUAL_SHOPPING);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveManualShoppingItems(items: ShoppingItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_MANUAL_SHOPPING, JSON.stringify(items));
  } catch (error) {
    console.error('Failed to save manual shopping items:', error);
  }
}

export function checkIsAuthenticated(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY_AUTH) === 'true';
  } catch {
    return false;
  }
}

export function setAuthenticated(value: boolean): void {
  try {
    if (value) {
      localStorage.setItem(STORAGE_KEY_AUTH, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEY_AUTH);
    }
  } catch (error) {
    console.error('Failed to update auth in storage:', error);
  }
}

export function resetInventoryToDefaults(): Product[] {
  try {
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    localStorage.removeItem(STORAGE_KEY_MANUAL_SHOPPING);
    return INITIAL_PRODUCTS;
  } catch {
    return INITIAL_PRODUCTS;
  }
}

export function exportInventoryData(products: Product[]): string {
  return JSON.stringify({
    version: '1.0',
    exportDate: new Date().toISOString(),
    products,
  }, null, 2);
}
