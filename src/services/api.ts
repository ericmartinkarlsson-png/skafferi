import { Product, ShoppingItem } from '../types.ts';
import { AUTH_PASSCODE } from './storage.ts';

const HEADERS = {
  'Content-Type': 'application/json',
  'x-cabin-passcode': encodeURIComponent(AUTH_PASSCODE),
};

export async function fetchProductsApi(): Promise<Product[]> {
  const res = await fetch('/api/products', {
    headers: HEADERS,
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  return await res.json();
}

export async function saveProductApi(product: Omit<Product, 'updatedAt'>): Promise<Product> {
  const res = await fetch('/api/products', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(product),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  return await res.json();
}

export async function deleteProductApi(id: string): Promise<void> {
  const res = await fetch(`/api/products/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: HEADERS,
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
}

export async function adjustQuantityApi(id: string, delta: number): Promise<Product> {
  const res = await fetch(`/api/products/${encodeURIComponent(id)}/quantity`, {
    method: 'PATCH',
    headers: HEADERS,
    body: JSON.stringify({ delta }),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  return await res.json();
}

export async function fetchManualShoppingApi(): Promise<ShoppingItem[]> {
  const res = await fetch('/api/shopping/manual', {
    headers: HEADERS,
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  return await res.json();
}

export async function saveManualShoppingApi(item: ShoppingItem): Promise<void> {
  const res = await fetch('/api/shopping/manual', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(item),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
}

export async function deleteManualShoppingApi(id: string): Promise<void> {
  const res = await fetch(`/api/shopping/manual/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: HEADERS,
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
}

export async function restockFromShoppingApi(items: { productId: string; addQty: number }[]): Promise<void> {
  const res = await fetch('/api/shopping/restock', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ items }),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
}

export async function resetDatabaseApi(): Promise<Product[]> {
  const res = await fetch('/api/database/reset', {
    method: 'POST',
    headers: HEADERS,
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  const data = await res.json();
  return data.products;
}
