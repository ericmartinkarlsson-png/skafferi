import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  Unsubscribe 
} from 'firebase/firestore';
import { db } from '../lib/firebase.ts';
import { Product, ShoppingItem } from '../types.ts';
import { INITIAL_PRODUCTS } from '../data/initialData.ts';

const PRODUCTS_COLLECTION = 'products';
const SHOPPING_COLLECTION = 'shoppingItems';

function cleanObject<T extends Record<string, any>>(obj: T): Partial<T> {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned as Partial<T>;
}

export async function fetchProductsFromFirestore(): Promise<Product[]> {
  try {
    const colRef = collection(db, PRODUCTS_COLLECTION);
    const snap = await getDocs(colRef);
    if (snap.empty) {
      // Seed default items on first launch
      await seedInitialProducts();
      const seededSnap = await getDocs(colRef);
      return seededSnap.docs.map((d) => d.data() as Product);
    }
    return snap.docs.map((d) => d.data() as Product);
  } catch (error) {
    console.error('Failed to fetch products from Firestore:', error);
    throw error;
  }
}

export async function saveProductToFirestore(product: Product): Promise<void> {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, product.id);
    const data = cleanObject({
      ...product,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(docRef, data, { merge: true });
  } catch (error) {
    console.error('Failed to save product to Firestore:', error);
    throw error;
  }
}

export async function deleteProductFromFirestore(productId: string): Promise<void> {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Failed to delete product from Firestore:', error);
    throw error;
  }
}

export async function adjustProductQuantityInFirestore(productId: string, delta: number): Promise<number> {
  const colRef = collection(db, PRODUCTS_COLLECTION);
  const docRef = doc(colRef, productId);
  const snap = await getDocs(colRef);
  const found = snap.docs.find(d => d.id === productId);
  if (!found) throw new Error('Produkten finns inte');
  const current = found.data() as Product;
  const newQty = Math.max(0, current.quantity + delta);
  await setDoc(docRef, { quantity: newQty, updatedAt: new Date().toISOString() }, { merge: true });
  return newQty;
}

export async function fetchShoppingItemsFromFirestore(): Promise<ShoppingItem[]> {
  try {
    const colRef = collection(db, SHOPPING_COLLECTION);
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => d.data() as ShoppingItem);
  } catch (error) {
    console.error('Failed to fetch shopping items from Firestore:', error);
    throw error;
  }
}

export async function saveShoppingItemToFirestore(item: ShoppingItem): Promise<void> {
  try {
    const docRef = doc(db, SHOPPING_COLLECTION, item.id);
    await setDoc(docRef, cleanObject(item), { merge: true });
  } catch (error) {
    console.error('Failed to save shopping item to Firestore:', error);
    throw error;
  }
}

export async function deleteShoppingItemFromFirestore(itemId: string): Promise<void> {
  try {
    const docRef = doc(db, SHOPPING_COLLECTION, itemId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Failed to delete shopping item from Firestore:', error);
    throw error;
  }
}

export async function restockFromShoppingInFirestore(items: { productId: string; addQty: number }[]): Promise<void> {
  const batch = writeBatch(db);
  for (const item of items) {
    const pRef = doc(db, PRODUCTS_COLLECTION, item.productId);
    // update locally
    batch.update(pRef, {
      quantity: item.addQty, // or increment
      updatedAt: new Date().toISOString(),
    });
  }
  await batch.commit();
}

export async function seedInitialProducts(): Promise<void> {
  const batch = writeBatch(db);
  for (const product of INITIAL_PRODUCTS) {
    const docRef = doc(db, PRODUCTS_COLLECTION, product.id);
    batch.set(docRef, cleanObject(product));
  }
  await batch.commit();
}

export function subscribeToProducts(callback: (products: Product[]) => void, onError?: (err: Error) => void): Unsubscribe {
  const colRef = collection(db, PRODUCTS_COLLECTION);
  return onSnapshot(colRef, (snap) => {
    const items = snap.docs.map((d) => d.data() as Product);
    callback(items);
  }, (err) => {
    console.warn('Firestore products listener error:', err);
    if (onError) onError(err);
  });
}

export function subscribeToShoppingItems(callback: (items: ShoppingItem[]) => void, onError?: (err: Error) => void): Unsubscribe {
  const colRef = collection(db, SHOPPING_COLLECTION);
  return onSnapshot(colRef, (snap) => {
    const items = snap.docs.map((d) => d.data() as ShoppingItem);
    callback(items);
  }, (err) => {
    console.warn('Firestore shopping listener error:', err);
    if (onError) onError(err);
  });
}
