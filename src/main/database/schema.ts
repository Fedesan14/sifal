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

function namedTable(name: string) {
  return sqliteTable(name, {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    ...timestamps
  })
}

export const grupos = namedTable('grupos')
export const marcas = namedTable('marcas')
export const dosis = namedTable('dosis')

export const presentaciones = sqliteTable('presentaciones', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  dosisId: integer('dosis_id').notNull().references(() => dosis.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  ...timestamps
})

export const ubicaciones = sqliteTable('ubicaciones', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tipo: text('tipo', { enum: ['TAQUILLA', 'PANOL'] }).notNull(),
  nombre: text('nombre').notNull(),
  numero: integer('numero'),
  ...timestamps
}, (table) => [
  check('ubicaciones_tipo_valido', sql`${table.tipo} IN ('TAQUILLA', 'PANOL')`),
  check('ubicaciones_atributos_por_tipo', sql`(${table.tipo} = 'TAQUILLA' AND ${table.numero} IS NOT NULL) OR (${table.tipo} = 'PANOL' AND ${table.numero} IS NULL)`)
])

export const drogas = sqliteTable('drogas', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  cantidad: integer('cantidad').notNull(),
  fechaVencimiento: text('fecha_vencimiento').notNull(),
  grupoId: integer('grupo_id').notNull().references(() => grupos.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  marcaId: integer('marca_id').notNull().references(() => marcas.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  presentacionId: integer('presentacion_id').notNull().references(() => presentaciones.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  ubicacionId: integer('ubicacion_id').notNull().references(() => ubicaciones.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  ...timestamps
}, (table) => [check('drogas_cantidad_nonnegative', sql`${table.cantidad} >= 0`)])
