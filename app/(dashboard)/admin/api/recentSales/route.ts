// /app/api/recentSales/route.ts
import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Fetch the most recent 5 sales from the database
    const recentSales = await prisma.customer_order.findMany({
      take: 5, // Limit to 5 recent sales
      orderBy: {
        dateTime: "desc", // Sort by the most recent date
      },
      select: {
        id: true,
        name: true,
        email: true,
        total: true,
      },
    })

    // Return the recent sales as a JSON response
    return NextResponse.json(recentSales)
  } catch (error) {
    console.error("Error fetching recent sales:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
