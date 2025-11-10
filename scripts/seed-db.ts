import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL || "")

async function seed() {
  console.log("Starting database seed...")

  try {
    // Clear existing data
    await sql("DELETE FROM payments")
    await sql("DELETE FROM line_items")
    await sql("DELETE FROM invoices")
    await sql("DELETE FROM customers")
    await sql("DELETE FROM vendors")

    // Insert vendors
    const vendors = await Promise.all([
      sql(
        `
        INSERT INTO vendors (name, email, phone, address)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name
      `,
        ["Acme Corporation", "billing@acme.com", "+1-555-0100", "123 Business Ave"],
      ),
      sql(
        `
        INSERT INTO vendors (name, email, phone, address)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name
      `,
        ["TechSupply Inc", "orders@techsupply.com", "+1-555-0200", "456 Tech Park"],
      ),
      sql(
        `
        INSERT INTO vendors (name, email, phone, address)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name
      `,
        ["Global Logistics", "accounts@logistics.com", "+1-555-0300", "789 Trade Center"],
      ),
    ])

    // Insert customers
    const customers = await Promise.all([
      sql(
        `
        INSERT INTO customers (name, email, phone, address)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name
      `,
        ["Innovation Labs", "finance@innolabs.com", "+1-555-1000", "100 Future Blvd"],
      ),
      sql(
        `
        INSERT INTO customers (name, email, phone, address)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name
      `,
        ["Digital Solutions LLC", "accounts@digsol.com", "+1-555-2000", "200 Smart St"],
      ),
    ])

    const vendorIds = vendors.map((result) => result[0].id)
    const customerIds = customers.map((result) => result[0].id)

    const categories = ["Office Supplies", "Software", "Consulting", "Hardware", "Services"]
    const statuses = ["paid", "pending", "overdue"]

    for (let i = 0; i < 50; i++) {
      const invoiceDate = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
      const dueDate = new Date(invoiceDate)
      dueDate.setDate(dueDate.getDate() + 30)

      const total = Math.floor(Math.random() * 50000) + 5000

      const invoiceResult = await sql(
        `
        INSERT INTO invoices (
          invoice_number, vendor_id, customer_id, invoice_date, due_date,
          subtotal, tax, total, status, category
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `,
        [
          `INV-2024-${String(i + 1).padStart(5, "0")}`,
          vendorIds[Math.floor(Math.random() * vendorIds.length)],
          customerIds[Math.floor(Math.random() * customerIds.length)],
          invoiceDate.toISOString().split("T")[0],
          dueDate.toISOString().split("T")[0],
          Math.floor(total * 0.9),
          Math.floor(total * 0.1),
          total,
          statuses[Math.floor(Math.random() * statuses.length)],
          categories[Math.floor(Math.random() * categories.length)],
        ],
      )

      const invoiceId = invoiceResult[0].id

      // Add line items
      const lineItemCount = Math.floor(Math.random() * 3) + 1
      for (let j = 0; j < lineItemCount; j++) {
        const amount = Math.floor(total / lineItemCount)
        await sql(
          `
          INSERT INTO line_items (invoice_id, description, quantity, unit_price, amount)
          VALUES ($1, $2, $3, $4, $5)
        `,
          [
            invoiceId,
            `Service Item ${j + 1}`,
            Math.floor(Math.random() * 10) + 1,
            Math.floor(amount / (Math.floor(Math.random() * 10) + 1)),
            amount,
          ],
        )
      }

      const invoice = await sql("SELECT status FROM invoices WHERE id = $1", [invoiceId])
      if (invoice[0].status === "paid") {
        await sql(
          `
          INSERT INTO payments (invoice_id, payment_date, amount, payment_method)
          VALUES ($1, $2, $3, $4)
        `,
          [
            invoiceId,
            new Date(invoiceDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            total,
            ["Bank Transfer", "Credit Card", "Check"][Math.floor(Math.random() * 3)],
          ],
        )
      }
    }

    console.log("Database seed completed successfully!")
  } catch (error) {
    console.error("Seed error:", error)
    process.exit(1)
  }
}

seed()
