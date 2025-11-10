const { neon } = require("@neondatabase/serverless");
const fs = require('fs');
const path = require('path');

const sql = neon(process.env.DATABASE_URL || "");

async function normalizeAndSeedData() {
  console.log("Starting normalized data seed...");

  try {
    const analyticsData = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'Analytics_Test_Data.json'), 'utf-8')
    );

    // Clear existing data
    await sql`DELETE FROM payments`;
    await sql`DELETE FROM line_items`;
    await sql`DELETE FROM invoices`;
    await sql`DELETE FROM customers`;
    await sql`DELETE FROM vendors`;

    // Maps to track existing vendors and customers
    const vendorMap = new Map();
    const customerMap = new Map();

    for (const record of analyticsData) {
      const extractedData = record.extractedData?.llmData;
      if (!extractedData) continue;

      try {
        // 1. Process Vendor
        let vendorId;
        const vendorData = extractedData.vendor?.value;
        if (vendorData?.vendorName?.value) {
          const vendorName = vendorData.vendorName.value;
          if (vendorMap.has(vendorName)) {
            vendorId = vendorMap.get(vendorName);
          } else {
            const vendorResult = await sql`
              INSERT INTO vendors (
                name,
                address
              ) VALUES (
                ${vendorName},
                ${vendorData.vendorAddress.value}
              ) RETURNING id
            `;
            vendorId = vendorResult[0].id;
            if (vendorId) {
              vendorMap.set(vendorName, vendorId);
            }
          }
        }

        // 2. Process Customer
        let customerId;
        const customerData = extractedData.customer?.value;
        if (customerData?.customerName?.value) {
          const customerName = customerData.customerName.value;
          if (customerMap.has(customerName)) {
            customerId = customerMap.get(customerName);
          } else {
            const customerResult = await sql`
              INSERT INTO customers (
                name,
                address
              ) VALUES (
                ${customerName},
                ${customerData.customerAddress.value}
              ) RETURNING id
            `;
            customerId = customerResult[0].id;
            if (customerId) {
              customerMap.set(customerName, customerId);
            }
          }
        }

        // 3. Create Invoice
        const invoiceNumber = extractedData.invoice?.value?.invoiceId?.value || record._id;
        const invoiceDate = extractedData.invoice?.value?.invoiceDate?.value || 
          new Date(record.createdAt.$date).toISOString().split('T')[0];
        const dueDate = extractedData.payment?.value?.dueDate?.value;
        const summary = extractedData.summary?.value || {};

        const invoiceResult = await sql`
          INSERT INTO invoices (
            invoice_number,
            vendor_id,
            customer_id,
            invoice_date,
            due_date,
            subtotal,
            tax,
            total,
            status,
            category
          ) VALUES (
            ${invoiceNumber},
            ${vendorId || null},
            ${customerId || null},
            ${invoiceDate},
            ${dueDate || null},
            ${summary.subTotal?.value || 0},
            ${summary.totalTax?.value || 0},
            ${summary.invoiceTotal?.value || 0},
            ${record.isValidatedByHuman ? 'validated' : 'pending'},
            ${summary.documentType || 'invoice'}
          ) RETURNING id
        `;

        const invoiceId = invoiceResult[0].id;

        // 4. Process Line Items
        const lineItems = extractedData.lineItems?.value?.items?.value || [];
        
        for (const item of lineItems) {
          await sql`
            INSERT INTO line_items (
              invoice_id,
              description,
              quantity,
              unit_price,
              amount
            ) VALUES (
              ${invoiceId},
              ${item.description.value},
              ${item.quantity.value},
              ${item.unitPrice.value},
              ${item.totalPrice.value}
            )
          `;
        }

        // 5. Create Payment Record when validated and has due date
        if (record.isValidatedByHuman && dueDate) {
          await sql`
            INSERT INTO payments (
              invoice_id,
              payment_date,
              amount,
              payment_method
            ) VALUES (
              ${invoiceId},
              ${dueDate},
              ${summary.invoiceTotal?.value || 0},
              ${extractedData.payment?.value?.bankAccountNumber?.value || 'Bank Transfer'}
            )
          `;
        }

        console.log(`Processed invoice ${invoiceNumber}`);
      } catch (error) {
        console.error(`Error processing record ${record._id}:`, error);
        // Continue with next record
        continue;
      }
    }

    console.log("Normalized data seed completed successfully!");
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
}

normalizeAndSeedData();