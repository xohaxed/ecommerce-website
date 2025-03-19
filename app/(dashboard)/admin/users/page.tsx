"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Plus } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface User {
  id: string
  email: string
  role: string
}

const columns: ColumnDef<User>[] = [
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
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const email = row.getValue("email") as string
      const initials = email.substring(0, 2).toUpperCase()

      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span>{email}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.getValue("role") as string
      return <Badge variant={role === "admin" ? "default" : "secondary"}>{role}</Badge>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original

      return (
        <div className="text-right">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/users/${user.id}`}>Details</Link>
          </Button>
        </div>
      )
    },
  },
]

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/users")
        const data = await res.json()
        setUsers(data)
      } catch (error) {
        console.error("Failed to fetch users:", error)
      }
    }

    fetchUsers()
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage user accounts and permissions"
        actions={
          <Button asChild>
            <Link href="/admin/users/new">
              <Plus className="mr-2 h-4 w-4" />
              Add New User
            </Link>
          </Button>
        }
      />

      <DataTable columns={columns} data={users} searchKey="email" searchPlaceholder="Search users..." />
    </div>
  )
}

