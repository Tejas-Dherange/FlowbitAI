"use client"

import { useState, useCallback } from "react"
import useSWR from "swr"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "./status-badge"
import { ChevronLeft, ChevronRight } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface Invoice {
  id: string
  invoiceNumber: string
  vendor: { id: string; name: string }
  date: string
  amount: number
  status: "paid" | "pending" | "overdue"
}

interface InvoicesResponse {
  invoices: Invoice[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export function InvoicesTable() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<string>("all") // Updated default value to 'all'
  const [sortBy, setSortBy] = useState("invoice_date")
  const [order, setOrder] = useState("DESC")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  // Debounce search
  const handleSearch = useCallback((value: string) => {
    setSearch(value)
    const timer = setTimeout(() => setDebouncedSearch(value), 300)
    return () => clearTimeout(timer)
  }, [])

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    search: debouncedSearch,
    status,
    sortBy,
    order,
  })

  const { data, isLoading } = useSWR<InvoicesResponse>(`/api/invoices?${params}`, fetcher, { revalidateOnFocus: false })
  console.log("Data",data);

  const invoices = data?.invoices || []
  const pagination = data?.pagination

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardHeader className="border-b">
        <CardTitle className="text-xl font-semibold text-gray-900">Recent Invoices</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="flex gap-4 flex-wrap">
          <Input
            placeholder="Search invoices..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="flex-1 min-w-[200px] bg-white border-gray-200"
          />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={limit.toString()}
            onValueChange={(v) => {
              setLimit(Number.parseInt(v))
              setPage(1)
            }}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 rows</SelectItem>
              <SelectItem value="25">25 rows</SelectItem>
              <SelectItem value="50">50 rows</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto border rounded-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-gray-900">Invoice #</TableHead>
                <TableHead className="font-semibold text-gray-900">Vendor</TableHead>
                <TableHead className="font-semibold text-gray-900">Date</TableHead>
                <TableHead className="text-right font-semibold text-gray-900">Amount</TableHead>
                <TableHead className="font-semibold text-gray-900">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                      Loading...
                    </div>
                  </TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No invoices found
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => (
                  <TableRow key={invoice.id} className="hover:bg-gray-50 transition-colors">
                    <TableCell className="font-medium text-gray-900">{invoice.invoiceNumber}</TableCell>
                    <TableCell className="text-gray-600">{invoice.vendor.name}</TableCell>
                    <TableCell className="text-gray-600">{new Date(invoice.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right font-medium text-gray-900">
                      ${invoice.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={invoice.status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {pagination && (
          <div className="flex items-center justify-between border-t pt-4">
            <p className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="border-gray-200 hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                disabled={page === pagination.totalPages}
                className="border-gray-200 hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
