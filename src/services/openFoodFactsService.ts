import { CategoryId, ProductUnit } from '../types';

export interface OpenFoodFactsProduct {
  barcode: string;
  name: string;
  brand?: string;
  packageSize?: string;
  category?: CategoryId;
  imageUrl?: string;
  suggestedUnit?: ProductUnit;
}

// In-memory cache to avoid duplicate network calls
const cache = new Map<string, { data: OpenFoodFactsProduct | null; timestamp: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Prevent concurrent identical requests
const inFlightRequests = new Map<string, Promise<OpenFoodFactsProduct | null>>();

// Rate limit backoff tracking
let rateLimitUntil = 0;

/**
 * Maps Open Food Facts categories/tags to Björnstugan's 4 categories:
 * 'kylskåp' | 'skafferi' | 'förbrukning' | 'övrigt'
 */
function mapCategory(categoriesTags?: string[], categoriesString?: string): CategoryId | undefined {
  const combined = [
    ...(categoriesTags || []),
    categoriesString || '',
  ]
    .join(' ')
    .toLowerCase();

  if (!combined.trim()) return undefined;

  // 1. Kylskåp (Dairy, cheese, cold meats, refrigerated items, fresh produce)
  const fridgeKeywords = [
    'dairy',
    'dairies',
    'cheese',
    'cheeses',
    'milk',
    'milks',
    'yogurt',
    'yogurts',
    'butter',
    'mejeri',
    'ost',
    'mjölk',
    'fil',
    'grädde',
    'smör',
    'kyl',
    'refrigerated',
    'färsk',
    'chark',
    'kött',
    'charkuteri',
    'fisk',
    'cold cuts',
    'egg',
    'eggs',
    'ägg',
    'creams',
  ];
  if (fridgeKeywords.some((k) => combined.includes(k))) {
    return 'kylskåp';
  }

  // 2. Förbrukning (Cleaning, paper, household)
  const consumablesKeywords = [
    'cleaning',
    'paper',
    'toilet',
    'detergent',
    'soap',
    'shampoo',
    'hushåll',
    'tvätt',
    'disk',
    'städ',
    'toalettpapper',
    'hushållspapper',
    'servetter',
    'folie',
    'plastpåsar',
    'avfallspåsar',
  ];
  if (consumablesKeywords.some((k) => combined.includes(k))) {
    return 'förbrukning';
  }

  // 3. Skafferi (Cereals, pantry, dry goods, snacks, preserves, pasta, bread, drinks, canned)
  const pantryKeywords = [
    'cereal',
    'cereals',
    'pasta',
    'rice',
    'flour',
    'sugar',
    'spice',
    'spices',
    'snack',
    'snacks',
    'chips',
    'crisps',
    'canned',
    'sauce',
    'sauces',
    'oil',
    'oils',
    'bread',
    'breads',
    'biscuits',
    'chocolate',
    'chocolates',
    'sweet',
    'sweets',
    'candy',
    'beverage',
    'beverages',
    'soda',
    'sodas',
    'coffee',
    'tea',
    'skafferi',
    'konserver',
    'torrvaror',
    'flingor',
    'havregryn',
    'kryddor',
    'kaffe',
    'te',
    'godis',
    'chips',
    'nötter',
    'spread',
    'spreads',
    'jam',
    'marmalade',
    'sylt',
    'marmelad',
  ];
  if (pantryKeywords.some((k) => combined.includes(k))) {
    return 'skafferi';
  }

  return undefined;
}

/**
 * Attempts to parse a unit from the package size string (e.g., "275 g", "1.5 l")
 */
function parseSuggestedUnit(quantityStr?: string): ProductUnit | undefined {
  if (!quantityStr) return undefined;
  const lower = quantityStr.toLowerCase().trim();

  if (/\b(kg|kilo)\b/.test(lower)) return 'kg';
  if (/\b(g|gram)\b/.test(lower)) return 'g';
  if (/\b(dl|deciliter)\b/.test(lower)) return 'dl';
  if (/\b(l|liter)\b/.test(lower)) return 'l';
  if (/\b(burk|can)\b/.test(lower)) return 'burk';
  if (/\b(flaska|bottle)\b/.test(lower)) return 'flaska';
  if (/\b(påse|bag)\b/.test(lower)) return 'påse';
  if (/\b(pkt|paket|pack)\b/.test(lower)) return 'pkt';
  return undefined;
}

/**
 * Look up a product by EAN/GTIN barcode in Open Food Facts API.
 * - Only sends the barcode.
 * - Respects rate limiting, timeouts, and debouncing.
 * - Never throws; gracefully returns null on any network failure or missing product.
 */
export async function lookupOpenFoodFacts(barcode: string): Promise<OpenFoodFactsProduct | null> {
  const cleanBarcode = barcode.trim();
  if (!cleanBarcode) return null;

  // 1. Check in-memory cache
  const cached = cache.get(cleanBarcode);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // 2. Check if currently rate-limited
  if (Date.now() < rateLimitUntil) {
    console.warn('Open Food Facts lookup skipped: Currently in rate-limit backoff.');
    return null;
  }

  // 3. Prevent duplicate concurrent requests for the same barcode
  if (inFlightRequests.has(cleanBarcode)) {
    return inFlightRequests.get(cleanBarcode)!;
  }

  const requestPromise = (async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    try {
      // Build specific query requesting only needed fields
      const fields = [
        'code',
        'product_name',
        'product_name_sv',
        'product_name_en',
        'brands',
        'quantity',
        'categories',
        'categories_tags',
        'image_url',
        'image_front_url',
        'image_front_small_url',
      ].join(',');

      const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(cleanBarcode)}.json?fields=${fields}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle rate limits (HTTP 429)
      if (response.status === 429) {
        console.warn('Open Food Facts returned 429 (Rate Limited). Backing off for 30s.');
        rateLimitUntil = Date.now() + 30000;
        return null;
      }

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      if (data && data.status === 1 && data.product) {
        const prod = data.product;

        // Prefer Swedish product name, then primary product name, then English
        const rawName = (prod.product_name_sv || prod.product_name || prod.product_name_en || '').trim();
        const brand = (prod.brands || '').trim() || undefined;
        const packageSize = (prod.quantity || '').trim() || undefined;

        // Compose an intuitive display name (e.g. "OLW Grillchips" if brand isn't already included)
        let finalName = rawName;
        if (brand && finalName && !finalName.toLowerCase().includes(brand.toLowerCase())) {
          finalName = `${brand} ${finalName}`;
        } else if (!finalName && brand) {
          finalName = brand;
        }

        const category = mapCategory(prod.categories_tags, prod.categories);
        const imageUrl = prod.image_front_small_url || prod.image_front_url || prod.image_url || undefined;
        const suggestedUnit = parseSuggestedUnit(packageSize);

        const result: OpenFoodFactsProduct = {
          barcode: cleanBarcode,
          name: finalName || `Produkt (${cleanBarcode})`,
          brand,
          packageSize,
          category,
          imageUrl,
          suggestedUnit,
        };

        // Cache the successful result
        cache.set(cleanBarcode, { data: result, timestamp: Date.now() });
        return result;
      }

      // Not found in Open Food Facts
      cache.set(cleanBarcode, { data: null, timestamp: Date.now() });
      return null;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err?.name === 'AbortError') {
        console.warn(`Open Food Facts lookup timed out for barcode ${cleanBarcode}`);
      } else {
        console.warn('Open Food Facts lookup error:', err);
      }
      return null;
    } finally {
      inFlightRequests.delete(cleanBarcode);
    }
  })();

  inFlightRequests.set(cleanBarcode, requestPromise);
  return requestPromise;
}
