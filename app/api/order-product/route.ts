import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const orderId = searchParams.get("orderId")

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId parameter" }, { status: 400 })
    }

    // First, fetch the order-product relationships from ordercustomerproduct
    const orderProductsResponse = await fetch(`http://localhost:3001/api/order-product?orderId=${orderId}`)

    if (!orderProductsResponse.ok) {
      throw new Error(`Failed to fetch order products: ${orderProductsResponse.status}`)
    }

    const orderProducts = await orderProductsResponse.json()

    if (!orderProducts || orderProducts.length === 0) {
      console.log(`No products found for order ${orderId}`)
      return NextResponse.json({ products: [] })
    }

    // Extract product IDs and quantities
    const productDetails = orderProducts.map((item: any) => ({
      productId: item.productId,
      quantity: item.quantity,
    }))

    // Fetch full product details for each product ID
    const productPromises = productDetails.map(async (detail: { productId: string; quantity: number }) => {
      const productResponse = await fetch(`http://localhost:3001/api/product/${detail.productId}`)

      if (!productResponse.ok) {
        console.error(`Failed to fetch product ${detail.productId}: ${productResponse.status}`)
        return null
      }

      const product = await productResponse.json()

      // Combine product data with quantity
      return {
        ...product,
        amount: detail.quantity,
      }
    })

    // Wait for all product details to be fetched
    const products = await Promise.all(productPromises)

    // Filter out any null results (failed fetches)
    const validProducts = products.filter((p) => p !== null)

    return NextResponse.json({ products: validProducts })
  } catch (error) {
    console.error("Error fetching order products:", error)
    return NextResponse.json({ error: "Failed to fetch order products" }, { status: 500 })
  }
}



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

