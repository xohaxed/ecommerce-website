"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

interface Order {
  id: string
  name: string
  lastname: string
  email: string
  dateTime: string
  status: "processing" | "delivered" | "canceled"
  total: number
}

const columns: ColumnDef<Order>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: "Order ID",
    cell: ({ row }) => {
      return <div className="font-medium">{row.getValue("id").substring(0, 8)}...</div>
    },
  },
  {
    accessorKey: "name",
    header: "Customer",
    cell: ({ row }) => {
      const firstName = row.getValue("name") as string
      const lastName = row.original.lastname
      return (
        <div>
          {firstName} {lastName}
        </div>
      )
    },
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "dateTime",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("dateTime"))
      return <div>{date.toLocaleDateString()}</div>
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string

      return (
        <Badge variant={status === "delivered" ? "default" : status === "processing" ? "secondary" : "destructive"}>
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "total",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Total
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const amount = Number.parseFloat(row.getValue("total"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount)

      return <div className="font-medium">{formatted}</div>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const order = row.original

      return (
        <div className="text-right">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/orders/${order.id}`}>Details</Link>
          </Button>
        </div>
      )
    },
  },
]

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/orders")
        const data = await res.json()
        setOrders(data)
      } catch (error) {
        console.error("Failed to fetch orders:", error)
      }
    }

    fetchOrders()
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" description="Manage customer orders" />

      <DataTable columns={columns} data={orders} searchKey="id" searchPlaceholder="Search by order ID..." />
    </div>
  )
}

