export interface QueryResult {
  sql: string
  results: Record<string, any>[]
  columns: string[]
  rowCount: number
  truncated?: boolean
  error?: string
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value)
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateString))
}

export function formatNumber(value: number): string {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + "M"
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(1) + "K"
  }
  return value.toFixed(0)
}

export function isNumericColumn(columnName: string, values: any[]): boolean {
  const numericKeywords = ["amount", "total", "spend", "cost", "price", "value", "count", "sum"]
  const lowerName = columnName.toLowerCase()

  if (numericKeywords.some((keyword) => lowerName.includes(keyword))) {
    return true
  }

  // Check if all non-null values are numbers
  return values.filter((v) => v !== null).every((v) => typeof v === "number")
}

export function getColumnFormatter(columnName: string, values: any[]) {
  const lowerName = columnName.toLowerCase()

  if (lowerName.includes("date")) {
    return formatDate
  }

  if (lowerName.includes("total") || lowerName.includes("amount") || lowerName.includes("spend")) {
    return formatCurrency
  }

  if (lowerName.includes("count") || lowerName.includes("number")) {
    return (v: any) => (typeof v === "number" ? formatNumber(v) : v)
  }

  return (v: any) => v
}
