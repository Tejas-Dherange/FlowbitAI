import { neon } from "@neondatabase/serverless";
import analyticsData from './Analytics_Test_Data.json';

const sql = neon(process.env.DATABASE_URL || "");

interface AnalyticsData {
  _id: string;
  name: string;
  filePath: string;
  fileSize: { $numberLong: string };
  fileType: string;
  status: string;
  organizationId: string;
  departmentId: string;
  createdAt: { $date: string };
  updatedAt: { $date: string };
  metadata: any;
  isValidatedByHuman: boolean;
  uploadedById: string;
  extractedData: any;
  processedAt: { $date: string };
  analyticsId: string;
}

async function extractVendorInfo(data: any) {
  // Extract vendor information from metadata or extractedData if available
  const vendorInfo = data.extractedData?.vendor || {
    name: "Unknown Vendor",
    email: null,
    phone: null,
    address: null
  };
  
  return vendorInfo;
}

async function seedAnalyticsData() {
  console.log("Starting analytics data seed...");

  try {
    // Clear existing data
    await sql`DELETE FROM payments`;
    await sql`DELETE FROM line_items`;
    await sql`DELETE FROM invoices`;
    await sql`DELETE FROM customers`;
    await sql`DELETE FROM vendors`;

    // Create a map to store vendor IDs
    const vendorMap = new Map();

    // Process each analytics record
    for (const record of analyticsData) {
      try {
        // Extract vendor information
        const vendorInfo = await extractVendorInfo(record);
        
        // Check if vendor already exists or create new
        let vendorId;
        if (vendorMap.has(vendorInfo.name)) {
          vendorId = vendorMap.get(vendorInfo.name);
        } else {
          const vendorResult = await sql`
            INSERT INTO vendors (name, email, phone, address)
            VALUES (${vendorInfo.name}, ${vendorInfo.email}, ${vendorInfo.phone}, ${vendorInfo.address})
            RETURNING id
          `;
          vendorId = vendorResult[0].id;
          vendorMap.set(vendorInfo.name, vendorId);
        }

        // Create invoice
        const invoiceDate = new Date(record.createdAt.$date);
        const dueDate = new Date(invoiceDate);
        dueDate.setDate(dueDate.getDate() + 30); // Set due date to 30 days after creation

        // Extract amount from extractedData if available, otherwise use placeholder
        const total = record.extractedData?.total || 0;
        const subtotal = total * 0.9; // Assuming 10% tax
        const tax = total * 0.1;

        const invoiceResult = await sql`
          INSERT INTO invoices (
            invoice_number,
            vendor_id,
            invoice_date,
            due_date,
            subtotal,
            tax,
            total,
            status,
            category
          ) VALUES (
            ${record._id},
            ${vendorId},
            ${invoiceDate.toISOString().split('T')[0]},
            ${dueDate.toISOString().split('T')[0]},
            ${subtotal},
            ${tax},
            ${total},
            ${record.status === 'processed' ? 'pending' : record.status},
            ${record.metadata?.category || 'Uncategorized'}
          )
          RETURNING id
        `;

        const invoiceId = invoiceResult[0].id;

        // Create line items if available in extractedData
        if (record.extractedData?.items) {
          for (const item of record.extractedData.items) {
            await sql`
              INSERT INTO line_items (
                invoice_id,
                description,
                quantity,
                unit_price,
                amount
              ) VALUES (
                ${invoiceId},
                ${item.description},
                ${item.quantity},
                ${item.unitPrice},
                ${item.amount}
              )
            `;
          }
        }

        // Add payment record if invoice is marked as processed and validated
        if (record.status === 'processed' && record.isValidatedByHuman) {
          await sql`
            INSERT INTO payments (
              invoice_id,
              payment_date,
              amount,
              payment_method
            ) VALUES (
              ${invoiceId},
              ${record.processedAt.$date.split('T')[0]},
              ${total},
              ${'Bank Transfer'}
            )
          `;
        }

        console.log(`Processed invoice ${record._id}`);
      } catch (error) {
        console.error(`Error processing record ${record._id}:`, error);
        // Continue with next record instead of failing completely
        continue;
      }
    }

    console.log("Analytics data seed completed successfully!");
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
}

seedAnalyticsData();