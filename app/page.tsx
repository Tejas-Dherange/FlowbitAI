"use client"

import useSWR from "swr"
import { MetricCard } from "@/components/metric-card"
import { DashboardCharts } from "@/components/dashboard-charts"
import { PanelLeft } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function Dashboard() {
  const { data: stats, isLoading } = useSWR("/api/stats", fetcher)

  if (isLoading) {
    return (
      <div className="p-8 space-y-8">
        <div className="text-center py-16">
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PanelLeft />
            <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">Amit Jadhav</p>
              <p className="text-xs text-gray-500">Admin</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-orange-400 to-pink-500 flex items-center justify-center">
              <span className="text-white text-sm font-semibold">AJ</span>
            </div>
            <button className="p-1 hover:bg-gray-100 rounded" aria-label="More options">
              <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8 space-y-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            label="Total Spend"
            sublabel="(YTD)"
            value={`€ ${stats?.totalSpend?.toLocaleString("de-DE", { maximumFractionDigits: 2 }) || "0"}`}
            trend={stats?.trends?.spendChange}
            trendLabel="from last month"
            sparklineData={stats?.sparklines?.spend || []}
          />
          <MetricCard
            label="Total Invoices Processed"
            value={stats?.totalInvoices || "0"}
            trend={stats?.trends?.invoiceChange}
            trendLabel="from last month"
            sparklineData={stats?.sparklines?.invoices || []}
          />
          <MetricCard
            label="Documents Uploaded"
            sublabel="This Month"
            value={stats?.documentsUploaded || "0"}
            trend={stats?.trends?.documentChange}
            trendLabel="from last month"
            sparklineData={stats?.sparklines?.spend || []}
          />
          <MetricCard
            label="Average Invoice Value"
            value={`€ ${stats?.averageInvoiceValue?.toLocaleString("de-DE", { maximumFractionDigits: 2 }) || "0"}`}
            trend={stats?.trends?.avgValueChange}
            trendLabel="from last month"
            sparklineData={stats?.sparklines?.avgValue || []}
          />
        </div>

        {/* Charts */}
        <DashboardCharts />
      </div>
    </div>
  )
}
