import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request: NextRequest) {
  try {
    const { email, name, lastname, orderId, pdfBase64 } = await request.json()

    if (!email || !pdfBase64 || !orderId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log(`Sending invoice email to ${email} for order ${orderId}`)

    // Create a test account if no credentials are provided
    let testAccount = null
    let transporter = null

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log("No email credentials provided, creating test account...")
      testAccount = await nodemailer.createTestAccount()

      console.log("Test account created:", {
        user: testAccount.user,
        pass: testAccount.pass,
        smtp: testAccount.smtp,
      })

      transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
        debug: true, // Enable debug output
      })
    } else {
      // Get port as a number
      const port = Number.parseInt(process.env.EMAIL_PORT || "587")

      // Determine secure setting based on port if not explicitly set
      // Port 465 typically uses secure=true, while 587 and 25 use secure=false
      let secure = process.env.EMAIL_SECURE === "true"

      // If EMAIL_SECURE isn't explicitly set, use the appropriate default for the port
      if (process.env.EMAIL_SECURE === undefined) {
        secure = port === 465
      }

      console.log(`Email configuration: host=${process.env.EMAIL_HOST}, port=${port}, secure=${secure}`)

      // Create a transporter with the provided credentials
      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || "smtp.gmail.com",
        port: port,
        secure: secure,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
        // Add TLS options to handle various server configurations
        tls: {
          // Do not fail on invalid certificates
          rejectUnauthorized: false,
          // Use modern TLS versions
          minVersion: "TLSv1.2",
        },
        debug: true, // Enable debug output
      })
    }

    // Verify the connection configuration
    console.log("Verifying email transport connection...")
    await transporter.verify()
    console.log("Email transport connection verified successfully")

    // Convert base64 to buffer for attachment
    // Handle both formats: with or without the data:application/pdf;base64, prefix
    let pdfBuffer
    if (pdfBase64.startsWith("data:")) {
      // Extract the base64 part after the comma if it's a data URI
      const base64Data = pdfBase64.split(",")[1]
      pdfBuffer = Buffer.from(base64Data, "base64")
    } else if (pdfBase64.startsWith("JVBERi")) {
      // If it starts with the PDF file signature in base64 (JVBERi is %PDF in base64)
      pdfBuffer = Buffer.from(pdfBase64, "base64")
    } else {
      // Try to decode as is
      try {
        pdfBuffer = Buffer.from(pdfBase64, "base64")
      } catch (error) {
        console.error("Error decoding base64 PDF:", error)
        throw new Error("Invalid PDF data format")
      }
    }

    // Verify the PDF buffer starts with the PDF signature
    if (!pdfBuffer.toString("ascii", 0, 4).includes("%PDF")) {
      console.warn("Warning: Generated buffer doesn't appear to be a valid PDF")
      console.log("Buffer starts with:", pdfBuffer.toString("ascii", 0, 20))
    }

    // Update the email attachment configuration
    const attachments = [
      {
        filename: `invoice-${orderId}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
        encoding: "base64", // Explicitly set encoding
      },
    ]

    // Send email with the PDF invoice
    const info = await transporter.sendMail({
      from: `"GadgetSouq Support" <${process.env.EMAIL_USER || testAccount?.user}>`,
      to: email,
      subject: `Your Invoice #${orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Thank you for your purchase, ${name} ${lastname}!</h2>
          <p>Your order #${orderId} has been processed successfully.</p>
          <p>Please find your invoice attached to this email.</p>
          <p>If you have any questions about your order, please contact our customer support.</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #777; font-size: 12px;">
            <p>This is an automated email, please do not reply directly to this message.</p>
          </div>
        </div>
      `,
      attachments: attachments,
    })

    console.log("Email sent successfully:", info)

    // If using ethereal test account, provide the preview URL
    let previewUrl = null
    if (testAccount) {
      previewUrl = nodemailer.getTestMessageUrl(info)
      console.log("Preview URL:", previewUrl)
    }

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      previewUrl,
    })
  } catch (error) {
    console.error("Error sending invoice email:", error)

    // Provide more detailed error information
    let errorMessage = "Failed to send invoice email"
    let errorDetails = null

    if (error instanceof Error) {
      errorMessage = error.message
      errorDetails = error.stack
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
        config: {
          host: process.env.EMAIL_HOST || "smtp.gmail.com",
          port: Number.parseInt(process.env.EMAIL_PORT || "587"),
          secure: process.env.EMAIL_SECURE === "true",
          // Don't log the actual credentials
          auth: {
            user: process.env.EMAIL_USER ? "Set" : "Not set",
            pass: process.env.EMAIL_PASSWORD ? "Set" : "Not set",
          },
        },
      },
      { status: 500 },
    )
  }
}

