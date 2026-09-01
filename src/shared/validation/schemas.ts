import { z } from 'zod'

const requiredText = z.string().trim().min(1, 'Este campo es obligatorio')
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato AAAA-MM-DD').refine((value) => {
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}, 'La fecha no es válida')

export const idSchema = z.number().int().positive('El ID debe ser un entero positivo')
export const medicationInputSchema = z.object({
  group: requiredText,
  drug: requiredText,
  dose: requiredText,
  presentation: requiredText,
  commercialBrand: requiredText,
  quantity: z.number().int().min(0, 'La cantidad no puede ser negativa'),
  expirationDate: date,
  acquisition: requiredText,
  location: requiredText
}).strict()
export const biomedicalSupplyInputSchema = z.object({
  name: requiredText,
  quantity: z.number().int().min(0, 'La cantidad no puede ser negativa'),
  expirationDate: date,
  location: requiredText
}).strict()

export const namedEntityInputSchema = z.object({ name: requiredText }).strict()
export const presentacionInputSchema = z.object({
  name: requiredText,
  dosisId: idSchema
}).strict()
export const ubicacionInputSchema = z.discriminatedUnion('tipo', [
  z.object({ tipo: z.literal('TAQUILLA'), nombre: requiredText, numero: z.number().int() }).strict(),
  z.object({ tipo: z.literal('PANOL'), nombre: requiredText }).strict()
])
export const drogaInputSchema = z.object({
  name: requiredText,
  cantidad: z.number().int().min(0, 'La cantidad no puede ser negativa'),
  fechaVencimiento: date,
  grupoId: idSchema,
  marcaId: idSchema,
  presentacionId: idSchema,
  ubicacionId: idSchema
}).strict()
