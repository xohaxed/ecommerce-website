// getChartData.ts
import { PrismaClient } from "@prisma/client"
import { startOfMonth, endOfMonth } from "date-fns"

const prisma = new PrismaClient()

type MonthlyData = {
  name: string
  total: number
}

export async function getChartData(): Promise<MonthlyData[]> {
  const now = new Date()
  const currentYear = now.getFullYear()

  const monthlyData = await Promise.all(
    Array.from({ length: 12 }, (_, i) => {
      const firstDay = startOfMonth(new Date(currentYear, i))
      const lastDay = endOfMonth(new Date(currentYear, i))

      return prisma.customer_order.aggregate({
        _sum: {
          total: true,
        },
        where: {
          dateTime: {
            gte: firstDay,
            lte: lastDay,
          },
        },
      }).then((result: { _sum: { total: number | null } }) => ({
        name: new Date(currentYear, i).toLocaleString("default", { month: "short" }),
        total: result._sum.total ?? 0,
      }))
    })
  )

  return monthlyData
}
