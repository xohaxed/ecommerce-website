import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

type MonthlyData = {
  month: number;
  total: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type") || "overview"  // Default to overview if no type is provided

  try {
    if (type === "overview") {
      const now = new Date()
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

      // Fetch total revenue
      const totalRevenueResult = await prisma.customer_order.aggregate({ _sum: { total: true } })
      const totalRevenue = totalRevenueResult._sum.total || 0

      // Revenue calculations
      const thisMonthRevenueResult = await prisma.customer_order.aggregate({
        _sum: { total: true },
        where: { dateTime: { gte: startOfThisMonth } },
      })
      const lastMonthRevenueResult = await prisma.customer_order.aggregate({
        _sum: { total: true },
        where: { dateTime: { gte: startOfLastMonth, lt: startOfThisMonth } },
      })

      const thisMonthRevenue = thisMonthRevenueResult._sum.total || 0
      const lastMonthRevenue = lastMonthRevenueResult._sum.total || 0
      const revenueTrend = lastMonthRevenue > 0
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : 100

      // Fetch total counts
      const totalOrders = await prisma.customer_order.count()
      const totalProducts = await prisma.product.count()
      const totalUsers = await prisma.user.count()

      // Orders trend
      const ordersThisMonth = await prisma.customer_order.count({
        where: { dateTime: { gte: startOfThisMonth } },
      })
      const ordersLastMonth = await prisma.customer_order.count({
        where: { dateTime: { gte: startOfLastMonth, lt: startOfThisMonth } },
      })
      const ordersTrend = ordersLastMonth > 0
        ? ((ordersThisMonth - ordersLastMonth) / ordersLastMonth) * 100
        : 100

      // Fetch monthly data for all months
      const monthlyDataResult = await prisma.$queryRaw<MonthlyData[]>`
        SELECT EXTRACT(MONTH FROM \`dateTime\`) AS month, SUM(\`total\`) AS total
        FROM \`singitronic_nextjs\`.\`customer_order\`
        GROUP BY month
        ORDER BY month ASC;
      `

      const mappedMonthlyData = monthlyDataResult.map(item => ({
        name: new Date(2020, item.month - 1).toLocaleString('default', { month: 'short' }),
        total: item.total || 0,
      }))

      return NextResponse.json({
        totalRevenue,
        totalOrders,
        totalProducts,
        totalUsers,
        visitors: totalUsers,
        visitorsTrend: parseFloat(ordersTrend.toFixed(2)),
        revenueTrend: parseFloat(revenueTrend.toFixed(2)),
        monthlyData: mappedMonthlyData,
      })
    }

    if (type === "recentSales") {
      const recentSales = await prisma.customer_order.findMany({
        take: 5,
        orderBy: { dateTime: "desc" },
        select: { id: true, name: true, total: true, dateTime: true },
      })

      return NextResponse.json(recentSales)
    }

    return NextResponse.json({ error: "Invalid query type" }, { status: 400 })

  } catch (error) {
    console.error("API Error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
