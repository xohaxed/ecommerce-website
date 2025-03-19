"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { formatCategoryName } from "../../../../utils/categoryFormating"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Plus } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

interface Category {
  id: string
  name: string
}

const columns: ColumnDef<Category>[] = [
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
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div>{formatCategoryName(row.getValue("name"))}</div>,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const category = row.original

      return (
        <div className="text-right">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/categories/${category.id}`}>Details</Link>
          </Button>
        </div>
      )
    },
  },
]

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/categories")
        const data = await res.json()
        setCategories(data)
      } catch (error) {
        console.error("Failed to fetch categories:", error)
      }
    }

    fetchCategories()
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Manage your product categories"
        actions={
          <Button asChild>
            <Link href="/admin/categories/new">
              <Plus className="mr-2 h-4 w-4" />
              Add New Category
            </Link>
          </Button>
        }
      />

      <DataTable columns={columns} data={categories} searchKey="name" searchPlaceholder="Filter categories..." />
    </div>
  )
}

