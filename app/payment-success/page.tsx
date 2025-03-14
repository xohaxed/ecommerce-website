"use client"
import { useEffect, useState, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CheckCircle, XCircle, Clock } from "lucide-react"
import toast from "react-hot-toast"
import { useProductStore } from "../_zustand/store"

export default function PaymentSuccess() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { products, clearCart, calculateTotals } = useProductStore()

  const [isLoading, setIsLoading] = useState(true)
  const [paymentStatus, setPaymentStatus] = useState<"success" | "processing" | "error">("processing")
  const [orderCreated, setOrderCreated] = useState(false)

  // Use a ref to track if order creation has been attempted
  const orderCreationAttempted = useRef(false)

  useEffect(() => {
    const amount = searchParams.get("amount")
    const formDataParam = searchParams.get("formData")
    const paymentIntentId = searchParams.get("payment_intent")

    if (!formDataParam || !paymentIntentId) {
      setPaymentStatus("error")
      setIsLoading(false)
      return
    }

    // Only proceed if we haven't attempted order creation yet
    if (!orderCreationAttempted.current) {
      orderCreationAttempted.current = true
      // Verify payment status and create order
      verifyPaymentAndCreateOrder(paymentIntentId, formDataParam)
    }
  }, [searchParams])

  const verifyPaymentAndCreateOrder = async (paymentIntentId: string, formDataParam: string) => {
    try {
      // Call our API to verify the payment status
      const response = await fetch(`/api/verify-payment?payment_intent=${paymentIntentId}`)
      const data = await response.json()

      if (data.status === "succeeded") {
        setPaymentStatus("success")
        // Create order after confirming payment success
        try {
          const formData = JSON.parse(decodeURIComponent(formDataParam))
          const orderSuccess = await createOrder(formData)
          setOrderCreated(orderSuccess)
        } catch (error) {
          console.error("Error parsing form data:", error)
          toast.error("Error processing your order")
          setPaymentStatus("error")
        }
      } else if (data.status === "processing") {
        setPaymentStatus("processing")
        toast.loading("Your payment is processing")
      } else {
        setPaymentStatus("error")
        toast.error("Something went wrong with your payment")
      }
    } catch (error) {
      console.error("Error verifying payment:", error)
      setPaymentStatus("error")
    } finally {
      setIsLoading(false)
    }
  }

  const addOrderProduct = async (orderId: string, productId: string, productQuantity: number) => {
    await fetch("/api/order-product", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customerOrderId: orderId,
        productId: productId,
        quantity: productQuantity,
      }),
    })
  }

  const createOrder = async (formData: any) => {
    try {
      // Calculate totals to ensure we have the latest value
      calculateTotals()
      const { total } = useProductStore.getState()

      console.log("Creating order with data:", {
        formData,
        total,
        products: products.length,
      })

      // Using the same URL as in your original code
      const response = await fetch("http://localhost:3001/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          lastname: formData.lastname,
          phone: formData.phone,
          email: formData.email,
          company: formData.company,
          adress: formData.adress,
          apartment: formData.apartment,
          postalCode: formData.postalCode,
          status: "completed", // Set as completed since payment succeeded
          total: total,
          city: formData.city,
          country: formData.country,
          orderNotice: formData.orderNotice,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Order API error:", response.status, errorText)
        throw new Error(`API returned ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      console.log("Order created successfully:", data)
      const orderId: string = data.id

      // Add each product to the order
      for (let i = 0; i < products.length; i++) {
        console.log(`Adding product ${i + 1}/${products.length} to order`)
        await addOrderProduct(orderId, products[i].id, products[i].amount)
      }

      // Clear cart after successful order creation
      clearCart()
      toast.success("Order created successfully")
      return true
    } catch (error) {
      console.error("Error creating order:", error)
      toast.error("Failed to create order: " + (error instanceof Error ? error.message : "Unknown error"))
      return false
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
          <div className="animate-spin w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full mx-auto"></div>
          <h1 className="text-2xl font-bold text-gray-700 mt-4">Processing Payment...</h1>
          <p className="text-gray-600 mt-2">Please wait while we verify your payment.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md w-full">
        {paymentStatus === "success" && (
          <>
            <CheckCircle className="text-green-500 w-16 h-16 mx-auto" />
            <h1 className="text-2xl font-bold text-green-700 mt-4">Payment Successful!</h1>
            <p className="text-gray-600 mt-4">
              Thank you for your purchase. {orderCreated ? "Your order has been created and is being processed." : ""}
            </p>
            {!orderCreated && (
              <p className="text-yellow-600 mt-2">
                Note: We couldn't create your order. Please contact customer support.
              </p>
            )}
            <button
              onClick={() => router.push("/")}
              className="mt-6 w-full p-3 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 transition-colors"
            >
              Return to Home
            </button>
          </>
        )}

        {paymentStatus === "processing" && (
          <>
            <Clock className="text-blue-500 w-16 h-16 mx-auto" />
            <h1 className="text-2xl font-bold text-blue-700 mt-4">Payment Processing</h1>
            <p className="text-gray-600 mt-4">Your payment is being processed. This may take a moment.</p>
            <p className="text-gray-500 mt-2">You'll receive a confirmation once the payment is complete.</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 w-full p-3 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 transition-colors"
            >
              Check Status
            </button>
          </>
        )}

        {paymentStatus === "error" && (
          <>
            <XCircle className="text-red-500 w-16 h-16 mx-auto" />
            <h1 className="text-2xl font-bold text-red-700 mt-4">Payment Failed</h1>
            <p className="text-gray-600 mt-4">There was an issue processing your payment. Please try again.</p>
            <button
              onClick={() => router.push("/checkout")}
              className="mt-6 w-full p-3 bg-red-600 text-white font-bold rounded-md hover:bg-red-700 transition-colors"
            >
              Return to Checkout
            </button>
          </>
        )}
      </div>
    </div>
  )
}

