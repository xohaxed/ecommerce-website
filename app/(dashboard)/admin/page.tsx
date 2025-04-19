"use client"

import { useEffect, useState } from "react"
import { DollarSign, Package, ShoppingCart, ArrowUp } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Overview } from "@/components/overview"
import { RecentSales } from "@/components/recent-sales"
import { StatsElement } from "@/components/stats-element"

export default function DashboardPage() {
  const [chartData, setChartData] = useState<{ name: string; total: number }[]>([]) // Initialize with empty data
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    visitors: 0,
    visitorsTrend: 0,
    revenueTrend: 0,
  })

  const [recentSales, setRecentSales] = useState<any[]>([]) // State to store recent sales

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/admin/api")
        const data = await res.json()
        setStats(data)
      } catch (err) {
        console.error("Failed to fetch dashboard stats:", err)
      }
    }

    const fetchChartData = async () => {
      try {
        const res = await fetch("/api/overviewData") // Fetch the chart data from your API
        const data = await res.json()

        const monthsData = [
          "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ]

        const updatedData = monthsData.map((month, index) => ({
          name: month,
          total: data.find((item: any) => item.name === index + 1)?.total || 0,
        }));

        setChartData(updatedData) // Set the chart data
      } catch (err) {
        console.error("Failed to fetch chart data:", err)
      }
    }

    const fetchRecentSales = async () => {
      try {
        const res = await fetch("/api/recentSales") // Fetch recent sales data from your API
        const data = await res.json()
        setRecentSales(data) // Set recent sales data
      } catch (err) {
        console.error("Failed to fetch recent sales:", err)
      }
    }

    fetchStats()
    fetchChartData()
    fetchRecentSales() // Fetch recent sales data when the page loads
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Overview of your store performance" />

      <div className="grid gap-4 md:grid-cols-3">
        <StatsElement
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          description="Monthly revenue"
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          trend={stats.revenueTrend}
        />
        <StatsElement
          title="Total Orders"
          value={stats.totalOrders.toLocaleString()}
          description="Monthly orders"
          icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
          trend={stats.visitorsTrend}
        />
        <StatsElement
          title="Total Products"
          value={stats.totalProducts.toLocaleString()}
          description="Active products"
          icon={<Package className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <Card className="bg-white text-black-foreground">
        <CardContent className="flex flex-col items-center justify-center py-6">
          <h4 className="text-2xl font-medium mb-2">Number of visitors today</h4>
          <p className="text-4xl font-bold mb-2">{stats.visitors.toLocaleString()}</p>
          <p className="text-green-300 flex items-center gap-1">
            <ArrowUp className="h-4 w-4" />
            {stats.visitorsTrend}% Since last month
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Monthly sales overview</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <Overview data={chartData} />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>You made {recentSales.length} sales this month.</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentSales sales={recentSales} /> {/* Pass recent sales data here */}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
