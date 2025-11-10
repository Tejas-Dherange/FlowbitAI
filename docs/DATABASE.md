# Database Documentation

Complete reference for the Invoice Analytics Platform database schema.

## Database Type

PostgreSQL 12+ (compatible with Neon, Supabase, Railway, AWS RDS)

## Schema Overview

The database uses a normalized relational model with 5 core tables:

\`\`\`
Vendors (1) ──→ (Many) Invoices (Many) ←── (1) Customers
                           ↓
                    Line_Items (1:Many)
                           ↓
                       Payments (1:Many)
\`\`\`

## Table Definitions

### vendors

Core vendor information.

\`\`\`sql
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

**Fields:**
- `id`: Unique identifier (auto-generated UUID)
- `name`: Vendor business name (required)
- `email`: Contact email
- `phone`: Contact phone number
- `address`: Business address
- `created_at`: Record creation timestamp

**Constraints:**
- Primary key: `id`

**Indexes:**
- Primary key index on `id`

**Example:**
\`\`\`json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Acme Corporation",
  "email": "billing@acme.com",
  "phone": "+1-555-0100",
  "address": "123 Business Ave, New York, NY",
  "created_at": "2024-01-01T00:00:00Z"
}
\`\`\`

---

### customers

Core customer information.

\`\`\`sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

**Fields:**
- `id`: Unique identifier (auto-generated UUID)
- `name`: Customer business name (required)
- `email`: Contact email
- `phone`: Contact phone number
- `address`: Business address
- `created_at`: Record creation timestamp

**Constraints:**
- Primary key: `id`

---

### invoices

Main invoice records.

\`\`\`sql
CREATE TABLE invoices (
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
);
\`\`\`

**Fields:**
- `id`: Unique identifier (auto-generated UUID)
- `invoice_number`: Human-readable invoice identifier (unique, required)
- `vendor_id`: Foreign key to vendors table
- `customer_id`: Foreign key to customers table
- `invoice_date`: Date invoice was issued (required)
- `due_date`: Payment due date
- `subtotal`: Pre-tax amount
- `tax`: Tax amount
- `total`: Total amount (required)
- `status`: Payment status enum - 'paid', 'pending', 'overdue'
- `category`: Expense category for grouping
- `created_at`: Record creation timestamp

**Constraints:**
- Primary key: `id`
- Unique: `invoice_number`
- Foreign key: `vendor_id` → `vendors.id`
- Foreign key: `customer_id` → `customers.id`

**Indexes:**
- Primary key index on `id`
- Unique index on `invoice_number`
- Index on `vendor_id` (for joins)
- Index on `customer_id` (for joins)
- Index on `status` (for filtering)
- Index on `invoice_date` (for sorting/filtering)

**Status Values:**
- `pending`: Invoice issued, payment not yet received
- `paid`: Payment received in full
- `overdue`: Past due date without payment

**Example:**
\`\`\`json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "invoice_number": "INV-2024-00001",
  "vendor_id": "550e8400-e29b-41d4-a716-446655440000",
  "customer_id": "550e8400-e29b-41d4-a716-446655440002",
  "invoice_date": "2024-01-15",
  "due_date": "2024-02-15",
  "subtotal": 4590.00,
  "tax": 660.50,
  "total": 5250.50,
  "status": "paid",
  "category": "Software",
  "created_at": "2024-01-15T10:30:00Z"
}
\`\`\`

---

### line_items

Individual line items within invoices.

\`\`\`sql
CREATE TABLE line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT,
  quantity INTEGER,
  unit_price DECIMAL(12,2),
  amount DECIMAL(12,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

**Fields:**
- `id`: Unique identifier
- `invoice_id`: Foreign key to invoices (cascades on delete)
- `description`: Item description
- `quantity`: Number of items
- `unit_price`: Price per unit
- `amount`: Total amount (quantity × unit_price)
- `created_at`: Record creation timestamp

**Constraints:**
- Primary key: `id`
- Foreign key: `invoice_id` → `invoices.id` (CASCADE on delete)

**Indexes:**
- Index on `invoice_id` (for fetching line items)

**Example:**
\`\`\`json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "invoice_id": "550e8400-e29b-41d4-a716-446655440001",
  "description": "Software License - Annual",
  "quantity": 5,
  "unit_price": 918.00,
  "amount": 4590.00,
  "created_at": "2024-01-15T10:30:00Z"
}
\`\`\`

---

### payments

Payment transaction records.

\`\`\`sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id),
  payment_date DATE,
  amount DECIMAL(12,2),
  payment_method TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

**Fields:**
- `id`: Unique identifier
- `invoice_id`: Foreign key to invoices
- `payment_date`: Date payment was received
- `amount`: Payment amount
- `payment_method`: Method used (e.g., "Bank Transfer", "Credit Card", "Check")
- `created_at`: Record creation timestamp

**Constraints:**
- Primary key: `id`
- Foreign key: `invoice_id` → `invoices.id`

**Indexes:**
- Index on `invoice_id` (for fetching payments)

**Example:**
\`\`\`json
{
  "id": "550e8400-e29b-41d4-a716-446655440004",
  "invoice_id": "550e8400-e29b-41d4-a716-446655440001",
  "payment_date": "2024-02-10",
  "amount": 5250.50,
  "payment_method": "Bank Transfer",
  "created_at": "2024-02-10T14:22:00Z"
}
\`\`\`

---

## Indexes

Indexes are automatically created for performance optimization:

\`\`\`sql
CREATE INDEX idx_invoices_vendor_id ON invoices(vendor_id);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);
CREATE INDEX idx_line_items_invoice_id ON line_items(invoice_id);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
\`\`\`

**Index Usage:**
- `vendor_id`, `customer_id`: Join operations
- `status`: WHERE clauses filtering by status
- `invoice_date`: Sorting and date range filtering
- `invoice_id` on line_items, payments: One-to-many lookups

---

## Common Queries

### Dashboard Statistics

\`\`\`sql
-- Total spend YTD
SELECT
  COALESCE(SUM(total), 0) as total_spend
FROM invoices
WHERE EXTRACT(YEAR FROM invoice_date) = EXTRACT(YEAR FROM CURRENT_DATE);

-- Invoice trends
SELECT
  TO_CHAR(invoice_date, 'Mon YYYY') as period,
  COUNT(*) as count,
  SUM(total) as value
FROM invoices
WHERE invoice_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', invoice_date)
ORDER BY DATE_TRUNC('month', invoice_date);

-- Top vendors
SELECT
  v.id, v.name,
  SUM(i.total) as total_spend,
  COUNT(i.id) as invoice_count
FROM vendors v
LEFT JOIN invoices i ON v.id = i.vendor_id
GROUP BY v.id, v.name
ORDER BY total_spend DESC
LIMIT 10;

-- Category breakdown
SELECT
  category,
  SUM(total) as amount,
  COUNT(*) as count
FROM invoices
WHERE category IS NOT NULL
GROUP BY category
ORDER BY amount DESC;
\`\`\`

### Operational Queries

\`\`\`sql
-- Overdue invoices
SELECT
  i.invoice_number, v.name, i.total, i.due_date
FROM invoices i
LEFT JOIN vendors v ON i.vendor_id = v.id
WHERE i.status = 'overdue'
ORDER BY i.due_date ASC;

-- Unpaid invoices
SELECT
  i.invoice_number, v.name, i.total, i.invoice_date
FROM invoices i
LEFT JOIN vendors v ON i.vendor_id = v.id
WHERE i.status IN ('pending', 'overdue')
ORDER BY i.invoice_date DESC;

-- Payment history for vendor
SELECT
  i.invoice_number, p.payment_date, p.amount
FROM payments p
JOIN invoices i ON p.invoice_id = i.id
WHERE i.vendor_id = $1
ORDER BY p.payment_date DESC;
\`\`\`

---

## Data Types

| Type | Usage | Range |
|------|-------|-------|
| UUID | Identifiers | 128-bit |
| TEXT | Names, descriptions, emails | Unlimited |
| DATE | Specific dates | 4713 BC to 5874897 AD |
| DECIMAL(12,2) | Currency amounts | -9,999,999.99 to 9,999,999.99 |
| TIMESTAMP | Creation times | 4713 BC to 294276 AD |
| VARCHAR(20) | Status enum | 20 characters |
| INTEGER | Quantities | -2,147,483,648 to 2,147,483,647 |

---

## Constraints & Relationships

### Foreign Keys

- `invoices.vendor_id` → `vendors.id`
- `invoices.customer_id` → `customers.id`
- `line_items.invoice_id` → `invoices.id` (CASCADE on delete)
- `payments.invoice_id` → `invoices.id`

### Unique Constraints

- `invoices.invoice_number` - No duplicate invoice numbers

### Default Values

- `id` fields: Auto-generated UUID
- `status` (invoices): 'pending'
- `created_at`: Current timestamp

---

## Migration Strategy

### Add a Column

\`\`\`sql
ALTER TABLE invoices ADD COLUMN notes TEXT;
\`\`\`

### Add an Index

\`\`\`sql
CREATE INDEX idx_invoices_category ON invoices(category);
\`\`\`

### Modify Column

\`\`\`sql
ALTER TABLE invoices ALTER COLUMN total TYPE DECIMAL(14,2);
\`\`\`

### Data Fixes

\`\`\`sql
-- Recalculate totals
UPDATE invoices
SET total = subtotal + COALESCE(tax, 0)
WHERE total != (subtotal + COALESCE(tax, 0));
\`\`\`

---

## Backup Strategy

### Export Data

\`\`\`bash
# Full backup
pg_dump -h host -U user -d database > backup.sql

# Compressed backup
pg_dump -h host -U user -d database | gzip > backup.sql.gz

# CSV export (for Excel)
psql -h host -U user -d database -c "COPY invoices TO STDOUT WITH CSV HEADER" > invoices.csv
\`\`\`

### Restore Data

\`\`\`bash
# Restore from backup
psql -h host -U user -d database < backup.sql

# Restore compressed
gunzip -c backup.sql.gz | psql -h host -U user -d database
\`\`\`

---

## Performance Optimization

### Query Optimization

1. **Use indexes** - Queries on indexed columns are fast
2. **Avoid SELECT *** - Only fetch needed columns
3. **Use LIMIT** - Limit results to necessary rows
4. **Use JOINs efficiently** - Join on indexed columns

### Example Optimized Query

\`\`\`sql
-- Optimized: Only select needed columns, use indexes
SELECT
  i.invoice_number,
  v.name,
  i.total,
  i.status
FROM invoices i
LEFT JOIN vendors v ON i.vendor_id = v.id
WHERE i.invoice_date >= '2024-01-01'
  AND i.status = 'pending'
ORDER BY i.invoice_date DESC
LIMIT 100;
\`\`\`

---

## Monitoring

### Table Sizes

\`\`\`sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
\`\`\`

### Index Usage

\`\`\`sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
\`\`\`

---

## Documentation

For more information:
- PostgreSQL Docs: https://www.postgresql.org/docs/
- Neon Docs: https://neon.tech/docs
- Supabase Docs: https://supabase.com/docs
