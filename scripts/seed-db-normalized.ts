const { neon } = require("@neondatabase/serverless");
const analyticsData = require('./Analytics_Test_Data.json');

const sql = neon(process.env.DATABASE_URL || "");

interface ExtractedData {
  invoice: {
    value: {
      invoiceId: { value: string };
      invoiceDate: { value: string };
      deliveryDate?: { value: string };
    };
  };
  vendor: {
    value: {
      vendorName: { value: string };
      vendorAddress: { value: string };
      vendorTaxId?: { value: string };
    };
  };
  customer: {
    value: {
      customerName: { value: string };
      customerAddress: { value: string };
      customerTaxId?: string;
    };
  };
  payment: {
    value: {
      dueDate?: { value: string };
      bankAccountNumber?: { value: string };
      netDays?: number;
    };
  };
  summary: {
    value: {
      subTotal: { value: number };
      totalTax: { value: number };
      invoiceTotal: { value: number };
      documentType?: string;
      currencySymbol?: string;
    };
  };
  lineItems: {
    value: {
      items: {
        value: Array<{
          description: { value: string };
          quantity: { value: number };
          unitPrice: { value: number };
          totalPrice: { value: number };
          vatRate?: { value: number };
          vatAmount?: { value: number };
        }>;
      };
    };
  };
}

interface AnalyticsRecord {
  _id: string;
  name: string;
  status: string;
  createdAt: { $date: string };
  updatedAt: { $date: string };
  processedAt: { $date: string };
  isValidatedByHuman: boolean;
  extractedData: {
    llmData: ExtractedData;
  };
  analyticsId?: string;
}

async function normalizeAndSeedData() {
  console.log("Starting normalized data seed...");

  try {
    // Clear existing data
    await sql`DELETE FROM payments`;
    await sql`DELETE FROM line_items`;
    await sql`DELETE FROM invoices`;
    await sql`DELETE FROM customers`;
    await sql`DELETE FROM vendors`;

    // Maps to track existing vendors and customers
    const vendorMap = new Map<string, string>();
    const customerMap = new Map<string, string>();

    for (const record of analyticsData) {
      const extractedData = record.extractedData?.llmData;
      if (!extractedData) continue;

      try {
        // 1. Process Vendor
        let vendorId: string | undefined;
        const vendorData = extractedData.vendor.value;
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
        let customerId: string | undefined;
        const customerData = extractedData.customer.value;
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
        const invoiceNumber = extractedData.invoice.value.invoiceId.value;
        const invoiceDate = extractedData.invoice.value.invoiceDate.value;
        const dueDate = extractedData.payment.value.dueDate?.value;
        const summary = extractedData.summary.value;

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
            ${summary.subTotal.value},
            ${summary.totalTax.value},
            ${summary.invoiceTotal.value},
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
              ${summary.invoiceTotal.value},
              ${extractedData.payment.value.bankAccountNumber?.value || 'Bank Transfer'}
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