import { neon } from "@neondatabase/serverless"
import * as dotenv from "dotenv"

dotenv.config()

const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_POSTGRES_URL
if (!DATABASE_URL) {
  console.error("[v0] DATABASE_URL environment variable not set")
  process.exit(1)
}

const sql = neon(DATABASE_URL)

async function reseedDatabase() {
  try {
    console.log("[v0] Starting database reseed...")

    // Delete existing data
    console.log("[v0] Clearing existing data...")
    await sql`DELETE FROM payments`
    await sql`DELETE FROM line_items`
    await sql`DELETE FROM invoices`
    await sql`DELETE FROM customers`
    await sql`DELETE FROM vendors`
    console.log("[v0] Existing data cleared")

    // Insert vendors
    console.log("[v0] Inserting vendor data...")
    const vendorResults = await sql`
      INSERT INTO vendors (name, email, phone, address) VALUES
      ('Acme Corporation', 'billing@acme.com', '+1-555-0100', '123 Business Ave, New York, NY'),
      ('TechSupply Inc', 'orders@techsupply.com', '+1-555-0200', '456 Tech Park, San Francisco, CA'),
      ('Global Logistics', 'accounts@logistics.com', '+1-555-0300', '789 Trade Center, Houston, TX'),
      ('Premium Services LLC', 'support@premserv.com', '+1-555-0400', '321 Excellence Dr, Chicago, IL'),
      ('DataTech Solutions', 'invoices@datatech.com', '+1-555-0500', '654 Innovation Way, Austin, TX')
      RETURNING id
    `
    const vendorIds = vendorResults.map((r) => r.id)
    console.log(`[v0] Seeded ${vendorIds.length} vendors`)

    // Insert customers
    console.log("[v0] Inserting customer data...")
    const customerResults = await sql`
      INSERT INTO customers (name, email, phone, address) VALUES
      ('Innovation Labs', 'finance@innolabs.com', '+1-555-1000', '100 Future Blvd, Seattle, WA'),
      ('Digital Solutions LLC', 'accounts@digsol.com', '+1-555-2000', '200 Smart St, Boston, MA'),
      ('Enterprise Corp', 'finance@entcorp.com', '+1-555-3000', '300 Corporate Blvd, Denver, CO'),
      ('Tech Startups Inc', 'billing@techstart.com', '+1-555-4000', '400 Innovation St, San Jose, CA')
      RETURNING id
    `
    const customerIds = customerResults.map((r) => r.id)
    console.log(`[v0] Seeded ${customerIds.length} customers`)

    // Insert invoices with current dates
    console.log("[v0] Inserting invoice data...")
    const categories = ["Software", "Hardware", "Services", "Consulting", "Maintenance"]
    const statuses = ["pending", "paid", "overdue", "partially_paid"]

    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth()
    let invoiceCount = 0

    for (let i = 0; i < 50; i++) {
      const vendorId = vendorIds[Math.floor(Math.random() * vendorIds.length)]
      const customerId = customerIds[Math.floor(Math.random() * customerIds.length)]
      
      // Generate dates: 80% in past 12 months, 20% in next 3 months
      const isFuture = Math.random() < 0.2
      let invoiceDate, dueDate
      
      if (isFuture) {
        // Future invoice (next 3 months)
        const monthsAhead = Math.floor(Math.random() * 3)
        invoiceDate = new Date(currentYear, currentMonth + monthsAhead, Math.floor(Math.random() * 28) + 1)
        dueDate = new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000)
      } else {
        // Past invoice (last 12 months)
        const monthsAgo = Math.floor(Math.random() * 12)
        invoiceDate = new Date(currentYear, currentMonth - monthsAgo, Math.floor(Math.random() * 28) + 1)
        dueDate = new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000)
      }
      
      const quantity = Math.floor(Math.random() * 10) + 1
      const unitPrice = Math.floor(Math.random() * 5000) + 100
      const subtotal = quantity * unitPrice
      const tax = Math.round(subtotal * 0.1)
      const total = subtotal + tax
      
      // Set status based on date
      let status
      const now = new Date()
      if (dueDate > now) {
        // Future due date - pending or partially_paid
        status = Math.random() < 0.7 ? 'pending' : 'partially_paid'
      } else {
        // Past due date - could be any status
        status = statuses[Math.floor(Math.random() * statuses.length)]
      }
      
      const category = categories[Math.floor(Math.random() * categories.length)]

      const invoiceResult = await sql`
        INSERT INTO invoices 
        (invoice_number, vendor_id, customer_id, invoice_date, due_date, subtotal, tax, total, status, category) 
        VALUES 
        (${`INV-${String(i + 1000).slice(-4)}`}, ${vendorId}, ${customerId}, ${invoiceDate.toISOString().split("T")[0]}, ${dueDate.toISOString().split("T")[0]}, ${subtotal}, ${tax}, ${total}, ${status}, ${category})
        RETURNING id
      `
      const invoiceId = invoiceResult[0].id

      // Add line items
      const descriptions = [
        "Software License",
        "Consulting Services",
        "Hardware Equipment",
        "Support Services",
        "Training",
        "Setup Fee",
      ]
      const lineItemCount = Math.floor(Math.random() * 3) + 1
      for (let j = 0; j < lineItemCount; j++) {
        const liQuantity = Math.floor(Math.random() * 5) + 1
        const liUnitPrice = Math.floor(Math.random() * 1000) + 50
        const liAmount = liQuantity * liUnitPrice
        const description = descriptions[Math.floor(Math.random() * descriptions.length)]

        await sql`
          INSERT INTO line_items (invoice_id, description, quantity, unit_price, amount) 
          VALUES (${invoiceId}, ${description}, ${liQuantity}, ${liUnitPrice}, ${liAmount})
        `
      }

      // Add payment if applicable
      if (status === "paid" || status === "partially_paid") {
        const paymentAmount = status === "paid" ? total : Math.round(total * 0.5)
        const paymentMethods = ["credit_card", "bank_transfer", "check"]
        const paymentMethod = paymentMethods[Math.floor(Math.random() * 3)]
        const paymentDate = new Date(invoiceDate.getTime() + Math.floor(Math.random() * 20) * 24 * 60 * 60 * 1000)

        await sql`
          INSERT INTO payments (invoice_id, payment_date, amount, payment_method) 
          VALUES (${invoiceId}, ${paymentDate.toISOString().split("T")[0]}, ${paymentAmount}, ${paymentMethod})
        `
      }

      invoiceCount++
      if (invoiceCount % 10 === 0) {
        console.log(`[v0] Seeded ${invoiceCount}/50 invoices...`)
      }
    }
    
    console.log(`[v0] Seeded ${invoiceCount} invoices with line items and payments`)
    console.log("[v0] ✓ Database reseed completed successfully!")
    process.exit(0)
  } catch (error) {
    console.error("[v0] ✗ Database reseed failed:", error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

reseedDatabase()
