"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { formatCurrency, formatDate, formatNumber } from "@/lib/query-utils"

interface QueryResultsTableProps {
  results: any[]
  columns: string[]
}

export function QueryResultsTable({ results, columns }: QueryResultsTableProps) {
  const [expanded, setExpanded] = useState(false)

  const displayRows = expanded ? results : results.slice(0, 10)
  const hasMore = results.length > 10

  const formatCell = (value: any, columnName: string) => {
    if (value === null || value === undefined) return "—"

    const lowerName = columnName.toLowerCase()

    if (lowerName.includes("date")) {
      try {
        return formatDate(value)
      } catch {
        return value
      }
    }

    if (
      lowerName.includes("total") ||
      lowerName.includes("amount") ||
      lowerName.includes("spend") ||
      lowerName.includes("price")
    ) {
      return typeof value === "number" ? formatCurrency(value) : value
    }

    if (typeof value === "number") {
      return formatNumber(value)
    }

    return value
  }

  return (
    <Card className="bg-slate-900 border-slate-700 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700 hover:bg-transparent bg-slate-800">
              {columns.map((col) => (
                <TableHead key={col} className="text-slate-300 font-semibold text-xs">
                  {col}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayRows.map((row, idx) => (
              <TableRow key={idx} className="border-slate-700 hover:bg-slate-800/50">
                {columns.map((col) => (
                  <TableCell key={`${idx}-${col}`} className="text-slate-300 text-xs py-2">
                    {formatCell(row[col], col)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {hasMore && (
        <div className="flex items-center justify-center p-3 bg-slate-800 border-t border-slate-700">
          {expanded ? (
            <>
              <p className="text-xs text-slate-400 mr-2">Showing all {results.length} results</p>
              <button onClick={() => setExpanded(false)} className="text-xs text-blue-400 hover:text-blue-300">
                Show less
              </button>
            </>
          ) : (
            <>
              <p className="text-xs text-slate-400 mr-2">Showing 10 of {results.length} results</p>
              <button onClick={() => setExpanded(true)} className="text-xs text-blue-400 hover:text-blue-300">
                Show more
              </button>
            </>
          )}
        </div>
      )}
    </Card>
  )
}
