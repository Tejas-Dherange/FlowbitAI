import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL || "")

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "monthly"

    const result = await sql`
      SELECT
        TO_CHAR(invoice_date, 'Mon YYYY') as period,
        COUNT(*) as count,
        COALESCE(SUM(total), 0) as value
      FROM invoices
      WHERE invoice_date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY TO_CHAR(invoice_date, 'Mon YYYY'), DATE_TRUNC('month', invoice_date)
      ORDER BY DATE_TRUNC('month', invoice_date) ASC
    `

    // Get current month data
    const currentMonthResult = await sql`
      SELECT
        TO_CHAR(CURRENT_DATE, 'Month YYYY') as period,
        COUNT(*) as count,
        COALESCE(SUM(total), 0) as value
      FROM invoices
      WHERE DATE_TRUNC('month', invoice_date) = DATE_TRUNC('month', CURRENT_DATE)
    `

    return Response.json({
      data: result.map((row) => ({
        period: row.period,
        count: row.count,
        value: Number.parseFloat(row.value),
      })),
      currentMonth: {
        period: currentMonthResult[0]?.period?.trim() || "Current Month",
        count: currentMonthResult[0]?.count || 0,
        value: Number.parseFloat(currentMonthResult[0]?.value || "0"),
      },
    })
  } catch (error) {
    console.error("Trends error:", error)
    return Response.json({ error: "Failed to fetch trends" }, { status: 500 })
  }
}
