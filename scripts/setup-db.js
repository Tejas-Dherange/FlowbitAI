import { neon } from "@neondatabase/serverless"
import * as dotenv from "dotenv"

// Load environment variables from .env file
dotenv.config()

const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_POSTGRES_URL
if (!DATABASE_URL) {
  console.error("[v0] DATABASE_URL environment variable not set")
  console.error("[v0] Available env vars:", Object.keys(process.env).filter(k => k.includes('NEON')))
  process.exit(1)
}

const sql = neon(DATABASE_URL)

async function setupDatabase() {
  try {
    console.log("[v0] Starting database setup...")

    // Step 1: Create tables
    console.log("[v0] Creating vendors table...")
    await sql`
      CREATE TABLE IF NOT EXISTS vendors (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    console.log("[v0] Creating customers table...")
    await sql`
      CREATE TABLE IF NOT EXISTS customers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    console.log("[v0] Creating invoices table...")
    await sql`
      CREATE TABLE IF NOT EXISTS invoices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        invoice_number TEXT UNIQUE NOT NULL,
        vendor_id UUID REFERENCES vendors(id),
        customer_id UUID REFERENCES customers(id),
        invoice_date DATE NOT NULL,
        due_date DATE,
        subtotal DECIMAL(12,2),
        tax DECIMAL(12,2),
        total DECIMAL(12,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        category TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    console.log("[v0] Creating line_items table...")
    await sql`
      CREATE TABLE IF NOT EXISTS line_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
        description TEXT,
        quantity INTEGER,
        unit_price DECIMAL(12,2),
        amount DECIMAL(12,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    console.log("[v0] Creating payments table...")
    await sql`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        invoice_id UUID REFERENCES invoices(id),
        payment_date DATE,
        amount DECIMAL(12,2),
        payment_method TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    console.log("[v0] Creating indexes...")
    await sql`CREATE INDEX IF NOT EXISTS idx_invoices_vendor_id ON invoices(vendor_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date)`
    await sql`CREATE INDEX IF NOT EXISTS idx_line_items_invoice_id ON line_items(invoice_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id)`

    console.log("[v0] Tables created successfully")

    // Check if data already exists
    console.log("[v0] Checking if data already exists...")
    const existingInvoices = await sql`SELECT COUNT(*) as count FROM invoices`
    const invoiceCount = Number(existingInvoices[0].count)
    
    if (invoiceCount > 0) {
      console.log(`[v0] Database already contains ${invoiceCount} invoices. Skipping seed data.`)
      console.log("[v0] ✓ Database setup completed successfully!")
      process.exit(0)
    }

    // Step 2: Seed data
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

    console.log("[v0] Inserting invoice data...")
    const categories = ["Software", "Hardware", "Services", "Consulting", "Maintenance"]
    const statuses = ["pending", "paid", "overdue", "partially_paid"]

    // Insert 50 invoices with CURRENT dates
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth()
    
    for (let i = 0; i < 50; i++) {
      const vendorId = vendorIds[Math.floor(Math.random() * vendorIds.length)]
      const customerId = customerIds[Math.floor(Math.random() * customerIds.length)]
      
      // Generate dates within the last 12 months and next 3 months
      const monthsAgo = Math.floor(Math.random() * 12) // 0-11 months ago
      const invoiceDate = new Date(currentYear, currentMonth - monthsAgo, Math.floor(Math.random() * 28) + 1)
      const dueDate = new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days after invoice
      
      const quantity = Math.floor(Math.random() * 10) + 1
      const unitPrice = Math.floor(Math.random() * 5000) + 100
      const subtotal = quantity * unitPrice
      const tax = Math.round(subtotal * 0.1)
      const total = subtotal + tax
      const status = statuses[Math.floor(Math.random() * statuses.length)]
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

        await sql`
          INSERT INTO payments (invoice_id, payment_date, amount, payment_method) 
          VALUES (${invoiceId}, ${new Date().toISOString().split("T")[0]}, ${paymentAmount}, ${paymentMethod})
        `
      }
    }
    console.log("[v0] Seeded 50 invoices with line items and payments")

    console.log("[v0] ✓ Database setup completed successfully!")
    process.exit(0)
  } catch (error) {
    console.error("[v0] ✗ Database setup failed:", error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

setupDatabase()
