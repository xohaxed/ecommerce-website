"use client"
import { useEffect, useState, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CheckCircle, XCircle, Clock, FileText, Download } from "lucide-react"
import toast from "react-hot-toast"
import { useProductStore } from "../_zustand/store"
import Script from "next/script"

interface Product {
  id: string
  name: string
  price: number
  image: string
  amount: number
}

// Update the OrderData interface to include tax and shipping
interface OrderData {
  id: string
  name: string
  lastname: string
  email: string
  phone: string
  company: string
  adress: string
  apartment?: string
  city: string
  country: string
  postalCode: string
  orderNotice?: string
  total: number
  subtotal?: number
  tax?: number
  shipping?: number
  date: string
  products: Product[]
}

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

          // Ensure products array exists
          if (!parsedData.products || parsedData.products.length === 0) {
            console.warn("No products in saved order data, attempting to reconstruct")
            // Try to reconstruct products from current state if missing
            parsedData.products = products.map((p) => ({
              id: p.id,
              name: p.name,
              price: p.price,
              amount: p.amount,
              image: p.image,
            }))
          }

          orderData.current = parsedData
        } catch (e) {
          console.error("Error parsing saved order data:", e)
        }
      } else {
        console.warn("No saved order data found in session storage")
      }

      setIsLoading(false)
      return
    }

    // If no existing order, check if payment is valid and create order
    verifyPaymentAndCreateOrder(paymentIntentId, formDataParam)
  }, [searchParams, products])

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
        return {
          success: true,
          orderId: existingOrderId,
          orderData: {
            id: existingOrderId,
            ...formData,
            products: products.map((p) => ({
              id: p.id,
              name: p.name || "Unknown Product",
              price: p.price,
              amount: p.amount,
              image: p.image,
            })),
            subtotal: useProductStore.getState().total,
            tax: useProductStore.getState().total * 0.1, // Assuming 10% tax
            shipping: 10, // Assuming $10 shipping
            total: useProductStore.getState().total * 1.1 + 10, // Subtotal + tax + shipping
            date: new Date().toLocaleDateString(),
          },
        }
      }

      calculateTotals()
      const { total } = useProductStore.getState()
      const currentProducts = useProductStore.getState().products

      // Calculate tax and shipping
      const subtotal = total
      const tax = subtotal * 0.1 // Assuming 10% tax
      const shipping = 10 // Assuming $10 shipping
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
          name: p.name || "Unknown Product", // Ensure we have a name
          price: p.price,
          amount: p.amount,
          image: p.image,
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

  // Update the handleGenerateInvoice function to properly display product names and images
  const handleGenerateInvoice = async () => {
    if (!orderData.current) {
      toast.error("Order data not available")
      return
    }

    // Add debugging for products
    console.log("Products for invoice:", orderData.current.products)
    if (!orderData.current.products || orderData.current.products.length === 0) {
      console.warn("No products found in order data")
      // Create a dummy product if none exist
      orderData.current.products = [
        {
          id: "dummy",
          name: "Order Total",
          price: orderData.current.total || 0,
          amount: 1,
          image: "",
        },
      ]
    }

    setIsGeneratingInvoice(true)

    try {
      // First try to load scripts directly if they're not already loaded
      if (!(window as any).jspdf?.jsPDF) {
        console.log("jsPDF not detected, loading directly...")
        await loadPdfLibrariesDirectly()
        // Wait a moment for scripts to initialize
        await new Promise((resolve) => setTimeout(resolve, 500))
      }

      // Check if jsPDF is available now
      if (!(window as any).jspdf?.jsPDF) {
        throw new Error("PDF libraries could not be loaded after direct attempt")
      }

      // Get the jsPDF constructor
      const jsPDF = (window as any).jspdf.jsPDF
      console.log("jsPDF constructor found:", !!jsPDF)

      // Create a new document
      const doc = new jsPDF()
      console.log("PDF document created")

      // Add header
      doc.setFontSize(20)
      doc.text("INVOICE", 105, 20, { align: "center" })

      // Add company info
      doc.setFontSize(10)
      doc.text("Your Company Name", 200, 30, { align: "right" })
      doc.text("123 Business Street", 200, 35, { align: "right" })
      doc.text("City, Country, ZIP", 200, 40, { align: "right" })

      // Add invoice info
      doc.setFontSize(12)
      doc.text(`Invoice #: ${orderData.current.id}`, 20, 50)
      doc.text(`Date: ${orderData.current.date}`, 20, 57)

      // Add customer info
      doc.text("Bill To:", 20, 70)
      doc.setFontSize(10)
      doc.text(`${orderData.current.name} ${orderData.current.lastname}`, 20, 77)
      doc.text(`Email: ${orderData.current.email}`, 20, 84)
      doc.text(`Phone: ${orderData.current.phone}`, 20, 91)
      doc.text(`Address: ${orderData.current.adress}`, 20, 98)
      if (orderData.current.apartment) {
        doc.text(`Apartment: ${orderData.current.apartment}`, 20, 105)
      }
      doc.text(
        `${orderData.current.city}, ${orderData.current.country}, ${orderData.current.postalCode}`,
        20,
        orderData.current.apartment ? 112 : 105,
      )

      // Try to use autoTable if available
      let autoTableAvailable = false
      try {
        autoTableAvailable = typeof doc.autoTable === "function"
        console.log("autoTable available:", autoTableAvailable)
      } catch (e) {
        console.warn("Error checking for autoTable:", e)
      }

      if (autoTableAvailable) {
        // Use autoTable if available
        const tableColumn = ["Product", "Quantity", "Price", "Total"]

        // Ensure products array exists and has proper names
        const products =
          orderData.current.products && orderData.current.products.length > 0
            ? orderData.current.products.map((p) => ({
                ...p,
                name: p.name || "Unknown Product", // Ensure we have a name
              }))
            : [{ name: "Order Total", amount: 1, price: orderData.current.total || 0 }]

        const tableRows = products.map((product: any) => [
          product.name, // Use the actual product name
          product.amount || 1,
          `$${(product.price || 0).toFixed(2)}`,
          `$${((product.price || 0) * (product.amount || 1)).toFixed(2)}`,
        ])

        doc.autoTable({
          head: [tableColumn],
          body: tableRows,
          startY: orderData.current.apartment ? 120 : 113,
          theme: "striped",
          headStyles: { fillColor: [66, 66, 66] },
        })

        // Get the final Y position after the table
        const finalY = (doc as any).lastAutoTable.finalY + 10

        // Add subtotal, tax, shipping and total
        const subtotal = orderData.current.subtotal || orderData.current.total || 0
        const tax = orderData.current.tax || subtotal * 0.1
        const shipping = orderData.current.shipping || 10
        const total = orderData.current.total || subtotal + tax + shipping

        doc.text(`Subtotal: $${subtotal.toFixed(2)}`, 140, finalY)
        doc.text(`Tax: $${tax.toFixed(2)}`, 140, finalY + 7)
        doc.text(`Shipping: $${shipping.toFixed(2)}`, 140, finalY + 14)
        doc.setFontSize(12)
        doc.text(`Total: $${total.toFixed(2)}`, 140, finalY + 24)
      } else {
        // Fallback to manual table rendering if autoTable is not available
        console.log("Using fallback table rendering")

        // Set starting Y position
        let yPos = orderData.current.apartment ? 120 : 113

        // Draw table header
        doc.setFillColor(66, 66, 66)
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(10)

        // Draw header background
        doc.rect(20, yPos, 160, 10, "F")

        // Draw header text
        doc.text("Product", 25, yPos + 7)
        doc.text("Quantity", 85, yPos + 7)
        doc.text("Price", 125, yPos + 7)
        doc.text("Total", 160, yPos + 7)

        yPos += 15

        // Reset text color for table body
        doc.setTextColor(0, 0, 0)

        // Ensure products array exists and has proper names
        const products =
          orderData.current.products && orderData.current.products.length > 0
            ? orderData.current.products.map((p) => ({
                ...p,
                name: p.name || "Unknown Product", // Ensure we have a name
              }))
            : [{ name: "Order Total", amount: 1, price: orderData.current.total || 0 }]

        // Draw table rows
        let isAlternate = false
        products.forEach((product: any, index: number) => {
          // Alternate row background
          if (isAlternate) {
            doc.setFillColor(240, 240, 240)
            doc.rect(20, yPos - 5, 160, 10, "F")
          }
          isAlternate = !isAlternate

          doc.text(product.name, 25, yPos) // Use the actual product name
          doc.text(product.amount?.toString() || "1", 85, yPos)
          doc.text(`$${(product.price || 0).toFixed(2)}`, 125, yPos)
          doc.text(`$${((product.price || 0) * (product.amount || 1)).toFixed(2)}`, 160, yPos)

          yPos += 10
        })

        yPos += 10

        // Add subtotal, tax, shipping and total
        const subtotal = orderData.current.subtotal || orderData.current.total || 0
        const tax = orderData.current.tax || subtotal * 0.1
        const shipping = orderData.current.shipping || 10
        const total = orderData.current.total || subtotal + tax + shipping

        doc.text(`Subtotal: $${subtotal.toFixed(2)}`, 140, yPos)
        doc.text(`Tax: $${tax.toFixed(2)}`, 140, yPos + 7)
        doc.text(`Shipping: $${shipping.toFixed(2)}`, 140, yPos + 14)
        doc.setFontSize(12)
        doc.text(`Total: $${total.toFixed(2)}`, 140, yPos + 24)
      }

      // Add footer
      doc.setFontSize(10)
      doc.text("Thank you for your business!", 105, 280, { align: "center" })

      console.log("Generating PDF blob...")
      // Save PDF and create URL
      const pdfBlob = doc.output("blob")
      const url = URL.createObjectURL(pdfBlob)
      console.log("PDF URL created:", !!url)
      setInvoiceUrl(url)

      toast.success("Invoice generated successfully")
    } catch (error) {
      console.error("Error generating invoice:", error)
      toast.error("Failed to generate invoice: " + (error instanceof Error ? error.message : "Unknown error"))

      // Try one more time with a simpler approach if the first attempt failed
      try {
        console.log("Trying alternative PDF generation approach...")
        const jsPDF = (window as any).jspdf?.jsPDF || window.jspdf?.jsPDF

        if (!jsPDF) {
          throw new Error("jsPDF not available after multiple attempts")
        }

        const doc = new jsPDF()
        doc.setFontSize(20)
        doc.text("INVOICE", 105, 20, { align: "center" })
        doc.setFontSize(12)
        doc.text(`Order #: ${orderData.current.id}`, 20, 40)
        doc.text(`Date: ${orderData.current.date}`, 20, 50)
        doc.text(`Customer: ${orderData.current.name} ${orderData.current.lastname}`, 20, 60)

        // Add product list with actual names
        let yPos = 80
        doc.setFontSize(12)
        doc.text("Products:", 20, yPos)
        yPos += 10

        doc.setFontSize(10)
        if (orderData.current.products && orderData.current.products.length > 0) {
          orderData.current.products.forEach((product, index) => {
            doc.text(
              `${product.name || "Unknown Product"} x${product.amount} - $${(product.price * product.amount).toFixed(2)}`,
              30,
              yPos,
            )
            yPos += 7
          })
        }

        yPos += 10

        // Add subtotal, tax, shipping and total
        const subtotal = orderData.current.subtotal || orderData.current.total || 0
        const tax = orderData.current.tax || subtotal * 0.1
        const shipping = orderData.current.shipping || 10
        const total = orderData.current.total || subtotal + tax + shipping

        doc.text(`Subtotal: $${subtotal.toFixed(2)}`, 20, yPos)
        doc.text(`Tax: $${tax.toFixed(2)}`, 20, yPos + 7)
        doc.text(`Shipping: $${shipping.toFixed(2)}`, 20, yPos + 14)
        doc.setFontSize(12)
        doc.text(`Total: $${total.toFixed(2)}`, 20, yPos + 24)

        const pdfBlob = doc.output("blob")
        const url = URL.createObjectURL(pdfBlob)
        setInvoiceUrl(url)

        toast.success("Simple invoice generated successfully")
      } catch (fallbackError) {
        console.error("Fallback PDF generation failed:", fallbackError)
        toast.error("Could not generate invoice. Please try again later.")
      }
    } finally {
      setIsGeneratingInvoice(false)
    }
  }

  // Fallback function to load PDF libraries directly
  const loadPdfLibrariesDirectly = () => {
    return new Promise<void>((resolve, reject) => {
      try {
        // Check if scripts are already loaded
        if ((window as any).jspdf?.jsPDF) {
          console.log("jsPDF already loaded, skipping direct load")
          resolve()
          return
        }

        console.log("Loading PDF libraries directly...")

        // Create script elements and append them to the document
        const jspdfScript = document.createElement("script")
        jspdfScript.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
        jspdfScript.integrity =
          "sha512-qZvrmS2ekKPF2mSznTQsxqPgnpkI4DNTlrdUmTzrDgektczlKNRRhy5X5AAOnx5S09ydFYWWNSfcEqDTTHgtNA=="
        jspdfScript.crossOrigin = "anonymous"
        jspdfScript.referrerPolicy = "no-referrer"

        const autoTableScript = document.createElement("script")
        autoTableScript.src =
          "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js"
        autoTableScript.integrity =
          "sha512-NHKtYm0BOY8QsEIZ9CgQPXgTvnzRs5/IzGXX6mpMxCIIJpRSFBRiLPZPCIHBZDZYbUGS3lKUkCkQZJuVIW7d0A=="
        autoTableScript.crossOrigin = "anonymous"
        autoTableScript.referrerPolicy = "no-referrer"

        // Set up load handlers with timeouts
        let jspdfLoaded = false
        let autoTableLoaded = false

        const checkBothLoaded = () => {
          if (jspdfLoaded && autoTableLoaded) {
            console.log("Both scripts loaded directly")
            resolve()
          }
        }

        // Set a timeout to resolve anyway after 3 seconds
        const timeout = setTimeout(() => {
          console.log("Script loading timed out, continuing anyway")
          resolve()
        }, 3000)

        jspdfScript.onload = () => {
          console.log("jsPDF loaded directly")
          jspdfLoaded = true
          document.head.appendChild(autoTableScript)
          checkBothLoaded()
        }

        autoTableScript.onload = () => {
          console.log("AutoTable loaded directly")
          autoTableLoaded = true
          checkBothLoaded()
        }

        jspdfScript.onerror = (e) => {
          console.error("Error loading jsPDF directly:", e)
          // Try alternative CDN
          const altScript = document.createElement("script")
          altScript.src = "https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js"
          altScript.onload = () => {
            console.log("jsPDF loaded from alternative CDN")
            jspdfLoaded = true
            document.head.appendChild(autoTableScript)
            checkBothLoaded()
          }
          altScript.onerror = () => {
            console.error("Failed to load jsPDF from alternative CDN")
            // Continue anyway, we'll use the fallback rendering
            jspdfLoaded = true
            checkBothLoaded()
          }
          document.head.appendChild(altScript)
        }

        autoTableScript.onerror = (e) => {
          console.error("Error loading AutoTable directly:", e)
          // Try alternative CDN
          const altScript = document.createElement("script")
          altScript.src = "https://unpkg.com/jspdf-autotable@3.5.28/dist/jspdf.plugin.autotable.js"
          altScript.onload = () => {
            console.log("AutoTable loaded from alternative CDN")
            autoTableLoaded = true
            checkBothLoaded()
          }
          altScript.onerror = () => {
            console.error("Failed to load AutoTable from alternative CDN")
            // Continue anyway, we'll use the fallback rendering
            autoTableLoaded = true
            checkBothLoaded()
          }
          document.head.appendChild(altScript)
        }

        document.head.appendChild(jspdfScript)
      } catch (error) {
        console.error("Error in direct script loading:", error)
        // Don't reject, try to continue anyway
        resolve()
      }
    })
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

