import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL || "")

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const statusParam = searchParams.get("status")
    // Filter out 'all' status - treat it as no filter
    const status = statusParam && statusParam !== "all" ? statusParam : null
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const sortBy = searchParams.get("sortBy") || "invoice_date"
    const order = (searchParams.get("order") || "DESC").toUpperCase()

    // Validate sortBy and order to prevent SQL injection
    const validSortColumns = ["invoice_date", "total", "status", "invoice_number"]
    const validOrders = ["ASC", "DESC"]
    const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : "invoice_date"
    const safeOrder = validOrders.includes(order) ? order : "DESC"

    const offset = (page - 1) * limit

    // Build queries using string templates with validated identifiers
    let invoicesQuery, countQuery

    if (search && status) {
      const searchPattern = `%${search}%`
      invoicesQuery = sql`
        SELECT
          i.id,
          i.invoice_number,
          i.vendor_id,
          v.name as vendor_name,
          i.invoice_date,
          i.total,
          i.status
        FROM invoices i
        LEFT JOIN vendors v ON i.vendor_id = v.id
        WHERE (i.invoice_number ILIKE ${searchPattern} OR v.name ILIKE ${searchPattern})
        AND i.status = ${status}
        ORDER BY i.invoice_date DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      countQuery = sql`
        SELECT COUNT(*) as total FROM invoices i
        LEFT JOIN vendors v ON i.vendor_id = v.id
        WHERE (i.invoice_number ILIKE ${searchPattern} OR v.name ILIKE ${searchPattern})
        AND i.status = ${status}
      `
    } else if (search) {
      const searchPattern = `%${search}%`
      invoicesQuery = sql`
        SELECT
          i.id,
          i.invoice_number,
          i.vendor_id,
          v.name as vendor_name,
          i.invoice_date,
          i.total,
          i.status
        FROM invoices i
        LEFT JOIN vendors v ON i.vendor_id = v.id
        WHERE (i.invoice_number ILIKE ${searchPattern} OR v.name ILIKE ${searchPattern})
        ORDER BY i.invoice_date DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      countQuery = sql`
        SELECT COUNT(*) as total FROM invoices i
        LEFT JOIN vendors v ON i.vendor_id = v.id
        WHERE (i.invoice_number ILIKE ${searchPattern} OR v.name ILIKE ${searchPattern})
      `
    } else if (status) {
      invoicesQuery = sql`
        SELECT
          i.id,
          i.invoice_number,
          i.vendor_id,
          v.name as vendor_name,
          i.invoice_date,
          i.total,
          i.status
        FROM invoices i
        LEFT JOIN vendors v ON i.vendor_id = v.id
        WHERE i.status = ${status}
        ORDER BY i.invoice_date DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      countQuery = sql`
        SELECT COUNT(*) as total FROM invoices i
        LEFT JOIN vendors v ON i.vendor_id = v.id
        WHERE i.status = ${status}
      `
    } else {
      invoicesQuery = sql`
        SELECT
          i.id,
          i.invoice_number,
          i.vendor_id,
          v.name as vendor_name,
          i.invoice_date,
          i.total,
          i.status
        FROM invoices i
        LEFT JOIN vendors v ON i.vendor_id = v.id
        ORDER BY i.invoice_date DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      countQuery = sql`
        SELECT COUNT(*) as total FROM invoices i
        LEFT JOIN vendors v ON i.vendor_id = v.id
      `
    }

    const [invoices, countResult] = await Promise.all([invoicesQuery, countQuery])

    const total = Number(countResult[0]?.total || 0)
    const totalPages = Math.ceil(total / limit)

    return Response.json({
      invoices: invoices.map((row) => ({
        id: row.id,
        invoiceNumber: row.invoice_number,
        vendor: { id: row.vendor_id, name: row.vendor_name },
        date: row.invoice_date,
        amount: Number.parseFloat(row.total),
        status: row.status,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    })
  } catch (error) {
    console.error("Invoices error:", error)
    return Response.json({ error: "Failed to fetch invoices" }, { status: 500 })
  }
}
