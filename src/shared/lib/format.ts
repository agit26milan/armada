const decimalFormatter = new Intl.NumberFormat('id-ID')

export function formatNumber(value: number): string {
  return decimalFormatter.format(value)
}
