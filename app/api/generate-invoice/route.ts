import { type NextRequest, NextResponse } from "next/server"
import PDFDocument from "pdfkit"

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json()
    console.log("Generating invoice for order:", orderData.id)

    // Create a buffer to store PDF data
    const buffers: Buffer[] = []

    // Create a new PDF document
    const doc = new PDFDocument({ margin: 50 })

    // Pipe the PDF into a buffer
    doc.on("data", (chunk) => buffers.push(Buffer.from(chunk)))

    // Handle errors
    doc.on("error", (err) => {
      console.error("PDF generation error:", err)
      throw new Error("PDF generation failed")
    })

    // Add content to the PDF
    doc.fontSize(25).text("Invoice", { align: "center" })
    doc.moveDown()

    // Add company logo/header
    doc.fontSize(10).text("Your Company Name", { align: "right" })
    doc.text("123 Business Street", { align: "right" })
    doc.text("City, Country, ZIP", { align: "right" })
    doc.moveDown()

    // Add a horizontal line
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()
    doc.moveDown()

    // Add order information
    doc.fontSize(15).text(`Invoice #: ${orderData.id}`)
    doc.fontSize(10).text(`Date: ${new Date().toLocaleDateString()}`)
    doc.moveDown()

    // Add customer information
    doc.fontSize(15).text("Bill To:")
    doc.fontSize(10).text(`${orderData.name} ${orderData.lastname}`)
    doc.text(`Email: ${orderData.email}`)
    doc.text(`Phone: ${orderData.phone}`)
    doc.text(`Address: ${orderData.adress}`)
    if (orderData.apartment) doc.text(`Apartment: ${orderData.apartment}`)
    doc.text(`${orderData.city}, ${orderData.country}, ${orderData.postalCode}`)
    doc.moveDown()

    // Add order details table header
    doc.fontSize(12).text("Order Details:", { underline: true })
    doc.moveDown(0.5)

    // Create a table for products
    const tableTop = doc.y
    const itemX = 50
    const quantityX = 300
    const priceX = 400
    const amountX = 500

    doc
      .fontSize(10)
      .text("Item", itemX, tableTop)
      .text("Quantity", quantityX, tableTop)
      .text("Price", priceX, tableTop)
      .text("Amount", amountX, tableTop)

    // Draw a line below the header
    doc
      .moveTo(50, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .stroke()

    // Add product rows
    let tableRow = tableTop + 25
    let totalAmount = 0

    orderData.products.forEach((product: any, i: number) => {
      const amount = product.price * product.amount
      totalAmount += amount

      doc.text(product.name || `Product ${i + 1}`, itemX, tableRow)
      doc.text(product.amount.toString(), quantityX, tableRow)
      doc.text(`$${product.price.toFixed(2)}`, priceX, tableRow)
      doc.text(`$${amount.toFixed(2)}`, amountX, tableRow)

      tableRow += 20
    })

    // Draw a line below the products
    doc.moveTo(50, tableRow).lineTo(550, tableRow).stroke()

    // Add total
    doc.fontSize(12).text(`Total: $${orderData.total.toFixed(2)}`, amountX - 50, tableRow + 15)

    // Add footer
    doc.fontSize(10).text("Thank you for your business!", 50, doc.page.height - 100, {
      align: "center",
    })

    // Finalize the PDF
    doc.end()

    // Return a Promise that resolves when the PDF is fully generated
    return new Promise<NextResponse>((resolve, reject) => {
      doc.on("end", () => {
        try {
          const pdfBuffer = Buffer.concat(buffers)
          console.log(`PDF generated successfully, size: ${pdfBuffer.length} bytes`)

          resolve(
            new NextResponse(pdfBuffer, {
              status: 200,
              headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename=invoice-${orderData.id}.pdf`,
              },
            }),
          )
        } catch (error) {
          console.error("Error finalizing PDF:", error)
          reject(error)
        }
      })
    })
  } catch (error) {
    console.error("Invoice generation error:", error)
    return NextResponse.json({ error: "Failed to generate invoice" }, { status: 500 })
  }
}

