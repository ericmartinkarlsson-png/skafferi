import { db } from './index.ts';
import { products, manualShoppingItems } from './schema.ts';
import { eq, sql } from 'drizzle-orm';
import { Product, ShoppingItem } from '../types.ts';
import { INITIAL_PRODUCTS } from '../data/initialData.ts';

export async function getAllProducts(): Promise<Product[]> {
  try {
    const rows = await db.select().from(products);
    if (rows.length === 0) {
      // Seed default items if empty
      for (const item of INITIAL_PRODUCTS) {
        await db.insert(products).values({
          id: item.id,
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          expirationDate: item.expirationDate || '',
          minQuantity: item.minQuantity,
          barcode: item.barcode || null,
          locationDetails: item.locationDetails || null,
          notes: item.notes || null,
        }).onConflictDoNothing();
      }
      const seeded = await db.select().from(products);
      return seeded.map(mapDbProductToProduct);
    }
    return rows.map(mapDbProductToProduct);
  } catch (error) {
    console.error('Failed to get products from database:', error);
    throw new Error('Database query failed for products', { cause: error });
  }
}

function mapDbProductToProduct(row: typeof products.$inferSelect): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category as any,
    quantity: row.quantity,
    unit: row.unit as any,
    expirationDate: row.expirationDate || '',
    minQuantity: row.minQuantity,
    barcode: row.barcode || undefined,
    locationDetails: row.locationDetails || undefined,
    notes: row.notes || undefined,
    updatedAt: row.updatedAt?.toISOString() || new Date().toISOString(),
  };
}

export async function upsertProduct(product: Omit<Product, 'updatedAt'>): Promise<Product> {
  try {
    const result = await db.insert(products)
      .values({
        id: product.id,
        name: product.name,
        category: product.category,
        quantity: product.quantity,
        unit: product.unit,
        expirationDate: product.expirationDate || '',
        minQuantity: product.minQuantity,
        barcode: product.barcode || null,
        locationDetails: product.locationDetails || null,
        notes: product.notes || null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: products.id,
        set: {
          name: product.name,
          category: product.category,
          quantity: product.quantity,
          unit: product.unit,
          expirationDate: product.expirationDate || '',
          minQuantity: product.minQuantity,
          barcode: product.barcode || null,
          locationDetails: product.locationDetails || null,
          notes: product.notes || null,
          updatedAt: new Date(),
        },
      })
      .returning();

    return mapDbProductToProduct(result[0]);
  } catch (error) {
    console.error('Failed to upsert product:', error);
    throw new Error('Database upsert failed for product', { cause: error });
  }
}

export async function deleteProductById(id: string): Promise<boolean> {
  try {
    await db.delete(products).where(eq(products.id, id));
    return true;
  } catch (error) {
    console.error('Failed to delete product:', error);
    throw new Error('Database delete failed for product', { cause: error });
  }
}

export async function adjustProductQuantity(id: string, delta: number): Promise<Product | null> {
  try {
    const existing = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (existing.length === 0) return null;

    const newQty = Math.max(0, existing[0].quantity + delta);
    const updated = await db.update(products)
      .set({
        quantity: newQty,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    return mapDbProductToProduct(updated[0]);
  } catch (error) {
    console.error('Failed to adjust product quantity:', error);
    throw new Error('Database update failed for quantity', { cause: error });
  }
}

export async function getManualShoppingItems(): Promise<ShoppingItem[]> {
  try {
    const rows = await db.select().from(manualShoppingItems);
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category as any,
      currentQuantity: 0,
      minQuantity: 1,
      neededQuantity: r.neededQuantity,
      unit: r.unit as any,
      isChecked: Boolean(r.isChecked),
      isManual: true,
    }));
  } catch (error) {
    console.error('Failed to get manual shopping items:', error);
    throw new Error('Database query failed for shopping items', { cause: error });
  }
}

export async function upsertManualItem(item: ShoppingItem): Promise<void> {
  try {
    await db.insert(manualShoppingItems)
      .values({
        id: item.id,
        name: item.name,
        category: item.category,
        neededQuantity: item.neededQuantity,
        unit: item.unit,
        isChecked: item.isChecked ? 1 : 0,
      })
      .onConflictDoUpdate({
        target: manualShoppingItems.id,
        set: {
          name: item.name,
          category: item.category,
          neededQuantity: item.neededQuantity,
          unit: item.unit,
          isChecked: item.isChecked ? 1 : 0,
        },
      });
  } catch (error) {
    console.error('Failed to upsert manual shopping item:', error);
    throw new Error('Database upsert failed for shopping item', { cause: error });
  }
}

export async function deleteManualItem(id: string): Promise<void> {
  try {
    await db.delete(manualShoppingItems).where(eq(manualShoppingItems.id, id));
  } catch (error) {
    console.error('Failed to delete manual shopping item:', error);
    throw new Error('Database delete failed for shopping item', { cause: error });
  }
}

export async function resetAllToDefaults(): Promise<Product[]> {
  try {
    await db.delete(products);
    await db.delete(manualShoppingItems);
    for (const item of INITIAL_PRODUCTS) {
      await db.insert(products).values({
        id: item.id,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        expirationDate: item.expirationDate || '',
        minQuantity: item.minQuantity,
        barcode: item.barcode || null,
        locationDetails: item.locationDetails || null,
        notes: item.notes || null,
      });
    }
    const seeded = await db.select().from(products);
    return seeded.map(mapDbProductToProduct);
  } catch (error) {
    console.error('Failed to reset inventory in database:', error);
    throw new Error('Database reset failed', { cause: error });
  }
}
