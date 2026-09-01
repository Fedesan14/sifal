import type { ApiResult } from '../../shared/types/entities'

export async function safeHandler<T>(operation: () => T | Promise<T>): Promise<ApiResult<T>> {
  try { return { ok: true, data: await operation() } }
  catch (error) {
    console.error('[IPC]', error)
    if (error instanceof Error && error.message === 'NOT_FOUND') return { ok: false, error: { code: 'NOT_FOUND', message: 'El registro solicitado no existe.' } }
    if (error instanceof Error && error.name === 'ZodError') return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Los datos ingresados no son válidos.' } }
    return { ok: false, error: { code: 'INTERNAL_ERROR', message: 'No se pudo completar la operación.' } }
  }
}
