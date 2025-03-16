"use client"
import { useEffect, useState, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CheckCircle, XCircle, Clock, FileText, Download } from "lucide-react"
import toast from "react-hot-toast"
import { useProductStore } from "../_zustand/store"
import Script from "next/script"
import { generateInvoice } from "@/lib/generate-invoice"
import type { OrderData } from "@/types/order"

export default function PaymentSuccess() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { products, clearCart, calculateTotals } = useProductStore()

  const [isLoading, setIsLoading] = useState(true)
  const [paymentStatus, setPaymentStatus] = useState<"success" | "processing" | "error">("processing")
  const [orderCreated, setOrderCreated] = useState(false)
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null)
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false)

  // Track script loading status separately
  const [jspdfLoaded, setJspdfLoaded] = useState(false)
  const [autoTableLoaded, setAutoTableLoaded] = useState(false)

  // Use a ref to store order data for invoice generation
  const orderData = useRef<OrderData | null>(null)

  // Use a ref to track the current payment intent to prevent duplicate processing
  const currentPaymentIntentRef = useRef<string | null>(null)

  // Check if both scripts are loaded
  const scriptsLoaded = jspdfLoaded && autoTableLoaded

  // Set a timeout to force enable the button if scripts take too long
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!scriptsLoaded) {
        console.log("Script loading timeout - forcing enabled state")
        setJspdfLoaded(true)
        setAutoTableLoaded(true)
      }
    }, 5000) // 5 second timeout

    return () => clearTimeout(timer)
  }, [scriptsLoaded])

  useEffect(() => {
    const amount = searchParams.get("amount")
    const formDataParam = searchParams.get("formData")
    const paymentIntentId = searchParams.get("payment_intent")

    if (!formDataParam || !paymentIntentId) {
      setPaymentStatus("error")
      setIsLoading(false)
      return
    }

    // Check if we're already processing this payment intent
    if (currentPaymentIntentRef.current === paymentIntentId) {
      console.log("Already processing this payment intent, skipping duplicate processing")
      return
    }

    // Set the current payment intent to prevent duplicate processing
    currentPaymentIntentRef.current = paymentIntentId

    // First check if we already have an order ID for this payment intent in session storage
    const existingOrderId = sessionStorage.getItem(`order-id-${paymentIntentId}`)

    if (existingOrderId) {
      console.log(`Order already exists for payment ${paymentIntentId}, order ID: ${existingOrderId}`)
      setOrderCreated(true)
      setPaymentStatus("success")

      // Try to retrieve order data from sessionStorage for invoice generation
      const savedOrderData = sessionStorage.getItem(`orderData-${paymentIntentId}`)
      if (savedOrderData) {
        try {
          const parsedData = JSON.parse(savedOrderData)
          console.log("Retrieved order data from session storage:", parsedData)
          orderData.current = parsedData

          // If we have an order ID but no products, try to fetch them
          if (!parsedData.products || parsedData.products.length === 0) {
            fetchOrderProducts(existingOrderId, parsedData)
          }
        } catch (e) {
          console.error("Error parsing saved order data:", e)
          // Try to fetch order products if parsing fails
          const formData = JSON.parse(decodeURIComponent(formDataParam))
          const reconstructedOrderData = {
            id: existingOrderId,
            ...formData,
            products: [],
            date: new Date().toLocaleDateString(),
          }
          orderData.current = reconstructedOrderData
          fetchOrderProducts(existingOrderId, reconstructedOrderData)
        }
      } else {
        console.warn("No saved order data found in session storage")
        // Reconstruct basic order data and fetch products
        const formData = JSON.parse(decodeURIComponent(formDataParam))
        const reconstructedOrderData = {
          id: existingOrderId,
          ...formData,
          products: [],
          date: new Date().toLocaleDateString(),
        }
        orderData.current = reconstructedOrderData
        fetchOrderProducts(existingOrderId, reconstructedOrderData)
      }

      setIsLoading(false)
      return
    }

    // If no existing order, check if payment is valid and create order
    verifyPaymentAndCreateOrder(paymentIntentId, formDataParam)
  }, [searchParams, products])

  // Function to fetch products for an existing order
  const fetchOrderProducts = async (orderId: string, baseOrderData: OrderData) => {
    try {
      console.log(`Fetching products for order ${orderId}`)
      const response = await fetch(`/api/order-product?orderId=${orderId}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch order products: ${response.status}`)
      }

      const data = await response.json()

      if (data.products && Array.isArray(data.products)) {
        console.log(`Found ${data.products.length} products for order ${orderId}`)

        // Update the order data with the fetched products
        const updatedOrderData = {
          ...baseOrderData,
          products: data.products,
        }

        // Save the updated order data
        orderData.current = updatedOrderData
        sessionStorage.setItem(`orderData-${currentPaymentIntentRef.current}`, JSON.stringify(updatedOrderData))
      } else {
        console.warn(`No products returned for order ${orderId}`)
      }
    } catch (error) {
      console.error("Error fetching order products:", error)
      toast.error("Could not fetch order products")
    }
  }

  const verifyPaymentAndCreateOrder = async (paymentIntentId: string, formDataParam: string) => {
    try {
      setIsLoading(true)

      // Check if we already have an order ID for this payment intent
      const existingOrderId = sessionStorage.getItem(`order-id-${paymentIntentId}`)
      if (existingOrderId) {
        console.log(`Order already exists for payment ${paymentIntentId}, order ID: ${existingOrderId}`)
        setOrderCreated(true)
        setPaymentStatus("success")
        setIsLoading(false)
        return
      }

      // Fetch payment status
      const res = await fetch(`/api/verify-payment?payment_intent=${paymentIntentId}`)
      const paymentData = await res.json()

      if (paymentData.status !== "succeeded") {
        setPaymentStatus(paymentData.status === "processing" ? "processing" : "error")
        setIsLoading(false)
        return
      }

      setPaymentStatus("success")

      // Parse formData from URL params
      const formData = JSON.parse(decodeURIComponent(formDataParam))

      // Call createOrder to actually place the order
      const orderResult = await createOrder(formData, paymentIntentId)

      if (orderResult.success) {
        // Store order ID in session storage to prevent duplicate creation
        sessionStorage.setItem(`order-id-${paymentIntentId}`, orderResult.orderId)

        // Store order data for invoice generation
        if (orderResult.orderData) {
          orderData.current = orderResult.orderData
          sessionStorage.setItem(`orderData-${paymentIntentId}`, JSON.stringify(orderResult.orderData))

          // If we have an order ID but no products, try to fetch them
          if (!orderResult.orderData.products || orderResult.orderData.products.length === 0) {
            fetchOrderProducts(orderResult.orderId, orderResult.orderData)
          }
        }

        setOrderCreated(true)
      }

      setIsLoading(false)
    } catch (error) {
      console.error("Error verifying payment and creating order:", error)
      setPaymentStatus("error")
      setIsLoading(false)
    }
  }

  const checkIfOrderExists = async (paymentIntentId: string): Promise<string | null> => {
    try {
      // First check session storage
      const existingOrderId = sessionStorage.getItem(`order-id-${paymentIntentId}`)
      if (existingOrderId) {
        return existingOrderId
      }

      // If not in session storage, you could check your database
      // This would require a new API endpoint to check if an order exists for a payment intent
      // For example:
      // const response = await fetch(`/api/check-order-exists?payment_intent=${paymentIntentId}`)
      // const data = await response.json()
      // if (data.exists) {
      //   sessionStorage.setItem(`order-id-${paymentIntentId}`, data.orderId)
      //   return data.orderId
      // }

      return null
    } catch (error) {
      console.error("Error checking if order exists:", error)
      return null
    }
  }

  const addOrderProduct = async (orderId: string, productId: string, productQuantity: number) => {
    try {
      console.log(`Adding product ${productId} to order ${orderId}, quantity: ${productQuantity}`)

      const response = await fetch("/api/order-product", {
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

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Error adding product to order: ${errorText}`)
        throw new Error(`Failed to add product to order: ${response.status}`)
      }

      const data = await response.json()
      console.log("Product added to order successfully:", data)
      return data
    } catch (error) {
      console.error("Error in addOrderProduct:", error)
      throw error
    }
  }

  // Update the createOrder function to include tax and shipping in the order data
  const createOrder = async (formData: any, paymentIntentId: string) => {
    try {
      // Check if order already exists for this payment intent
      const existingOrderId = await checkIfOrderExists(paymentIntentId)
      if (existingOrderId) {
        console.log(`Order already exists for payment ${paymentIntentId}, order ID: ${existingOrderId}`)

        // Try to retrieve complete order data from session storage
        const savedOrderData = sessionStorage.getItem(`orderData-${paymentIntentId}`)
        if (savedOrderData) {
          try {
            return {
              success: true,
              orderId: existingOrderId,
              orderData: JSON.parse(savedOrderData),
            }
          } catch (e) {
            console.error("Error parsing saved order data:", e)
          }
        }

        // If no saved data or error parsing, reconstruct with current state
        // Fetch products for this order
        try {
          const productsResponse = await fetch(`/api/fetch-order-product?orderId=${existingOrderId}`)
          const productsData = await productsResponse.json()

          return {
            success: true,
            orderId: existingOrderId,
            orderData: {
              id: existingOrderId,
              ...formData,
              products: productsData.products || [],
              subtotal: useProductStore.getState().total,
              tax: useProductStore.getState().total * 0.2, // Assuming 20% tax
              shipping: 5, // Assuming $5 shipping
              total: useProductStore.getState().total * 1.2 + 5, // Subtotal + tax + shipping
              date: new Date().toLocaleDateString(),
            },
          }
        } catch (error) {
          console.error("Error fetching products for existing order:", error)
          // Return basic order data without products
          return {
            success: true,
            orderId: existingOrderId,
            orderData: {
              id: existingOrderId,
              ...formData,
              products: [],
              subtotal: useProductStore.getState().total,
              tax: useProductStore.getState().total * 0.2,
              shipping: 5,
              total: useProductStore.getState().total * 1.2 + 5,
              date: new Date().toLocaleDateString(),
            },
          }
        }
      }

      calculateTotals()
      const { total } = useProductStore.getState()
      const currentProducts = useProductStore.getState().products

      // Calculate tax and shipping
      const subtotal = total
      const tax = subtotal * 0.2 // Assuming 5% tax
      const shipping = 5 // Assuming $5 shipping
      const finalTotal = subtotal + tax + shipping

      console.log("Creating order with products:", currentProducts)

      const response = await fetch("http://localhost:3001/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          lastname: formData.lastname,
          phone: formData.phone,
          email: formData.email,
          company: formData.company,
          adress: formData.adress,
          apartment: formData.apartment,
          postalCode: formData.postalCode,
          status: "completed",
          total: finalTotal, // Use the final total with tax and shipping
          subtotal: subtotal,
          tax: tax,
          shipping: shipping,
          city: formData.city,
          country: formData.country,
          orderNotice: formData.orderNotice,
          paymentIntentId: paymentIntentId,
        }),
      })

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${await response.text()}`)
      }

      const data = await response.json()
      const orderId: string = data.id

      console.log(`Order created with ID: ${orderId}, adding ${currentProducts.length} products`)

      // Add each product to the order
      const orderProductPromises = currentProducts.map((product) =>
        addOrderProduct(orderId, product.id, product.amount),
      )

      try {
        await Promise.all(orderProductPromises)
        console.log("All products added to order successfully")
      } catch (error) {
        console.error("Error adding products to order:", error)
      }

      // Create order data object for invoice generation with detailed product info
      const orderDataObj = {
        id: orderId,
        ...formData,
        products: currentProducts.map((p) => ({
          id: p.id,
          title: p.title , // Map name to title for invoice
          price: p.price,
          amount: p.amount,
          mainImage: p.image, // Map image to mainImage
        })),
        subtotal,
        tax,
        shipping,
        total: finalTotal,
        date: new Date().toLocaleDateString(),
      }

      console.log("Order data with products:", orderDataObj)

      clearCart()
      toast.success("Order created successfully")

      return { success: true, orderId, orderData: orderDataObj }
    } catch (error) {
      console.error("Error creating order:", error)
      toast.error("Failed to create order: " + (error instanceof Error ? error.message : "Unknown error"))
      return { success: false, orderId: null }
    }
  }

  const handleGenerateInvoice = async () => {
    if (!orderData.current) {
      toast.error("Order data not available")
      return
    }

    setIsGeneratingInvoice(true)

    try {
      // If we have an order ID but no products, try to fetch them first
      if (orderData.current.id && (!orderData.current.products || orderData.current.products.length === 0)) {
        await fetchOrderProducts(orderData.current.id, orderData.current)
      }

      // Use the separate invoice generation function
      const url = await generateInvoice(orderData.current)
      setInvoiceUrl(url)
      toast.success("Invoice generated successfully")
    } catch (error) {
      console.error("Error generating invoice:", error)
      toast.error("Failed to generate invoice: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setIsGeneratingInvoice(false)
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
      {/* Load jsPDF and jsPDF-autotable scripts */}
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
        integrity="sha512-qZvrmS2ekKPF2mSznTQsxqPgnpkI4DNTlrdUmTzrDgektczlKNRRhy5X5AAOnx5S09ydFYWWNSfcEqDTTHgtNA=="
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        strategy="beforeInteractive"
        onLoad={() => {
          console.log("jsPDF loaded via Next.js Script")
          setJspdfLoaded(true)
        }}
        onError={(e) => {
          console.error("Error loading jsPDF:", e)
        }}
      />
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js"
        integrity="sha512-NHKtYm0BOY8QsEIZ9CgQPXgTvnzRs5/IzGXX6mpMxCIIJpRSFBRiLPZPCIHBZDZYbUGS3lKUkCkQZJuVIW7d0A=="
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        strategy="beforeInteractive"
        onLoad={() => {
          console.log("AutoTable loaded via Next.js Script")
          setAutoTableLoaded(true)
        }}
        onError={(e) => {
          console.error("Error loading AutoTable:", e)
        }}
      />

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

            {orderCreated && !invoiceUrl && (
              <button
                onClick={handleGenerateInvoice}
                disabled={isGeneratingInvoice}
                className="mt-4 flex items-center justify-center w-full p-3 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
              >
                {isGeneratingInvoice ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Generating Invoice...
                  </>
                ) : !scriptsLoaded ? (
                  <>
                    <FileText className="mr-2 h-5 w-5" />
                    Generate Invoice
                    <span className="ml-2 text-xs">(PDF libraries loading...)</span>
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-5 w-5" />
                    Generate Invoice
                  </>
                )}
              </button>
            )}

            {invoiceUrl && (
              <a
                href={invoiceUrl}
                download={`invoice-${orderData.current?.id || "order"}.pdf`}
                className="mt-4 flex items-center justify-center w-full p-3 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 transition-colors"
              >
                <Download className="mr-2 h-5 w-5" />
                Download Invoice
              </a>
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

