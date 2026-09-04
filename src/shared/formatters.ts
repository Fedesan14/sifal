export function formatExpirationMonthInput(raw: string, previous: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 6)
  if (digits.length < 2) return digits

  // Permite borrar la barra para corregir el mes sin que la máscara la reponga.
  if (digits.length === 2 && previous === `${digits}/` && raw === digits) return digits

  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}
