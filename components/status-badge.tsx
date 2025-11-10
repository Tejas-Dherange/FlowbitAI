import { Badge } from "@/components/ui/badge"

interface StatusBadgeProps {
  status: "paid" | "pending" | "overdue"
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const variants = {
    paid: "bg-green-50 text-green-700 border-green-200",
    pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
    overdue: "bg-red-50 text-red-700 border-red-200",
  }

  const labels = {
    paid: "Paid",
    pending: "Pending",
    overdue: "Overdue",
  }

  return (
    <Badge variant="outline" className={`${variants[status]} font-medium`}>
      {labels[status]}
    </Badge>
  )
}
