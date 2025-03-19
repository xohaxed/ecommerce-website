import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUp } from "lucide-react"

interface StatsElementProps {
  title?: string
  value?: string | number
  description?: string
  icon?: React.ReactNode
  trend?: number
  trendLabel?: string
}

export function StatsElement({
  title = "Total Revenue",
  value = "$45,231.89",
  description = "Monthly revenue",
  icon,
  trend = 12.5,
  trendLabel = "Since last month",
}: StatsElementProps) {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center text-xs">
          <span className="text-green-500 flex items-center mr-1">
            <ArrowUp className="h-3 w-3 mr-0.5" />
            {trend}%
          </span>
          <span className="text-muted-foreground">{trendLabel}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  )
}

