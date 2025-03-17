import type { OrderData } from "@/types/order"

/**
 * Generates a PDF invoice for an order
 * @param orderData The order data to generate the invoice for
 * @returns A Promise that resolves to a URL for the generated PDF and the PDF as base64
 */
export async function generateInvoice(orderData: OrderData): Promise<{ url: string; base64: string }> {
  if (!orderData) {
    throw new Error("Order data not available")
  }

  console.log("Generating invoice for order:", orderData.id)
  console.log("Products for invoice:", orderData.products)

  // Ensure products array exists
  if (!orderData.products || orderData.products.length === 0) {
    console.warn("No products found in order data")
    // Create a dummy product if none exist
    orderData.products = [
      {
        id: "dummy",
        title: "Order Total",
        price: orderData.total || 0,
        amount: 1,
      },
    ]
  }

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
    doc.text("GadgetSouq", 200, 30, { align: "right" })
    doc.text(" B.P. 32, El Alia", 200, 35, { align: "right" })
    doc.text("Bab Ezzouar, Alger, Algérie, 16111", 200, 40, { align: "right" })

    // Add invoice info
    doc.setFontSize(12)
    doc.text(`Invoice #: ${orderData.id}`, 20, 50)
    doc.text(`Date: ${orderData.date}`, 20, 57)

    // Add customer info
    doc.text("Bill To:", 20, 70)
    doc.setFontSize(10)
    doc.text(`${orderData.name} ${orderData.lastname}`, 20, 77)
    doc.text(`Email: ${orderData.email}`, 20, 84)
    doc.text(`Phone: ${orderData.phone}`, 20, 91)
    doc.text(`Address: ${orderData.adress}`, 20, 98)
    if (orderData.apartment) {
      doc.text(`Apartment: ${orderData.apartment}`, 20, 105)
    }
    doc.text(`${orderData.city}, ${orderData.country}, ${orderData.postalCode}`, 20, orderData.apartment ? 112 : 105)

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

      // Ensure products array exists and has proper titles
      const products =
        orderData.products && orderData.products.length > 0
          ? orderData.products.map((p) => ({
              ...p,
              title: p.title, // Ensure we have a title
            }))
          : [{ title: "Order Total", amount: 1, price: orderData.total || 0 }]

      const tableRows = products.map((product: any) => [
        product.title, // Use the product title
        product.amount || 1,
        `$${(product.price || 0).toFixed(2)}`,
        `$${((product.price || 0) * (product.amount || 1)).toFixed(2)}`,
      ])

      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: orderData.apartment ? 120 : 113,
        theme: "striped",
        headStyles: { fillColor: [66, 66, 66] },
      })

      // Get the final Y position after the table
      const finalY = (doc as any).lastAutoTable.finalY + 10

      // Add subtotal, tax, shipping and total
      const subtotal = orderData.subtotal || orderData.total || 0
      const tax = orderData.tax || subtotal * 0.2
      const shipping = orderData.shipping || 5
      const total = orderData.total || subtotal + tax + shipping

      doc.text(`Subtotal: $${subtotal.toFixed(2)}`, 140, finalY)
      doc.text(`Tax: $${tax.toFixed(2)}`, 140, finalY + 7)
      doc.text(`Shipping: $${shipping.toFixed(2)}`, 140, finalY + 14)
      doc.setFontSize(12)
      doc.text(`Total: $${total.toFixed(2)}`, 140, finalY + 24)
    } else {
      // Fallback to manual table rendering if autoTable is not available
      console.log("Using fallback table rendering")

      // Set starting Y position
      let yPos = orderData.apartment ? 120 : 113

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

      // Ensure products array exists and has proper titles
      const products =
        orderData.products && orderData.products.length > 0
          ? orderData.products.map((p) => ({
              ...p,
              title: p.title, // Ensure we have a title
            }))
          : [{ title: "Order Total", amount: 1, price: orderData.total || 0 }]

      // Draw table rows
      let isAlternate = false
      products.forEach((product: any, index: number) => {
        // Alternate row background
        if (isAlternate) {
          doc.setFillColor(240, 240, 240)
          doc.rect(20, yPos - 5, 160, 10, "F")
        }
        isAlternate = !isAlternate

        doc.text(product.title, 25, yPos) // Use the product title
        doc.text(product.amount?.toString() || "1", 85, yPos)
        doc.text(`$${(product.price || 0).toFixed(2)}`, 125, yPos)
        doc.text(`$${((product.price || 0) * (product.amount || 1)).toFixed(2)}`, 160, yPos)

        yPos += 10
      })

      yPos += 10

      // Add subtotal, tax, shipping and total
      const subtotal = orderData.subtotal || orderData.total || 0
      const tax = orderData.tax || subtotal * 0.2
      const shipping = orderData.shipping || 5
      const total = orderData.total || subtotal + tax + shipping

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

    // Also get base64 for email attachment
    const base64 = doc.output("datauristring")

    console.log("PDF URL created:", !!url)

    return { url, base64 }
  } catch (error) {
    console.error("Error generating invoice:", error)

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
      doc.text(`Order #: ${orderData.id}`, 20, 40)
      doc.text(`Date: ${orderData.date}`, 20, 50)
      doc.text(`Customer: ${orderData.name} ${orderData.lastname}`, 20, 60)

      // Add product list with actual titles
      let yPos = 80
      doc.setFontSize(12)
      doc.text("Products:", 20, yPos)
      yPos += 10

      doc.setFontSize(10)
      if (orderData.products && orderData.products.length > 0) {
        orderData.products.forEach((product, index) => {
          doc.text(`${product.title} x${product.amount} - $${(product.price * product.amount).toFixed(2)}`, 30, yPos)
          yPos += 7
        })
      }

      yPos += 10

      // Add subtotal, tax, shipping and total
      const subtotal = orderData.subtotal || orderData.total || 0
      const tax = orderData.tax || subtotal * 0.2
      const shipping = orderData.shipping || 5
      const total = orderData.total || subtotal + tax + shipping

      doc.text(`Subtotal: $${subtotal.toFixed(2)}`, 20, yPos)
      doc.text(`Tax: $${tax.toFixed(2)}`, 20, yPos + 7)
      doc.text(`Shipping: $${shipping.toFixed(2)}`, 20, yPos + 14)
      doc.setFontSize(12)
      doc.text(`Total: $${total.toFixed(2)}`, 20, yPos + 24)

      const pdfBlob = doc.output("blob")
      const url = URL.createObjectURL(pdfBlob)
      const base64 = doc.output("datauristring")

      return { url, base64 }
    } catch (fallbackError) {
      console.error("Fallback PDF generation failed:", fallbackError)
      throw new Error("Could not generate invoice. Please try again later.")
    }
  }
}

/**
 * Loads the PDF libraries directly if they're not already loaded
 */
function loadPdfLibrariesDirectly(): Promise<void> {
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

