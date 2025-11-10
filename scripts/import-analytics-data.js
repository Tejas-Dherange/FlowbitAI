import { neon } from "@neondatabase/serverless"
import * as dotenv from "dotenv"
import fs from "fs"

dotenv.config()

const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_POSTGRES_URL
if (!DATABASE_URL) {
  console.error("[Analytics Import] DATABASE_URL not set")
  process.exit(1)
}

const sql = neon(DATABASE_URL)

async function importAnalyticsData() {
  try {
    console.log("[Analytics Import] Loading Analytics_Test_Data.json...")
    const rawData = fs.readFileSync("./scripts/Analytics_Test_Data.json", "utf8")
    const analyticsData = JSON.parse(rawData)
    
    console.log(`[Analytics Import] Found ${analyticsData.length} records`)

    // Clear existing data
    console.log("[Analytics Import] Clearing existing data...")
    await sql`DELETE FROM payments`
    await sql`DELETE FROM line_items`
    await sql`DELETE FROM invoices`
    await sql`DELETE FROM customers`
    await sql`DELETE FROM vendors`
    console.log("[Analytics Import] Data cleared")

    // Alter line_items table to support decimal quantities
    console.log("[Analytics Import] Updating quantity column to support decimals...")
    await sql`ALTER TABLE line_items ALTER COLUMN quantity TYPE DECIMAL(10,2)`
    console.log("[Analytics Import] Quantity column updated")

    // Track vendors and customers to avoid duplicates
    const vendorMap = new Map()
    const customerMap = new Map()
    
    let processedCount = 0
    let skippedCount = 0

    for (const record of analyticsData) {
      try {
        const llmData = record.extractedData?.llmData
        if (!llmData || typeof llmData === 'string') {
          skippedCount++
          continue
        }

        // Extract vendor data
        const vendorData = llmData.vendor?.value
        const vendorName = vendorData?.vendorName?.value
        
        if (!vendorName) {
          skippedCount++
          continue
        }

        // Get or create vendor
        let vendorId
        if (vendorMap.has(vendorName)) {
          vendorId = vendorMap.get(vendorName)
        } else {
          const vendorResult = await sql`
            INSERT INTO vendors (name, email, phone, address)
            VALUES (
              ${vendorName},
              ${null},
              ${null},
              ${vendorData?.vendorAddress?.value || null}
            )
            RETURNING id
          `
          vendorId = vendorResult[0].id
          vendorMap.set(vendorName, vendorId)
        }

        // Extract customer data
        const customerData = llmData.customer?.value
        const customerName = customerData?.customerName?.value || 'Unknown Customer'
        
        // Get or create customer
        let customerId
        if (customerMap.has(customerName)) {
          customerId = customerMap.get(customerName)
        } else {
          const customerResult = await sql`
            INSERT INTO customers (name, email, phone, address)
            VALUES (
              ${customerName},
              ${null},
              ${null},
              ${customerData?.customerAddress?.value || null}
            )
            RETURNING id
          `
          customerId = customerResult[0].id
          customerMap.set(customerName, customerId)
        }

        // Extract invoice data
        const invoiceData = llmData.invoice?.value
        const summaryData = llmData.summary?.value
        const paymentData = llmData.payment?.value

        // Make invoice number unique by appending first 8 chars of record ID
        const baseInvoiceNum = invoiceData?.invoiceId?.value || 'INV'
        const invoiceNumber = `${baseInvoiceNum}-${record._id.slice(0, 8)}`
        const invoiceDate = invoiceData?.invoiceDate?.value || record.createdAt.$date.split('T')[0]
        
        // Calculate due date (30 days after invoice date if not specified)
        let dueDate = paymentData?.dueDate?.value
        if (!dueDate) {
          const invDate = new Date(invoiceDate)
          invDate.setDate(invDate.getDate() + 30)
          dueDate = invDate.toISOString().split('T')[0]
        }

        // Get amounts
        const subTotal = Math.abs(parseFloat(summaryData?.subTotal?.value) || 0)
        const totalTax = Math.abs(parseFloat(summaryData?.totalTax?.value) || 0)
        const total = Math.abs(parseFloat(summaryData?.invoiceTotal?.value) || subTotal + totalTax)

        // Determine status based on validation and payment
        let status = 'pending'
        if (record.isValidatedByHuman) {
          const now = new Date()
          const due = new Date(dueDate)
          if (due < now) {
            status = 'overdue'
          }
        }
        
        // Determine category (from line items if available)
        const lineItems = llmData.lineItems?.value?.items?.value || []
        const category = lineItems.length > 0 
          ? (lineItems[0].description?.value || '').includes('Software') ? 'Software'
          : (lineItems[0].description?.value || '').includes('Service') || (lineItems[0].description?.value || '').includes('Dienst') ? 'Services'
          : (lineItems[0].description?.value || '').includes('Hardware') || (lineItems[0].description?.value || '').includes('Teile') ? 'Hardware'
          : (lineItems[0].description?.value || '').includes('Beratung') || (lineItems[0].description?.value || '').includes('Consulting') ? 'Consulting'
          : 'Other'
          : 'Other'

        // Insert invoice
        const invoiceResult = await sql`
          INSERT INTO invoices (
            invoice_number, vendor_id, customer_id, invoice_date, due_date,
            subtotal, tax, total, status, category
          )
          VALUES (
            ${invoiceNumber}, ${vendorId}, ${customerId}, ${invoiceDate}, ${dueDate},
            ${subTotal}, ${totalTax}, ${total}, ${status}, ${category}
          )
          RETURNING id
        `
        const invoiceId = invoiceResult[0].id

        // Insert line items
        if (lineItems.length > 0) {
          for (const item of lineItems) {
            const description = item.description?.value || 'Item'
            const quantity = parseFloat(item.quantity?.value) || 1
            const unitPrice = Math.abs(parseFloat(item.unitPrice?.value) || 0)
            const amount = Math.abs(parseFloat(item.totalPrice?.value) || quantity * unitPrice)

            await sql`
              INSERT INTO line_items (invoice_id, description, quantity, unit_price, amount)
              VALUES (${invoiceId}, ${description}, ${quantity}, ${unitPrice}, ${amount})
            `
          }
        }

        // Insert payment if invoice is paid
        if (status === 'paid') {
          const paymentAmount = total
          await sql`
            INSERT INTO payments (invoice_id, payment_date, amount, payment_method)
            VALUES (${invoiceId}, ${invoiceDate}, ${paymentAmount}, ${'Bank Transfer'})
          `
        }

        processedCount++
        if (processedCount % 10 === 0) {
          console.log(`[Analytics Import] Processed ${processedCount}/${analyticsData.length} records...`)
        }

      } catch (error) {
        console.error(`[Analytics Import] Error processing record ${record._id}:`, error.message)
        skippedCount++
      }
    }

    console.log(`\n[Analytics Import] ✓ Import completed!`)
    console.log(`  - Processed: ${processedCount} invoices`)
    console.log(`  - Skipped: ${skippedCount} records`)
    console.log(`  - Vendors: ${vendorMap.size}`)
    console.log(`  - Customers: ${customerMap.size}`)
    
    process.exit(0)
  } catch (error) {
    console.error("[Analytics Import] ✗ Import failed:", error.message)
    process.exit(1)
  }
}

importAnalyticsData()
