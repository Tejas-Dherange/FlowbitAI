# FlowBit: Invoice Analytics Platform

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![Next.js](https://img.shields.io/badge/next.js-16.0.0-black)
![React](https://img.shields.io/badge/react-18.2.0-61DAFB)
![TypeScript](https://img.shields.io/badge/typescript-5.9.3-blue)

A production-grade full-stack invoice analytics application with an interactive dashboard and AI-powered chat interface for natural language data queries.

## Features

- **Analytics Dashboard** - Real-time metrics, trends, and financial insights
- **Interactive Charts** - Invoice volume, vendor spending, category breakdowns, and cash flow forecasts
- **Smart Data Table** - Search, filter, sort, and paginate invoice data
- **Chat with Data** - Ask natural language questions and get instant SQL-powered answers
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Dark Theme** - Modern dark interface for comfortable viewing
- **CSV Export** - Download query results for further analysis

## Tech Stack

### Frontend
- **Framework**: Next.js 16.0.0 (App Router)
- **Language**: TypeScript 5.9.3
- **UI**: Radix UI components
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **State Management**: SWR for data fetching
- **Forms**: React Hook Form with Zod validation
- **Theming**: next-themes
- **Animation**: tailwindcss-animate

### Backend
- **Runtime**: Node.js
- **Database**: PostgreSQL
- **Query Driver**: Neon Serverless
- **API**: Next.js Route Handlers
- **Validation**: Zod

## Architecture

\`\`\`
invoice-analytics/
├── app/
│   ├── api/                    # API route handlers
│   │   ├── stats/              # Dashboard statistics
│   │   ├── invoices/           # Invoice queries
│   │   ├── vendors/            # Vendor analysis
│   │   ├── invoice-trends/     # Trend analysis
│   │   ├── category-spend/     # Category breakdown
│   │   ├── cash-outflow/       # Cash forecasting
│   │   └── chat-with-data/     # Natural language queries
│   ├── chat/                   # Chat interface page
│   ├── page.tsx                # Dashboard page
│   └── layout.tsx              # Root layout
├── components/
│   ├── ui/                     # shadcn UI components
│   ├── sidebar.tsx             # Navigation sidebar
│   ├── dashboard-charts.tsx    # Dashboard charts
│   ├── invoices-table.tsx      # Invoice table
│   ├── query-results-table.tsx # Chat results table
│   ├── query-results-chart.tsx # Chat results chart
│   └── ...                     # Other components
├── lib/
│   ├── sql-generator.ts        # Natural language to SQL
│   ├── query-utils.ts          # Query utilities
│   └── utils.ts                # General utilities
├── scripts/
│   ├── init-db.sql             # Database schema
│   └── seed-db.ts              # Database seeding
└── docs/
    ├── API.md                  # API documentation
    ├── DATABASE.md             # Database schema
    └── SETUP.md                # Setup guide
\`\`\`

## Prerequisites

- Node.js 18.0 or later
- npm or pnpm
- PostgreSQL database (Neon recommended)
- Git
- VS Code (recommended)

For detailed setup requirements and instructions, see [docs/SETUP.md](docs/SETUP.md)

## Getting Started

### 1. Clone and Install

\`\`\`bash
# Clone the repository
git clone <your-repo-url>
cd invoice-analytics

# Install dependencies
npm install
# or
pnpm install
\`\`\`

### 2. Setup Environment Variables

Create a `.env.local` file with:

\`\`\`env
# Database (required)
DATABASE_URL=postgresql://user:password@host/database

# Optional: For deployment
NEXT_PUBLIC_API_URL=http://localhost:3000
\`\`\`

Get your PostgreSQL connection string from:
- **Neon**: https://console.neon.tech
- **Supabase**: https://app.supabase.com
- **Local PostgreSQL**: `postgresql://postgres:password@localhost:5432/invoice_db`

### 3. Initialize Database

\`\`\`bash
# Create tables
npm run db:init

# Seed with sample data
npm run db:seed
\`\`\`

### 4. Start Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## Available Scripts

\`\`\`bash
# Development
npm run dev           # Start development server

# Database
npm run db:init      # Create database schema
npm run db:seed      # Seed with sample data

# Production build
npm run build        # Build for production
npm start           # Start production server

# Code quality
npm run lint        # Run ESLint
npm run type-check  # Run TypeScript compiler
\`\`\`

## API Endpoints

### Dashboard Metrics

**GET** `/api/stats`
- Returns: Total spend, invoices, vendors, average value with YoY trends

**GET** `/api/invoice-trends?period=monthly`
- Returns: Monthly invoice count and value trends

**GET** `/api/vendors/top10`
- Returns: Top 10 vendors by total spend

**GET** `/api/category-spend`
- Returns: Breakdown of spending by category

**GET** `/api/cash-outflow?days=90`
- Returns: 90-day cash outflow forecast by week

### Invoices

**GET** `/api/invoices?page=1&limit=10&search=&status=&sortBy=date&order=desc`
- Returns: Paginated, searchable, sortable invoices

### Chat with Data

**POST** `/api/chat-with-data`
- Request: `{ "query": "What's the total spend?" }`
- Returns: `{ sql, results, columns, rowCount, truncated }`

For detailed API documentation, see [docs/API.md](docs/API.md)

## Database Schema

The application uses a normalized PostgreSQL schema with 5 tables:

- **vendors** - Vendor information
- **customers** - Customer information
- **invoices** - Invoice master records
- **line_items** - Invoice line items
- **payments** - Payment history

See [docs/DATABASE.md](docs/DATABASE.md) for schema details and ER diagram.

## Using the Dashboard

### Metrics Panel
View key performance indicators with year-over-year trends:
- Total Spend (YTD)
- Total Invoices Processed
- Vendor Count
- Average Invoice Value

### Charts
- **Invoice Trends** - Line chart showing invoice count and value over time
- **Top Vendors** - Horizontal bar chart of top 10 spenders
- **Category Breakdown** - Pie chart of spending by category
- **Cash Forecast** - Bar chart of upcoming cash outflows

### Invoice Table
- Search by invoice number or vendor name
- Filter by status (All, Paid, Pending, Overdue)
- Sort by any column
- Paginate with 10/25/50 per page options
- View dates and amounts in formatted display

## Using Chat with Data

1. **Ask a Question** - Type any question about your invoices
2. **View SQL** - See the generated SQL query
3. **View Results** - Browse results in an interactive table
4. **Visualize** - Auto-generated charts for numeric data
5. **Export** - Download results as CSV

### Example Queries

- "What's the total spend in the last 90 days?"
- "List top 5 vendors by spend"
- "Show overdue invoices"
- "Average invoice value by month"
- "Which vendors have the most invoices?"
- "Spend breakdown by category"
- "How many paid vs pending invoices?"

## Performance Optimization

- Database queries use indexed columns for fast lookups
- Results limited to 1000 rows with lazy loading
- Charts auto-generated only for appropriate data
- API responses cached with SWR
- Debounced search to reduce server load
- Lazy-loaded components for faster initial load

## Security

- SQL injection prevention through parameterized queries
- Read-only database operations in chat
- 30-second query timeout limit
- Input validation with Zod
- CORS configured for trusted origins
- Environment variables for sensitive data

## Deployment

### Deploy to Vercel

\`\`\`bash
# Push to GitHub first
git push origin main

# Connect in Vercel dashboard and deploy

# Set environment variables in Vercel project settings
\`\`\`

### Deploy Database

Choose your database provider:
- **Neon** (Recommended) - https://neon.tech
- **Supabase** - https://supabase.com
- **Railway** - https://railway.app

## Troubleshooting

### Database Connection Error
- Check `DATABASE_URL` is correct in `.env.local`
- Verify database is running and accessible
- Ensure credentials are correct

### No Data Showing
- Run `npm run db:seed` to populate sample data
- Check database tables with `npm run db:init`
- Verify API endpoints in browser console

### Chat Queries Not Working
- Ensure backend is running (`npm run dev`)
- Check browser console for error messages
- Verify `DATABASE_URL` is set

For more help, see [docs/SETUP.md](docs/SETUP.md)

## License

This project is private and proprietary.

## Support

For issues and questions:
1. Check [docs/SETUP.md](docs/SETUP.md)
2. Review [docs/API.md](docs/API.md)
3. Check existing GitHub issues
4. Create a new issue with details

## Roadmap

- Real-time updates with WebSockets
- User authentication and multi-tenant support
- Custom dashboard layouts
- Advanced filtering and reporting
- Mobile app
- Email alerts for critical metrics
- Integration with accounting software
