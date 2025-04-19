"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

const monthsData = [
  { name: "Jan", total: 0 },
  { name: "Feb", total: 0 },
  { name: "Mar", total: 0 },
  { name: "Apr", total: 0 },
  { name: "May", total: 0 },
  { name: "Jun", total: 0 },
  { name: "Jul", total: 0 },
  { name: "Aug", total: 0 },
  { name: "Sep", total: 0 },
  { name: "Oct", total: 0 },
  { name: "Nov", total: 0 },
  { name: "Dec", total: 0 },
]

interface OverviewProps {
  data: { name: string; total: number }[] // From the API
}

export function Overview({ data }: OverviewProps) {
  // Merge API data into monthsData template
  const mergedData = monthsData.map((month) => {
    const apiMonth = data.find((d) => d.name.slice(0, 3).toLowerCase() === month.name.toLowerCase())
    return {
      name: month.name,
      total: apiMonth ? apiMonth.total : 0,
    }
  })

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={mergedData}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <Tooltip formatter={(value) => `$${value}`} />
        <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
