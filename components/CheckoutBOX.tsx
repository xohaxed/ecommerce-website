"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js"
import toast from "react-hot-toast"
import { useProductStore } from "../app/_zustand/store"
import { isValidEmailAddressFormat, isValidNameOrLastname } from "@/lib/utils"
import convertToSubcurrency from "@/lib/utils"

const CheckoutBox = ({ amount }: { amount: number }) => {
  const router = useRouter()
  const { products, total, clearCart, calculateTotals } = useProductStore()
  const stripe = useStripe()
  const elements = useElements()

  const [errorMessage, setErrorMessage] = useState<string>("")
  const [clientSecret, setClientSecret] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [checkoutForm, setCheckoutForm] = useState({
    name: "",
    lastname: "",
    phone: "",
    email: "",
    company: "",
    adress: "",
    apartment: "",
    city: "",
    country: "",
    postalCode: "",
    orderNotice: "",
  })

  // Calculate totals whenever products change
  useEffect(() => {
    calculateTotals()
  }, [products, calculateTotals])

  useEffect(() => {
    fetch("/api/payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount: convertToSubcurrency(amount) }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret)
        } else {
          console.error("clientSecret not received:", data)
        }
      })
      .catch((err) => console.error("Error fetching clientSecret:", err))
  }, [amount])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setCheckoutForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const validateForm = () => {
    // Check if all required fields are filled
    const requiredFields = ["name", "lastname", "phone", "email", "company", "adress", "city", "country", "postalCode"]

    for (const field of requiredFields) {
      if (!checkoutForm[field as keyof typeof checkoutForm]) {
        toast.error(`Please fill in the ${field.replace(/([A-Z])/g, " $1").toLowerCase()} field`)
        return false
      }
    }

    if (!isValidNameOrLastname(checkoutForm.name)) {
      toast.error("You entered invalid format for name")
      return false
    }

    if (!isValidNameOrLastname(checkoutForm.lastname)) {
      toast.error("You entered invalid format for lastname")
      return false
    }

    if (!isValidEmailAddressFormat(checkoutForm.email)) {
      toast.error("You entered invalid format for email address")
      return false
    }

    return true
  }

  const addOrderProduct = async (orderId: string, productId: string, productQuantity: number) => {
    // Using relative URL instead of hardcoded localhost
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

  const createOrder = async () => {
    try {
      // Calculate totals one more time to ensure we have the latest value
      calculateTotals()

      // Using relative URL instead of hardcoded localhost
      const response = await fetch("http://localhost:3001/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: checkoutForm.name,
          lastname: checkoutForm.lastname,
          phone: checkoutForm.phone,
          email: checkoutForm.email,
          company: checkoutForm.company,
          adress: checkoutForm.adress,
          apartment: checkoutForm.apartment,
          postalCode: checkoutForm.postalCode,
          status: "processing",
          total: total,
          city: checkoutForm.city,
          country: checkoutForm.country,
          orderNotice: checkoutForm.orderNotice,
        }),
      })

      const data = await response.json()
      const orderId: string = data.id

      // Add each product to the order
      for (let i = 0; i < products.length; i++) {
        await addOrderProduct(orderId, products[i].id, products[i].amount)
      }

      // Reset form and cart
      setCheckoutForm({
        name: "",
        lastname: "",
        phone: "",
        email: "",
        company: "",
        adress: "",
        apartment: "",
        city: "",
        country: "",
        postalCode: "",
        orderNotice: "",
      })

      clearCart()
      toast.success("Order created successfully")

      setTimeout(() => {
        router.push("/")
      }, 1000)

      return true
    } catch (error) {
      console.error("Error creating order:", error)
      toast.error("Failed to create order")
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      toast.error("Stripe is not initialized")
      return
    }

    if (!validateForm()) {
      return
    }

    setLoading(true)

   

    
    const { error: submitError } = await elements.submit()

    if (submitError) {
      setErrorMessage(submitError.message || "Something went wrong")
      setLoading(false)
      return
    }
     // First create the order
     const orderCreated = await createOrder()
     if (!orderCreated) {
       setLoading(false)
       return
     }
     // Then process the payment
    const { error } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success?amount=${amount}/`,
      },
    })

    if (error) {
      setErrorMessage(error.message || "Something went wrong")
      toast.error(error.message || "Payment failed")
    }

    setLoading(false)
  }

  if (!clientSecret || !stripe || !elements) {
    return (
      <div className="flex items-center justify-center">
        <div
          className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-white"
          role="status"
        >
          <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
            Loading...
          </span>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-md space-y-4">
      <div className="absolute left-10 top-12 p-6 bg-white rounded-2xl shadow-lg max-w-3xl">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Shipping Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={checkoutForm.name}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="lastname" className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
            <input
              type="text"
              id="lastname"
              name="lastname"
              value={checkoutForm.lastname}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={checkoutForm.email}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={checkoutForm.phone}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>
        </div>

        <div className="mt-6">
          <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">Company *</label>
          <input
            type="text"
            id="company"
            name="company"
            value={checkoutForm.company}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
        </div>

        <div className="mt-6">
          <label htmlFor="adress" className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
          <input
            type="text"
            id="adress"
            name="adress"
            value={checkoutForm.adress}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
        </div>

        <div className="mt-6">
          <label htmlFor="apartment" className="block text-sm font-medium text-gray-700 mb-2">Apartment, suite, etc. (optional)</label>
          <input
            type="text"
            id="apartment"
            name="apartment"
            value={checkoutForm.apartment}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">City *</label>
            <input
              type="text"
              id="city"
              name="city"
              value={checkoutForm.city}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
            <input
              type="text"
              id="country"
              name="country"
              value={checkoutForm.country}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">Postal Code *</label>
            <input
              type="text"
              id="postalCode"
              name="postalCode"
              value={checkoutForm.postalCode}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>
        </div>

        <div className="mt-6">
          <label htmlFor="orderNotice" className="block text-sm font-medium text-gray-700 mb-2">Order Notes (optional)</label>
          <textarea
            id="orderNotice"
            name="orderNotice"
            value={checkoutForm.orderNotice}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            rows={3}
          />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-2">Payment Information</h2>
        {clientSecret && <PaymentElement />}
        {errorMessage && <p className="text-red-500 mt-2">{errorMessage}</p>}
      </div>

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full p-4 bg-black text-white font-bold rounded-md mt-4 disabled:opacity-50 disabled:animate-pulse"
      >
        {loading ? "Processing..." : `Pay $${amount.toFixed(2)}`}
      </button>
    </form>
  )
}

export default CheckoutBox

