import { z } from 'zod'

const requiredText = z.string().trim().min(1, 'Este campo es obligatorio')
const expirationMonth = z.string().regex(/^\d{2}\/\d{4}$/, 'El vencimiento debe tener formato MM/AAAA').refine((value) => {
  const [month, year] = value.split('/').map(Number)
  return year >= 1000 && month >= 1 && month <= 12
}, 'El mes de vencimiento no es válido')

export const idSchema = z.number().int().positive('El ID debe ser un entero positivo')
export const medicationInputSchema = z.object({
  group: requiredText,
  drug: requiredText,
  dose: requiredText,
  presentation: requiredText,
  commercialBrand: requiredText,
  quantity: z.number().int().min(0, 'La cantidad no puede ser negativa'),
  expirationDate: expirationMonth,
  acquisition: requiredText,
  location: requiredText
}).strict()
export const biomedicalSupplyInputSchema = z.object({
  name: requiredText,
  expirationDate: expirationMonth,
  stocks: z.array(z.object({
    ubicacionId: idSchema,
    cantidad: z.number().int().min(0, 'La cantidad no puede ser negativa')
  }).strict())
    .refine((items) => new Set(items.map((item) => item.ubicacionId)).size === items.length, 'No se puede repetir una ubicación')
}).strict()

export const namedEntityInputSchema = z.object({ name: requiredText }).strict()
export const presentacionInputSchema = z.object({
  name: requiredText
}).strict()
export const dosisInputSchema = z.object({ name: requiredText, presentacionId: idSchema }).strict()
export const ubicacionInputSchema = z.object({ nombre: requiredText }).strict()
export const drogaInputSchema = z.object({
  name: requiredText,
  grupoId: idSchema
}).strict()
export const medicamentoInputSchema = z.object({
  drogaId: idSchema,
  fechaVencimiento: expirationMonth,
  marcaId: idSchema,
  presentacionId: idSchema,
  dosisId: idSchema,
  stocks: z.array(z.object({
    ubicacionId: idSchema,
    cantidad: z.number().int().min(0, 'La cantidad no puede ser negativa')
  }).strict())
    .refine((items) => new Set(items.map((item) => item.ubicacionId)).size === items.length, 'No se puede repetir una ubicación')
}).strict()
