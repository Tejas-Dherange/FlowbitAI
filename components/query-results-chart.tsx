"use client"

import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card } from "@/components/ui/card"
import { isNumericColumn } from "@/lib/query-utils"

interface QueryResultsChartProps {
  results: any[]
  columns: string[]
}

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"]

export function QueryResultsChart({ results, columns }: QueryResultsChartProps) {
  if (results.length === 0 || columns.length === 0) return null

  const numericColumns = columns.filter((col) =>
    isNumericColumn(
      col,
      results.map((r) => r[col]),
    ),
  )
  const nonNumericColumns = columns.filter((col) => !numericColumns.includes(col))

  if (numericColumns.length === 0 || results.length < 2) {
    return null
  }

  const categoryColumn = nonNumericColumns[0] || columns[0]
  const valueColumn = numericColumns[0]

  const isSimpleCategory = results.length === 1
  const chartHeight = Math.min(300, Math.max(200, results.length * 20))

  if (isSimpleCategory && results.length <= 8) {
    return (
      <Card className="bg-slate-900 border-slate-700 p-4">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={results}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}`}
              outerRadius={60}
              fill="#8884d8"
              dataKey={valueColumn}
              nameKey={categoryColumn}
            >
              {results.map((_, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
              labelStyle={{ color: "#e2e8f0" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-900 border-slate-700 p-4">
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={results} layout={results.length > 6 ? "vertical" : "horizontal"}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          {results.length > 6 ? (
            <>
              <XAxis type="number" stroke="#94a3b8" />
              <YAxis dataKey={categoryColumn} type="category" stroke="#94a3b8" width={150} />
            </>
          ) : (
            <>
              <XAxis dataKey={categoryColumn} stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
            </>
          )}
          <Tooltip
            contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
            labelStyle={{ color: "#e2e8f0" }}
          />
          <Bar dataKey={valueColumn} fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
