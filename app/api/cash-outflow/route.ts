import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL || "")

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const days = Number.parseInt(searchParams.get("days") || "90")

    const result = await sql`
      SELECT
        DATE_TRUNC('week', due_date)::DATE as week_start,
        COALESCE(SUM(total), 0) as amount
      FROM invoices
      WHERE due_date >= CURRENT_DATE
        AND due_date <= CURRENT_DATE + INTERVAL '1 day' * ${days}
        AND status != 'paid'
      GROUP BY DATE_TRUNC('week', due_date)
      ORDER BY week_start ASC
    `

    return Response.json({
      forecast: result.map((row, idx) => ({
        period: `Week ${idx + 1}`,
        amount: Number.parseFloat(row.amount),
      })),
    })
  } catch (error) {
    console.error("Cash outflow error:", error)
    return Response.json({ error: "Failed to fetch forecast" }, { status: 500 })
  }
}
