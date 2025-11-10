import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL || "")

export async function GET() {
  try {
    const result = await sql`
      SELECT
        category,
        COALESCE(SUM(total), 0) as amount,
        COUNT(*) as count
      FROM invoices
      WHERE category IS NOT NULL
      GROUP BY category
      ORDER BY amount DESC
    `

    const total = result.reduce((sum, row) => sum + Number.parseFloat(row.amount), 0)

    return Response.json({
      categories: result.map((row) => ({
        category: row.category,
        amount: Number.parseFloat(row.amount),
        percentage: total > 0 ? ((Number.parseFloat(row.amount) / total) * 100).toFixed(1) : 0,
      })),
    })
  } catch (error) {
    console.error("Category spend error:", error)
    return Response.json({ error: "Failed to fetch category data" }, { status: 500 })
  }
}
