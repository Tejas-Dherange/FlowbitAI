"use client"

import { InvoicesTable } from "@/components/invoices-table"

export default function InvoicesPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 text-slate-200">Invoices</h1>
      </div>
      <InvoicesTable />
    </div>
  )
}