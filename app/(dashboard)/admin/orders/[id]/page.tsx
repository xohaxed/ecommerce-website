"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import toast from "react-hot-toast"
import { isValidEmailAddressFormat, isValidNameOrLastname } from "@/lib/utils"

import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

interface OrderProduct {
  id: string
  customerOrderId: string
  productId: string
  quantity: number
  product: {
    id: string
    slug: string
    title: string
    mainImage: string
    price: number
    rating: number
    description: string
    manufacturer: string
    inStock: number
    categoryId: string
  }
}

interface Order {
  id: string
  adress: string
  apartment: string
  company: string
  dateTime: string
  email: string
  lastname: string
  name: string
  phone: string
  postalCode: string
  city: string
  country: string
  orderNotice: string
  status: "processing" | "delivered" | "canceled"
  total: number
}

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<Order | null>(null)
  const [orderProducts, setOrderProducts] = useState<OrderProduct[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleInputChange = (field: string, value: string) => {
    if (!order) return

    setOrder({
      ...order,
      [field]: value,
    })
  }

  const validateForm = () => {
    if (!order) return false

    if (
      !order.name ||
      !order.lastname ||
      !order.phone ||
      !order.email ||
      !order.company ||
      !order.adress ||
      !order.apartment ||
      !order.city ||
      !order.country ||
      !order.postalCode
    ) {
      toast.error("Please fill all fields")
      return false
    }

    if (!isValidNameOrLastname(order.name)) {
      toast.error("You entered invalid name format")
      return false
    }

    if (!isValidNameOrLastname(order.lastname)) {
      toast.error("You entered invalid lastname format")
      return false
    }

    if (!isValidEmailAddressFormat(order.email)) {
      toast.error("You entered invalid email format")
      return false
    }

    return true
  }

  const updateOrder = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    try {
      const response = await fetch(`http://localhost:3001/api/orders/${order?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(order),
      })

      if (response.status === 200) {
        toast.success("Order updated successfully")
      } else {
        throw new Error("Error updating order")
      }
    } catch (error) {
      toast.error("Error updating order")
    } finally {
      setIsLoading(false)
    }
  }

  const deleteOrder = async () => {
    if (!order) return

    setIsLoading(true)
    try {
      await fetch(`http://localhost:3001/api/order-product/${order.id}`, {
        method: "DELETE",
      })

      const response = await fetch(`http://localhost:3001/api/orders/${order.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Order deleted successfully")
        router.push("/admin/orders")
      } else {
        throw new Error("Error deleting order")
      }
    } catch (error) {
      toast.error("Error deleting order")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/orders/${params.id}`)
        const data = await response.json()
        setOrder(data)
      } catch (error) {
        console.error("Error fetching order:", error)
      }
    }

    const fetchOrderProducts = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/order-product/${params.id}`)
        const data = await response.json()
        setOrderProducts(data)
      } catch (error) {
        console.error("Error fetching order products:", error)
      }
    }

    fetchOrderData()
    fetchOrderProducts()
  }, [params.id])

  if (!order) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Order Details" description="View and manage order information" />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
            <CardDescription>Order ID: {order.id}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">First Name</Label>
                <Input id="name" value={order.name} onChange={(e) => handleInputChange("name", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastname">Last Name</Label>
                <Input
                  id="lastname"
                  value={order.lastname}
                  onChange={(e) => handleInputChange("lastname", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={order.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={order.phone} onChange={(e) => handleInputChange("phone", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company (optional)</Label>
              <Input
                id="company"
                value={order.company}
                onChange={(e) => handleInputChange("company", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Order Status</Label>
              <Select
                value={order.status}
                onValueChange={(value: "processing" | "delivered" | "canceled") => handleInputChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orderNotice">Order Notice</Label>
              <Textarea
                id="orderNotice"
                value={order.orderNotice || ""}
                onChange={(e) => handleInputChange("orderNotice", e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shipping Address</CardTitle>
            <CardDescription>Delivery information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="adress">Address</Label>
              <Input id="adress" value={order.adress} onChange={(e) => handleInputChange("adress", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apartment">Apartment, suite, etc.</Label>
              <Input
                id="apartment"
                value={order.apartment}
                onChange={(e) => handleInputChange("apartment", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" value={order.city} onChange={(e) => handleInputChange("city", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  value={order.postalCode}
                  onChange={(e) => handleInputChange("postalCode", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={order.country}
                onChange={(e) => handleInputChange("country", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
          <CardDescription>Products in this order</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orderProducts.map((item) => (
              <div key={item.id} className="flex items-center gap-4 py-2">
                <div className="h-16 w-16 overflow-hidden rounded-md">
                  <Image
                    src={item.product.mainImage ? `/${item.product.mainImage}` : "/placeholder.svg?height=64&width=64"}
                    alt={item.product.title}
                    width={64}
                    height={64}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <Link href={`/product/${item.product.slug}`} className="font-medium hover:underline">
                    {item.product.title}
                  </Link>
                  <div className="text-sm text-muted-foreground">Quantity: {item.quantity}</div>
                </div>
                <div className="text-right font-medium">${(item.product.price * item.quantity).toFixed(2)}</div>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (20%)</span>
              <span>${(order.total / 5).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>$5.00</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>${(order.total + order.total / 5 + 5).toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/admin/orders")}>
            Back to Orders
          </Button>
          <div className="flex gap-2">
            <Button variant="destructive" onClick={deleteOrder} disabled={isLoading}>
              Delete Order
            </Button>
            <Button onClick={updateOrder} disabled={isLoading}>
              Update Order
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

