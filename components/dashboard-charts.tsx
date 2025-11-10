"use client"

import useSWR from "swr"
import { VendorSpendBar } from "./vendor-spend-bar"
import styles from "./dashboard-charts.module.css"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieLabelRenderProps,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const CHART_COLORS = ["#1e40af", "#6366f1", "#f97316", "#eab308", "#8b5cf6"]

interface CategoryData {
  category: string
  amount: number
  count: number
  percentage: string
}

// Demo data for cash outflow forecast
const demoCashOutflow = {
  forecast: [
    { period: "0-7 Days", amount: 25000 },
    { period: "8-30 Days", amount: 45000 },
    { period: "31-60 Days", amount: 35000 },
    { period: "61-90 Days", amount: 20000 },
  ]
}

export function DashboardCharts() {
  const { data: trendData } = useSWR("/api/invoice-trends", fetcher)
  const { data: vendorsData } = useSWR("/api/vendors/top10", fetcher)
  const { data: categoryData } = useSWR("/api/category-spend", fetcher)
  // Using demo data instead of API
  const cashData = demoCashOutflow

  return (
    <div className="space-y-6">
      {/* Top Row - Trends and Vendor Spend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoice Volume & Value Trend */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-900">Invoice Volume + Value Trend</CardTitle>
            <p className="text-sm text-gray-500">Invoice count and total spend over 12 months.</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={trendData?.data || []}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis 
                  dataKey="period" 
                  stroke="#9ca3af" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  yAxisId="left"
                  stroke="#9ca3af" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="#9ca3af" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: "white", 
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "12px"
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === "Invoice Count") {
                      return [value, "Invoice Count"]
                    }
                    return [
                      new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'EUR',
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      }).format(value).replace('EUR', '€'),
                      "Total Value"
                    ]
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="url(#colorCount)"
                  yAxisId="left"
                  radius={[4, 4, 0, 0]}
                  barSize={30}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#1e40af" 
                  strokeWidth={3}
                  dot={false} 
                  name="Invoice Count"
                  yAxisId="left"
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#a5b4fc" 
                  strokeWidth={3}
                  dot={false} 
                  name="Total Value"
                  yAxisId="right"
                />
              </ComposedChart>
            </ResponsiveContainer>
            {/* Current Month Info */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{trendData?.currentMonth?.period || "Current Month"}</span>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Invoice count: <span className="text-indigo-600 font-semibold">{trendData?.currentMonth?.count || 0}</span></p>
                  <p className="text-xs text-gray-500">Total Spend: <span className="text-indigo-600 font-semibold">
                    {trendData?.currentMonth?.value 
                      ? new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'EUR',
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        }).format(Number(trendData.currentMonth.value)).replace('EUR', '€')
                      : "€0.00"}
                  </span></p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Spend by Vendor (Top 10) */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-900">Spend by Vendor (Top 10)</CardTitle>
            <p className="text-sm text-gray-500">Vendor spend with cumulative percentage distribution.</p>
          </CardHeader>
          <CardContent>
            <VendorSpendBar vendors={vendorsData?.vendors || []} />
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row - Category, Cash Outflow, and Vendors Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spend by Category */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-900">
              Spend by Category
            </CardTitle>
            <p className="text-sm text-gray-500">
              Distribution of spending across different categories.
            </p>
          </CardHeader>

  <CardContent>
    {/* Donut */}
    <div className="flex items-center justify-center">
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={categoryData?.categories || []}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            dataKey="amount"
            nameKey="category"
            paddingAngle={3}
            stroke="transparent"
            labelLine={false}
            label={(props: any) => {
              if (!props.name) return null;
              return (
                <text
                  x={props.x}
                  y={props.y}
                  fill="#374151"
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-[11px] font-medium"
                >
                  {props.name}
                </text>
              );
            }}
          >
            {(categoryData?.categories || []).map((_: any, i: number) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "12px",
              padding: "8px",
            }}
            formatter={(value: number, name: string, entry: any) => {
              if (name === "amount") {
                return [`€${value.toLocaleString()}`, "Total Amount"]
              }
              return [value, name]
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>

    {/* Legend BELOW (like the image) */}
    <div className="mt-4 space-y-2">
      {(categoryData?.categories || []).map(
        (item: CategoryData, i: number) => (
          <div
            key={item.category + i}
            className="flex items-center gap-2"
          >
            <div
              className={`h-3 w-3 rounded-full inline-block ${styles[`color${i % CHART_COLORS.length}`]}`}
              aria-hidden="true"
            />
            <span className="text-sm text-gray-700">{item.category}</span>
            <span className="text-sm font-medium tabular-nums text-gray-900">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              }).format(item.amount ?? 0).replace('EUR', '€')}
            </span>
          </div>
        )
      )}
    </div>
  </CardContent>
        </Card>


        {/* Cash Outflow Forecast */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-900">Cash Outflow Forecast</CardTitle>
            <p className="text-sm text-gray-500">Expected payment obligations grouped by due date ranges.</p>
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            <div className="w-full h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={cashData.forecast} 
                  margin={{ top: 10, right: 10, bottom: 0, left: 0 }}
                  barSize={40}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis 
                    dataKey="period" 
                    stroke="#6b7280" 
                    fontSize={11}
                    fontWeight={500}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    stroke="#6b7280" 
                    fontSize={11}
                    fontWeight={500}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickFormatter={(value) => `€${value/1000}k`}
                    width={45}
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: "white", 
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "12px",
                      padding: "8px 12px"
                    }}
                    formatter={(value: number) => [`€${value.toLocaleString()}`, "Expected Payment"]}
                    labelStyle={{ color: "#374151", fontWeight: 500 }}
                  />
                  <Bar 
                    dataKey="amount" 
                    fill="#1e40af" 
                    radius={[4, 4, 0, 0]}
                    name="Expected Payment"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Invoices by Vendor Table */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-900">Invoices by Vendor</CardTitle>
            <p className="text-sm text-gray-500">Top vendors by invoice count and net value.</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="grid grid-cols-3 gap-2 pb-2 border-b border-gray-200">
                <span className="text-xs font-semibold text-gray-600">Vendor</span>
                <span className="text-xs font-semibold text-gray-600 text-center"># Invoices</span>
                <span className="text-xs font-semibold text-gray-600 text-right">Net Value</span>
              </div>
              {vendorsData?.vendors?.slice(0, 3).map((vendor: any) => (
                <div key={vendor.name} className="grid grid-cols-3 gap-2 py-2 text-sm border-b border-gray-100">
                  <span className="text-gray-900 font-medium truncate">{vendor.name}</span>
                  <span className="text-gray-600 text-center">{vendor.invoiceCount || 0}</span>
                  <span className="text-gray-900 font-semibold text-right">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'EUR',
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    }).format(parseFloat(vendor.totalSpend)).replace('EUR', '€')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
