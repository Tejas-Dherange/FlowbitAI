import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL || "")

export async function GET() {
  try {
    const result = await sql`
      SELECT
        v.id,
        v.name,
        COALESCE(SUM(i.total), 0) as total_spend,
        COUNT(i.id) as invoice_count
      FROM vendors v
      LEFT JOIN invoices i ON v.id = i.vendor_id
      GROUP BY v.id, v.name
      ORDER BY total_spend DESC
      LIMIT 10
    `

    return Response.json({
      vendors: result.map((row) => ({
        id: row.id,
        name: row.name,
        totalSpend: Number.parseFloat(row.total_spend),
        invoiceCount: row.invoice_count,
      })),
    })
  } catch (error) {
    console.error("Top vendors error:", error)
    return Response.json({ error: "Failed to fetch vendors" }, { status: 500 })
  }
}
