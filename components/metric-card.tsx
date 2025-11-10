import type React from "react"
import { TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface MetricCardProps {
  label: string
  sublabel?: string
  value: string | number
  trend?: number
  trendLabel?: string
  sparklineData?: number[]
}

export function MetricCard({
  label,
  sublabel,
  value,
  trend,
  trendLabel,
  sparklineData = [],
}: MetricCardProps) {
  const isPositive = trend ? trend >= 0 : true
  const W =80
  const H = 30
  const PAD = 4
  const BASELINE = H - PAD

  // Convert data to [x, y] points
  const makePoints = (data: number[]) => {
    if (!data.length) return [] as Array<[number, number]>
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1
    const step = (W - PAD * 2) / Math.max(1, data.length - 1)
    return data.map((v, i) => {
      const x = PAD + i * step
      const y = H - PAD - ((v - min) / range) * (H - PAD * 2)
      return [x, y] as [number, number]
    })
  }

  // Smooth path generation
  const toSmoothPath = (pts: Array<[number, number]>) => {
    if (pts.length < 2) return ""
    let d = `M ${pts[0][0]} ${pts[0][1]}`
    for (let i = 1; i < pts.length; i++) {
      const [px, py] = pts[i - 1]
      const [x, y] = pts[i]
      const cx = (px + x) / 2
      const cy = (py + y) / 2
      d += ` Q ${px} ${py} ${cx} ${cy}`
    }
    const [lx, ly] = pts[pts.length - 1]
    d += ` T ${lx} ${ly}`
    return d
  }

  // Area under curve
  const toAreaPath = (pts: Array<[number, number]>) => {
    if (pts.length < 2) return ""
    const line = toSmoothPath(pts)
    return `${line} L ${pts[pts.length - 1][0]} ${BASELINE} L ${pts[0][0]} ${BASELINE} Z`
  }

  const points = makePoints(sparklineData)
  const linePath = toSmoothPath(points)
  const areaPath = toAreaPath(points)
  const end = points[points.length - 1] ?? [0, 0]
  const color = isPositive ? "#10b981" : "#ef4444"

  return (
    <Card className="bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all">
      <CardContent>
        <div className="space-y-3">
          {/* Top Section */}
          <p className="text-sm text-gray-600 flex justify-between">
            {label} {sublabel && <span className="text-gray-400">{sublabel}</span>}
          </p>

          {/* Main Value + Sparkline */}
          <div className="flex items-end justify-between">
            <p className="text-2xl font-bold text-gray-900">{value}</p>

            {sparklineData.length > 0 && (
              <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="ml-2">
                <defs>
                  {/* Gradient Fade */}
                  <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor={color} stopOpacity="0.3" />
                    <stop offset="1" stopColor={color} stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Fade under curve */}
                <path d={areaPath} fill="url(#fade)" />

                {/* Line Path */}
                <path
                  d={linePath}
                  fill="none"
                  stroke={color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* End Circle */}
                <circle
                  cx={end[0]}
                  cy={end[1]}
                  r="4"
                  fill="#fff"
                  stroke={color}
                  strokeWidth="2"
                />
              </svg>
            )}
          </div>

          {/* Trend Section */}
          {trend !== undefined && (
            <div className="flex items-center gap-1 text-xs">
              {isPositive ? (
                <TrendingUp className="w-3 h-3 text-green-500" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-500" />
              )}
              <span className={isPositive ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                {isPositive ? "+" : ""}
                {trend?.toFixed(1)}%
              </span>
              <span className="text-gray-500">{trendLabel || "from last month"}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
