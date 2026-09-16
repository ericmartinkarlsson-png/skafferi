import { pgTable, text, integer, timestamp, serial } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const products = pgTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(), // 'kylskåp' | 'skafferi' | 'förbrukning' | 'övrigt'
  quantity: integer('quantity').notNull().default(0),
  unit: text('unit').notNull().default('st'),
  expirationDate: text('expiration_date').default(''),
  minQuantity: integer('min_quantity').notNull().default(1),
  barcode: text('barcode'),
  locationDetails: text('location_details'),
  notes: text('notes'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const manualShoppingItems = pgTable('manual_shopping_items', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  neededQuantity: integer('needed_quantity').notNull().default(1),
  unit: text('unit').notNull().default('st'),
  isChecked: integer('is_checked').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
});
