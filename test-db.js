import { neon } from "@neondatabase/serverless"
import * as dotenv from "dotenv"

dotenv.config()

const sql = neon(process.env.DATABASE_URL)

async function testDatabase() {
  console.log("Testing database...")
  
  // Count invoices
  const invoiceCount = await sql`SELECT COUNT(*) as count FROM invoices`
  console.log(`Total invoices: ${invoiceCount[0].count}`)
  
  // Sample invoices
  const invoices = await sql`
    SELECT 
      invoice_number, 
      invoice_date, 
      due_date, 
      total, 
      status 
    FROM invoices 
    LIMIT 5
  `
  console.log("\nSample invoices:")
  console.table(invoices)
  
  // Check date ranges
  const dateRange = await sql`
    SELECT 
      MIN(invoice_date) as earliest_invoice,
      MAX(invoice_date) as latest_invoice,
      MIN(due_date) as earliest_due,
      MAX(due_date) as latest_due
    FROM invoices
  `
  console.log("\nDate ranges:")
  console.table(dateRange)
  
  // Status breakdown
  const statusBreakdown = await sql`
    SELECT status, COUNT(*) as count 
    FROM invoices 
    GROUP BY status
  `
  console.log("\nStatus breakdown:")
  console.table(statusBreakdown)
  
  // Future due dates
  const futureInvoices = await sql`
    SELECT COUNT(*) as count
    FROM invoices
    WHERE due_date >= CURRENT_DATE
    AND status != 'paid'
  `
  console.log(`\nFuture unpaid invoices: ${futureInvoices[0].count}`)
  
  process.exit(0)
}

testDatabase().catch(err => {
  console.error("Error:", err)
  process.exit(1)
})
