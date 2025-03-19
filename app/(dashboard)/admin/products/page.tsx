"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Plus } from "lucide-react"
import Image from "next/image"

import { PageHeader } from "@/components/page-header"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

interface Product {
  id: string
  title: string
  price: number
  mainImage: string
  inStock: number
  manufacturer: string
  slug: string
}

const columns: ColumnDef<Product>[] = [
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
    accessorKey: "mainImage",
    header: "Image",
    cell: ({ row }) => {
      const image = row.getValue("mainImage") as string
      return (
        <div className="flex h-12 w-12 items-center justify-center">
          <Image
            src={image ? `/${image}` : "/placeholder.svg?height=48&width=48"}
            alt={row.getValue("title")}
            width={48}
            height={48}
            className="rounded-md object-cover"
          />
        </div>
      )
    },
  },
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Product
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "price",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Price
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const price = Number.parseFloat(row.getValue("price"))
      return <div>${price.toFixed(2)}</div>
    },
  },
  {
    accessorKey: "manufacturer",
    header: "Manufacturer",
  },
  {
    accessorKey: "inStock",
    header: "Stock",
    cell: ({ row }) => {
      const inStock = row.getValue("inStock") as number
      return <Badge variant={inStock ? "default" : "destructive"}>{inStock ? "In Stock" : "Out of Stock"}</Badge>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const product = row.original

      return (
        <div className="text-right">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/products/${product.id}`}>Details</Link>
          </Button>
        </div>
      )
    },
  },
]

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/products")
        const data = await res.json()
        setProducts(data)
      } catch (error) {
        console.error("Failed to fetch products:", error)
      }
    }

    fetchProducts()
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage your store products"
        actions={
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus className="mr-2 h-4 w-4" />
              Add New Product
            </Link>
          </Button>
        }
      />

      <DataTable columns={columns} data={products} searchKey="title" searchPlaceholder="Search products..." />
    </div>
  )
}

