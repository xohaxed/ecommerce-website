import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { customerOrderId, productId, quantity } = await request.json()

    const response = await fetch("http://localhost:3001/api/order-product", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customerOrderId,
        productId,
        quantity,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Error creating order product:", errorText)
      throw new Error(`Failed to create order product: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in order-product API route:", error)
    return NextResponse.json({ error: "Failed to create order product" }, { status: 500 })
  }
}

