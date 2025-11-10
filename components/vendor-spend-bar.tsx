"use client"

import { useState } from "react"
import styles from "./vendor-bar.module.css"

interface VendorSpendBarProps {
  vendors: Array<{
    name: string
    totalSpend: string
  }>
}

export function VendorSpendBar({ vendors }: VendorSpendBarProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const total = vendors.reduce((sum, v) => sum + parseFloat(v.totalSpend), 0)
  const maxSpend = Math.max(...vendors.map(v => parseFloat(v.totalSpend)))

  // Calculate x-axis labels
  const formatAxisLabel = (value: number) => {
    if (value >= 1000) {
      return `€${(value / 1000).toFixed(0)}k`
    }
    return `€${value}`
  }

  const axisSteps = [0, maxSpend * 0.33, maxSpend * 0.66, maxSpend]

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {vendors.slice(0, 8).map((vendor, index) => {
          const percentage = (parseFloat(vendor.totalSpend) / maxSpend) * 100
          const isHovered = hoveredIndex === index

          return (
            <div key={vendor.name} className="relative">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600 font-medium">{vendor.name}</span>
              </div>
              <div 
                className="h-8 bg-gray-100 rounded-[4px] overflow-hidden relative cursor-pointer"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div
                  className={`${styles.vendorBar} ${styles[`vendorBarColor${index % 8}`]}`}
                  style={{ width: `${Math.max(percentage, 5)}%` }}
                >
                  {isHovered && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="bg-white px-3 py-1.5 rounded shadow-lg z-10 whitespace-nowrap">
                        <p className="text-xs font-semibold text-gray-900">{vendor.name}</p>
                        <p className="text-xs text-gray-600">
                          Vendor Spend:{" "}
                          <span className="font-semibold">
                            € {parseFloat(vendor.totalSpend).toLocaleString("de-DE", { minimumFractionDigits: 2 })}
                          </span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      {/* X-axis labels */}
      <div className="flex justify-between px-1 pt-2">
        {axisSteps.map((value, index) => (
          <span key={index} className="text-xs text-gray-500">
            {formatAxisLabel(value)}
          </span>
        ))}
      </div>
    </div>
  )
}
