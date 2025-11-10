import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL || "")

async function seedCashOutflowData() {
  try {
    // Set up some test future invoices
    const futureInvoices = [
      {
        invoice_number: 'FUT-001',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        total: 15000,
        status: 'pending'
      },
      {
        invoice_number: 'FUT-002',
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
        total: 25000,
        status: 'pending'
      },
      {
        invoice_number: 'FUT-003',
        due_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 3 weeks from now
        total: 35000,
        status: 'pending'
      },
      {
        invoice_number: 'FUT-004',
        due_date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // 4 weeks from now
        total: 45000,
        status: 'pending'
      }
    ]

    // Insert test invoices
    for (const invoice of futureInvoices) {
      await sql`
        INSERT INTO invoices (
          invoice_number,
          due_date,
          total,
          status,
          invoice_date,
          category
        ) VALUES (
          ${invoice.invoice_number},
          ${invoice.due_date.toISOString()},
          ${invoice.total},
          ${invoice.status},
          ${new Date().toISOString()},
          'invoice'
        )
      `
    }

    console.log('Successfully seeded cash outflow test data')
  } catch (error) {
    console.error('Error seeding cash outflow data:', error)
    process.exit(1)
  }
}

seedCashOutflowData()