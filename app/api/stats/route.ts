import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL || "")

export async function GET() {
  try {
    // Get current year stats
    const currentYear = new Date().getFullYear()
    const result = await sql`
      SELECT
        COALESCE(SUM(total), 0) as total_spend,
        COUNT(*) as total_invoices,
        COUNT(DISTINCT vendor_id) as vendor_count,
        COALESCE(AVG(total), 0) as avg_invoice
      FROM invoices
      WHERE EXTRACT(YEAR FROM invoice_date) = ${currentYear}
    `

    const currentStats = result[0]

    // Get previous year for comparison
    const previousYear = currentYear - 1
    const prevResult = await sql`
      SELECT
        COALESCE(SUM(total), 0) as total_spend,
        COUNT(*) as total_invoices,
        COALESCE(AVG(total), 0) as avg_invoice
      FROM invoices
      WHERE EXTRACT(YEAR FROM invoice_date) = ${previousYear}
    `

    const prevStats = prevResult[0] || { total_spend: 0, total_invoices: 0, avg_invoice: 0 }

    const spendChange =
      prevStats.total_spend !== 0
        ? Number(((currentStats.total_spend - prevStats.total_spend) / prevStats.total_spend) * 100).toFixed(1)
        : "0"

    const invoiceChange =
      prevStats.total_invoices !== 0
        ? Number(((currentStats.total_invoices - prevStats.total_invoices) / prevStats.total_invoices) * 100).toFixed(1)
        : "0"

    const avgValueChange =
      prevStats.avg_invoice !== 0
        ? Number(((currentStats.avg_invoice - prevStats.avg_invoice) / prevStats.avg_invoice) * 100).toFixed(1)
        : "0"

    // Get sparkline data for last 12 months
    const sparklineResult = await sql`
      WITH months AS (
        SELECT generate_series(
          date_trunc('month', CURRENT_DATE - INTERVAL '11 months'),
          date_trunc('month', CURRENT_DATE),
          '1 month'::interval
        ) AS month
      )
      SELECT 
        TO_CHAR(months.month, 'Mon') as month_name,
        EXTRACT(MONTH FROM months.month) as month_num,
        COALESCE(SUM(i.total), 0) as total_spend,
        COUNT(i.id) as invoice_count,
        COALESCE(AVG(i.total), 0) as avg_value
      FROM months
      LEFT JOIN invoices i ON date_trunc('month', i.invoice_date) = months.month
      GROUP BY months.month
      ORDER BY months.month
    `

    // Extract sparkline arrays
    const spendSparkline = sparklineResult.map(row => parseFloat(row.total_spend))
    const invoiceSparkline = sparklineResult.map(row => parseInt(row.invoice_count))
    const avgValueSparkline = sparklineResult.map(row => parseFloat(row.avg_value))

    // Get documents uploaded this month
    const currentMonth = new Date().getMonth() + 1
    const documentsThisMonth = await sql`
      SELECT COUNT(DISTINCT vendor_id) as count
      FROM invoices
      WHERE EXTRACT(YEAR FROM invoice_date) = ${currentYear}
        AND EXTRACT(MONTH FROM invoice_date) = ${currentMonth}
    `

    const documentsLastMonth = await sql`
      SELECT COUNT(DISTINCT vendor_id) as count
      FROM invoices
      WHERE EXTRACT(YEAR FROM invoice_date) = ${currentYear}
        AND EXTRACT(MONTH FROM invoice_date) = ${currentMonth - 1}
    `

    const docChange = documentsLastMonth[0]?.count !== 0
      ? Number(((documentsThisMonth[0].count - documentsLastMonth[0].count) / documentsLastMonth[0].count) * 100).toFixed(1)
      : "0"

    return Response.json({
      totalSpend: Number.parseFloat(currentStats.total_spend),
      totalInvoices: currentStats.total_invoices,
      documentsUploaded: documentsThisMonth[0]?.count || 0,
      averageInvoiceValue: Number.parseFloat(currentStats.avg_invoice),
      trends: {
        spendChange: Number.parseFloat(spendChange),
        invoiceChange: Number.parseFloat(invoiceChange),
        documentChange: Number.parseFloat(docChange),
        avgValueChange: Number.parseFloat(avgValueChange),
      },
      sparklines: {
        spend: spendSparkline,
        invoices: invoiceSparkline,
        avgValue: avgValueSparkline,
      },
    })
  } catch (error) {
    console.error("Stats error:", error)
    return Response.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
