import { check, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

const timestamps = {
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
}

export const medications = sqliteTable('medications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  group: text('group_name').notNull(),
  drug: text('drug').notNull(),
  dose: text('dose').notNull(),
  presentation: text('presentation').notNull(),
  commercialBrand: text('commercial_brand').notNull(),
  quantity: integer('quantity').notNull(),
  expirationDate: text('expiration_date').notNull(),
  acquisition: text('acquisition').notNull(),
  location: text('location').notNull(),
  ...timestamps
}, (table) => [check('medications_quantity_nonnegative', sql`${table.quantity} >= 0`)])

export const biomedicalSupplies = sqliteTable('biomedical_supplies', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  quantity: integer('quantity').notNull(),
  expirationDate: text('expiration_date').notNull(),
  location: text('location').notNull(),
  ...timestamps
}, (table) => [check('biomedical_supplies_quantity_nonnegative', sql`${table.quantity} >= 0`)])
