import { neon } from "@neondatabase/serverless"
import { generateSQL } from "@/lib/sql-generator"
import { vannaAI } from "@/lib/vanna-client"

const sql = neon(process.env.DATABASE_URL || "")

function validateQuery(query: string): { valid: boolean; error?: string } {
  if (!query || query.trim().length === 0) {
    return { valid: false, error: "Query cannot be empty" }
  }
  if (query.length > 1000) {
    return { valid: false, error: "Query too long (max 1000 characters)" }
  }
  return { valid: true }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { query } = body

    // Validate input
    const validation = validateQuery(query)
    if (!validation.valid) {
      return Response.json({ error: validation.error }, { status: 400 })
    }

    // Generate SQL using Vanna AI
    const generatedSQL = await generateSQL(query)

    if (!generatedSQL || !generatedSQL.trim()) {
      return Response.json({ error: "Could not generate SQL from query" }, { status: 400 })
    }

    if (!isSafeSQL(generatedSQL)) {
      return Response.json({ error: "Query contains unsupported operations" }, { status: 400 })
    }

    // Get SQL explanation from Vanna AI
    let explanation = ""
    try {
      explanation = await vannaAI.explainSQL(generatedSQL)
    } catch (error) {
      console.error("Failed to get SQL explanation:", error)
      // Don't fail the request if explanation fails
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    try {
      // Execute the SQL query using a template literal
      const results = await sql`${generatedSQL}`

      clearTimeout(timeoutId)

      const limitedResults = results.slice(0, 1000)
      const columns = results.length > 0 ? Object.keys(results[0]) : []

      return Response.json({
        sql: generatedSQL,
        explanation, // Include the explanation in the response
        results: limitedResults,
        columns,
        rowCount: limitedResults.length,
        truncated: results.length > 1000,
      })
    } catch (error) {
      clearTimeout(timeoutId)
      console.error("Query execution error:", error)
      return Response.json({ error: "Failed to execute query" }, { status: 500 })
    }
  } catch (error) {
    console.error("Chat error:", error)
    return Response.json({ error: "Failed to process request" }, { status: 500 })
  }
}

function isSafeSQL(sql: string): boolean {
  const upperSQL = sql.toUpperCase()
  // Block write operations
  const dangerousKeywords = ["DROP", "DELETE", "UPDATE", "INSERT", "TRUNCATE", "ALTER", "CREATE"]
  return !dangerousKeywords.some((keyword) => upperSQL.includes(keyword))
}
