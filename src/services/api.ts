import { Product, ShoppingItem } from '../types.ts';
import { AUTH_PASSCODE } from './storage.ts';

const HEADERS = {
  'Content-Type': 'application/json',
  'x-cabin-passcode': encodeURIComponent(AUTH_PASSCODE),
  'Authorization': `Bearer ${encodeURIComponent(AUTH_PASSCODE)}`,
};

async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const mergedHeaders: Record<string, string> = {
    ...HEADERS,
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(endpoint, {
    ...options,
    headers: mergedHeaders,
    credentials: 'include',
  });

  if (!res.ok) {
    if (res.status === 404 && typeof window !== 'undefined' && window.location.hostname.includes('netlify')) {
      throw new Error('Netlify körs utan Node/PostgreSQL-backend. Firebase Firestore behövs för att synka på Netlify.');
    }

    let errorDetail = `HTTP ${res.status}`;

    try {
      const errorJson = await res.json();
      if (errorJson?.error) {
        errorDetail = errorJson.error;
      }
    } catch {
      try {
        const text = await res.text();
        if (text && text.length < 120 && !text.includes('<!DOCTYPE')) {
          errorDetail = text;
        }
      } catch {
        // ignore
      }
    }
    throw new Error(errorDetail);
  }

  return res;
}

export async function fetchProductsApi(): Promise<Product[]> {
  const res = await apiFetch('/api/products');
  return await res.json();
}

export async function saveProductApi(product: Omit<Product, 'updatedAt'>): Promise<Product> {
  const res = await apiFetch('/api/products', {
    method: 'POST',
    body: JSON.stringify(product),
  });
  return await res.json();
}

export async function deleteProductApi(id: string): Promise<void> {
  await apiFetch(`/api/products/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export async function adjustQuantityApi(id: string, delta: number): Promise<Product> {
  const res = await apiFetch(`/api/products/${encodeURIComponent(id)}/quantity`, {
    method: 'PATCH',
    body: JSON.stringify({ delta }),
  });
  return await res.json();
}

export async function fetchManualShoppingApi(): Promise<ShoppingItem[]> {
  const res = await apiFetch('/api/shopping/manual');
  return await res.json();
}

export async function saveManualShoppingApi(item: ShoppingItem): Promise<void> {
  await apiFetch('/api/shopping/manual', {
    method: 'POST',
    body: JSON.stringify(item),
  });
}

export async function deleteManualShoppingApi(id: string): Promise<void> {
  await apiFetch(`/api/shopping/manual/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export async function restockFromShoppingApi(items: { productId: string; addQty: number }[]): Promise<void> {
  await apiFetch('/api/shopping/restock', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

export async function resetDatabaseApi(): Promise<Product[]> {
  const res = await apiFetch('/api/database/reset', {
    method: 'POST',
  });
  const data = await res.json();
  return data.products;
}
