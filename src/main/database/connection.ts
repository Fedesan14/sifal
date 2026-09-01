import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

export type StockDatabase = ReturnType<typeof drizzle<typeof schema>>
let database: StockDatabase | undefined

export function setDatabase(value: StockDatabase): void {
  database = value
}

export function getDatabase(): StockDatabase {
  if (!database) throw new Error('La base de datos no fue inicializada')
  return database
}
