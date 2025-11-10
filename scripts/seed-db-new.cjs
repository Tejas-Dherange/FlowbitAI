require('dotenv').config();
const { neon } = require("@neondatabase/serverless");
const fs = require('fs');
const path = require('path');

// Validate database connection and initialize it
let sql;

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

try {
  sql = neon(process.env.DATABASE_URL);
} catch (error) {
  console.error('Failed to initialize database connection:', error);
  process.exit(1);
}

async function normalizeAndSeedData() {
  let analyticsData;
  let processedCount = 0;
  let errorCount = 0;
  const vendorMap = new Map();
  const customerMap = new Map();

  try {
    console.log("Starting normalized data seed...");

    // Load data file
    try {
      analyticsData = JSON.parse(
        fs.readFileSync(path.join(__dirname, 'Analytics_Test_Data.json'), 'utf-8')
      );
    } catch (fileError) {
      throw new Error(`Failed to read analytics data file: ${fileError.message}`);
    }

    // Clear existing data
    try {
      await sql`DELETE FROM payments`;
      await sql`DELETE FROM line_items`;
      await sql`DELETE FROM invoices`;
      await sql`DELETE FROM customers`;
      await sql`DELETE FROM vendors`;
      console.log("Cleared existing data");
    } catch (clearError) {
      throw new Error(`Failed to clear existing data: ${clearError.message}`);
    }

    // Process each record
    for (const record of analyticsData) {
      const extractedData = record.extractedData?.llmData;
      if (!extractedData) {
        console.warn(`Skipping record ${record._id}: No extracted data found`);
        continue;
      }

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
        let invoiceNumber;
        if (extractedData.invoice?.value?.invoiceId?.value) {
          invoiceNumber = `${extractedData.invoice.value.invoiceId.value}_${record._id}`;
        } else {
          invoiceNumber = record._id;
        }

        // Normalize dates
        const invoiceDate = extractedData.invoice?.value?.invoiceDate?.value
          ? new Date(extractedData.invoice.value.invoiceDate.value).toISOString().split('T')[0]
          : new Date(record.createdAt.$date).toISOString().split('T')[0];

        const dueDate = extractedData.payment?.value?.dueDate?.value
          ? new Date(extractedData.payment.value.dueDate.value).toISOString().split('T')[0]
          : null;

        // Normalize amounts
        const summary = extractedData.summary?.value || {};
        const subTotal = Number(summary.subTotal?.value) || 0;
        const totalTax = Number(summary.totalTax?.value) || 0;
        const total = Number(summary.invoiceTotal?.value) || 0;

        // Normalize status and category
        const status = record.isValidatedByHuman ? 'validated' : 'pending';
        const category = extractedData.summary?.value?.documentType === 'creditNote' ? 'credit_note' : 'invoice';

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
            ${dueDate},
            ${subTotal},
            ${totalTax},
            ${total},
            ${status},
            ${category}
          ) RETURNING id
        `;

        const invoiceId = invoiceResult[0].id;

        // 4. Process Line Items
        const lineItems = extractedData.lineItems?.value?.items?.value || [];
        let lineItemsProcessed = 0;
        
        for (const item of lineItems) {
          try {
            if (!item.description?.value || !item.quantity?.value || !item.unitPrice?.value || !item.totalPrice?.value) {
              console.warn(`Skipping invalid line item for invoice ${invoiceNumber}`);
              continue;
            }

            const quantity = Number(item.quantity.value);
            const unitPrice = Number(item.unitPrice.value);
            const totalPrice = Number(item.totalPrice.value);

            if (isNaN(quantity) || isNaN(unitPrice) || isNaN(totalPrice)) {
              console.warn(`Skipping line item with invalid numbers for invoice ${invoiceNumber}`);
              continue;
            }

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
                ${quantity},
                ${unitPrice},
                ${totalPrice}
              )
            `;
            lineItemsProcessed++;
          } catch (lineItemError) {
            console.error(`Error processing line item for invoice ${invoiceNumber}:`, lineItemError);
            continue;
          }
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
              ${total},
              ${extractedData.payment?.value?.bankAccountNumber?.value || 'Bank Transfer'}
            )
          `;
        }

        processedCount++;
        console.log(`Processed invoice ${invoiceNumber} with ${lineItemsProcessed} line items`);
      } catch (error) {
        errorCount++;
        console.error(`Error processing record ${record._id}:`, error);
        if (error.code) {
          console.error('Error code:', error.code);
        }
        if (error.detail) {
          console.error('Error detail:', error.detail);
        }
        continue;
      }
    }

    console.log(`\nSeed completed:`);
    console.log(`- Processed ${processedCount} records successfully`);
    console.log(`- Encountered ${errorCount} errors`);
    console.log(`- Created ${vendorMap.size} unique vendors`);
    console.log(`- Created ${customerMap.size} unique customers`);

  } catch (error) {
    console.error("Fatal seed error:", error);
    throw error;  // Re-throw to be caught by the top-level catch
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

// Run the seeding process
normalizeAndSeedData()
  .then(() => {
    console.log('Seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });