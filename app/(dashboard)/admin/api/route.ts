import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const now = new Date()
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // Total revenue (all-time)
    const totalRevenueResult = await prisma.customer_order.aggregate({
      _sum: {
        total: true,
      },
    })

    const totalRevenue = totalRevenueResult._sum.total || 0

    // Revenue this month
    const thisMonthRevenueResult = await prisma.customer_order.aggregate({
      _sum: {
        total: true,
      },
      where: {
        dateTime: {
          gte: startOfThisMonth,
        },
      },
    })

    // Revenue last month
    const lastMonthRevenueResult = await prisma.customer_order.aggregate({
      _sum: {
        total: true,
      },
      where: {
        dateTime: {
          gte: startOfLastMonth,
          lt: startOfThisMonth,
        },
      },
    })

    const thisMonthRevenue = thisMonthRevenueResult._sum.total || 0
    const lastMonthRevenue = lastMonthRevenueResult._sum.total || 0

    const revenueTrend =
      lastMonthRevenue > 0
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : 100 // default if no revenue last month

    const totalOrders = await prisma.customer_order.count()
    const totalProducts = await prisma.product.count()
    const totalUsers = await prisma.user.count()

    const ordersThisMonth = await prisma.customer_order.count({
      where: {
        dateTime: {
          gte: startOfThisMonth,
        },
      },
    })

    const ordersLastMonth = await prisma.customer_order.count({
      where: {
        dateTime: {
          gte: startOfLastMonth,
          lt: startOfThisMonth,
        },
      },
    })

    const ordersTrend =
      ordersLastMonth > 0
        ? ((ordersThisMonth - ordersLastMonth) / ordersLastMonth) * 100
        : 100

    // Fetch the most recent 5 sales (orders)
    const recentSales = await prisma.customer_order.findMany({
      take: 5, // Modify the number of sales as needed
      orderBy: {
        dateTime: "desc", // Sort by the most recent date
      },
      select: {
        id: true,
        name: true,
        total: true,
        dateTime: true,
      },
    })

    const stats = {
      totalRevenue,
      totalOrders,
      totalProducts,
      totalUsers,
      visitors: totalUsers,
      visitorsTrend: parseFloat(ordersTrend.toFixed(2)),
      revenueTrend: parseFloat(revenueTrend.toFixed(2)),
      recentSales, // Pass the recent sales data
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("API Error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
