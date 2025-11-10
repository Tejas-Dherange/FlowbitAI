# API Documentation

Complete reference for all Invoice Analytics Platform API endpoints.

## Base URL

- Development: `http://localhost:3000`
- Production: `https://your-domain.com`

## Common Response Format

All endpoints return JSON responses.

### Success Response (2xx)
\`\`\`json
{
  "data": { ... },
  "status": "success"
}
\`\`\`

### Error Response (4xx, 5xx)
\`\`\`json
{
  "error": "Error message",
  "status": "error"
}
\`\`\`

## Dashboard Endpoints

### Get Dashboard Statistics

**GET** `/api/stats`

Returns key performance indicators for the dashboard.

**Response:**
\`\`\`json
{
  "totalSpend": 2850000,
  "totalInvoices": 248,
  "documentsUploaded": 12,
  "averageInvoiceValue": 11500,
  "trends": {
    "spendChange": 12.5,
    "invoiceChange": 8.3,
    "documentChange": 0,
    "avgValueChange": 3.2
  }
}
\`\`\`

**Parameters:** None

**Status Codes:**
- 200: Success
- 500: Database error

---

### Get Invoice Trends

**GET** `/api/invoice-trends?period=monthly`

Returns invoice volume and value trends over time.

**Parameters:**
- `period` (optional): "monthly" (default), "weekly", "daily"

**Response:**
\`\`\`json
{
  "data": [
    {
      "period": "Jan 2024",
      "count": 145,
      "value": 1825000
    },
    {
      "period": "Feb 2024",
      "count": 132,
      "value": 1680000
    }
  ]
}
\`\`\`

**Status Codes:**
- 200: Success
- 500: Database error

---

### Get Top Vendors

**GET** `/api/vendors/top10`

Returns top 10 vendors by total spend.

**Response:**
\`\`\`json
{
  "vendors": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Acme Corporation",
      "totalSpend": 425000,
      "invoiceCount": 34
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "TechSupply Inc",
      "totalSpend": 380000,
      "invoiceCount": 28
    }
  ]
}
\`\`\`

**Status Codes:**
- 200: Success
- 500: Database error

---

### Get Category Spending

**GET** `/api/category-spend`

Returns spending breakdown by category.

**Response:**
\`\`\`json
{
  "categories": [
    {
      "category": "Software",
      "amount": 850000,
      "percentage": 29.8
    },
    {
      "category": "Hardware",
      "amount": 720000,
      "percentage": 25.2
    },
    {
      "category": "Services",
      "amount": 650000,
      "percentage": 22.7
    },
    {
      "category": "Office Supplies",
      "amount": 450000,
      "percentage": 15.8
    },
    {
      "category": "Consulting",
      "amount": 180000,
      "percentage": 6.5
    }
  ]
}
\`\`\`

**Status Codes:**
- 200: Success
- 500: Database error

---

### Get Cash Outflow Forecast

**GET** `/api/cash-outflow?days=90`

Returns forecasted cash outflows for upcoming weeks.

**Parameters:**
- `days` (optional): Number of days to forecast (default: 90)

**Response:**
\`\`\`json
{
  "forecast": [
    {
      "period": "Week 1",
      "amount": 185000
    },
    {
      "period": "Week 2",
      "amount": 162000
    },
    {
      "period": "Week 3",
      "amount": 198000
    }
  ]
}
\`\`\`

**Status Codes:**
- 200: Success
- 500: Database error

---

## Invoice Endpoints

### Get Invoices

**GET** `/api/invoices?page=1&limit=10&search=&status=&sortBy=date&order=desc`

Returns paginated, filtered, searchable invoices.

**Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 10)
- `search` (optional): Search invoice number or vendor name
- `status` (optional): Filter by status - "paid", "pending", "overdue"
- `sortBy` (optional): Field to sort - "invoice_date", "total", "status"
- `order` (optional): Sort order - "ASC", "DESC"

**Response:**
\`\`\`json
{
  "invoices": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "invoiceNumber": "INV-2024-00001",
      "vendor": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "Acme Corporation"
      },
      "date": "2024-01-15",
      "amount": 5250.50,
      "status": "paid"
    }
  ],
  "pagination": {
    "total": 248,
    "page": 1,
    "limit": 10,
    "totalPages": 25
  }
}
\`\`\`

**Status Codes:**
- 200: Success
- 400: Invalid parameters
- 500: Database error

---

## Chat with Data Endpoint

### Process Natural Language Query

**POST** `/api/chat-with-data`

Converts natural language question to SQL and returns results.

**Request Body:**
\`\`\`json
{
  "query": "What's the total spend in the last 90 days?"
}
\`\`\`

**Response:**
\`\`\`json
{
  "sql": "SELECT COALESCE(SUM(total), 0) as total_spend FROM invoices WHERE invoice_date >= CURRENT_DATE - INTERVAL '90 days'",
  "results": [
    {
      "total_spend": 1850000
    }
  ],
  "columns": ["total_spend"],
  "rowCount": 1,
  "truncated": false
}
\`\`\`

**Errors:**
\`\`\`json
{
  "error": "Query too long (max 1000 characters)"
}
\`\`\`

**Supported Query Patterns:**
- "What's the total spend..." → Total spending queries
- "List top X vendors..." → Top vendor queries
- "Show overdue invoices" → Status filtering
- "Average invoice..." → Aggregation queries
- "Spend by category" → Category breakdown
- "Monthly spending" → Time-based analysis

**Parameters:**
- `query` (required): Natural language question about invoices

**Response Fields:**
- `sql`: Generated SQL query (for transparency)
- `results`: Array of result objects
- `columns`: Column names from result
- `rowCount`: Number of rows returned
- `truncated`: Boolean, true if results truncated to 1000

**Status Codes:**
- 200: Success
- 400: Invalid query (empty, too long, unsafe)
- 500: Query execution error

**Limits:**
- Query length: 1000 characters max
- Results: 1000 rows max (truncated field indicates if more exist)
- Timeout: 30 seconds per query
- Safe operations only: No DROP, DELETE, UPDATE, CREATE, etc.

---

## Error Handling

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "DATABASE_URL not found" | Missing env var | Add DATABASE_URL to .env.local |
| "Failed to fetch stats" | Database connection | Check DATABASE_URL is correct |
| "Query too long" | Query exceeds 1000 chars | Shorten the question |
| "Could not understand" | Query pattern not recognized | Try different phrasing |
| "Query contains unsupported" | Non-read-only operation | Ask a different question |
| "Failed to execute query" | SQL error or timeout | Try simpler query |

### Retry Logic

For production reliability:

\`\`\`javascript
async function callAPI(endpoint, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(endpoint, options);
      if (response.ok) return response.json();
      if (response.status >= 500) throw new Error('Server error');
      return response.json(); // 4xx errors don't retry
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1))); // Backoff
    }
  }
}
\`\`\`

---

## Rate Limiting

Currently no rate limiting. For production:
- Implement per-IP rate limiting
- Limit chart endpoint to 1 request per 5 seconds
- Limit chat endpoint to 1 request per 2 seconds

---

## Authentication

Currently no authentication. For production:
- Add JWT authentication
- Validate tokens on all endpoints
- Use HTTPS only

---

## CORS

Configured for:
- Development: `http://localhost:3000`
- Production: Set in deployment environment

