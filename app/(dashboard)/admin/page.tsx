"use client"

import { useEffect, useState } from "react"
import { DollarSign, Package, ShoppingCart, ArrowUp } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Overview } from "@/components/overview"
import { RecentSales } from "@/components/recent-sales"
import { StatsElement } from "@/components/stats-element"

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalRevenue: 45231.89,
    totalOrders: 12234,
    totalProducts: 2350,
    totalUsers: 573,
    visitors: 1200,
    visitorsTrend: 12.5,
  })

  useEffect(() => {
    // This would be replaced with actual API calls to get dashboard stats
    setStats({
      totalRevenue: 45231.89,
      totalOrders: 12234,
      totalProducts: 2350,
      totalUsers: 573,
      visitors: 1200,
      visitorsTrend: 12.5,
    })
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
          trend={20.1}
        />
        <StatsElement
          title="Total Orders"
          value={stats.totalOrders.toLocaleString()}
          description="Monthly orders"
          icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
          trend={19}
        />
        <StatsElement
          title="Total Products"
          value={stats.totalProducts.toLocaleString()}
          description="Active products"
          icon={<Package className="h-4 w-4 text-muted-foreground" />}
          trend={180.1}
        />
      </div>

      <Card className="bg-primary text-primary-foreground">
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
            <Overview />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>You made 265 sales this month.</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentSales />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