---

## Examples

### JavaScript/Fetch

\`\`\`javascript
// Get dashboard stats
const stats = await fetch('/api/stats').then(r => r.json());

// Get invoices with filters
const invoices = await fetch(
  '/api/invoices?status=pending&sortBy=due_date&order=ASC'
).then(r => r.json());

// Chat with data
const chat = await fetch('/api/chat-with-data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: "List top 10 vendors" })
}).then(r => r.json());
\`\`\`

### Python

\`\`\`python
import requests

# Get stats
response = requests.get('http://localhost:3000/api/stats')
stats = response.json()

# Chat query
response = requests.post(
  'http://localhost:3000/api/chat-with-data',
  json={"query": "What's the total spend?"}
)
results = response.json()
\`\`\`

### cURL

\`\`\`bash
# Get stats
curl http://localhost:3000/api/stats

# Chat query
curl -X POST http://localhost:3000/api/chat-with-data \
  -H "Content-Type: application/json" \
  -d '{"query":"What is the average invoice?"}'
\`\`\`

---

## Versioning

Current API version: 1.0

Future versions will maintain backward compatibility with a `/api/v1/` prefix.

---

## Support

For API issues:
1. Check this documentation
2. Review error message
3. Check database connection
4. See [docs/SETUP.md](SETUP.md) for troubleshooting
