"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { formatCategoryName, convertCategoryNameToURLFriendly } from "../../../../../utils/categoryFormating"

import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface DashboardSingleCategoryProps {
  params: { id: number }
}

export default function DashboardSingleCategory({ params: { id } }: DashboardSingleCategoryProps) {
  const [categoryInput, setCategoryInput] = useState<{ name: string }>({
    name: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const deleteCategory = async () => {
    setIsLoading(true)
    const requestOptions = {
      method: "DELETE",
    }

    try {
      const response = await fetch(`http://localhost:3001/api/categories/${id}`, requestOptions)
      if (response.status === 204) {
        toast.success("Category deleted successfully")
        router.push("/admin/categories")
      } else {
        throw Error("There was an error deleting a category")
      }
    } catch (error) {
      toast.error("There was an error deleting category")
    } finally {
      setIsLoading(false)
    }
  }

  const updateCategory = async () => {
    if (categoryInput.name.length > 0) {
      setIsLoading(true)
      const requestOptions = {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: convertCategoryNameToURLFriendly(categoryInput.name),
        }),
      }

      try {
        const response = await fetch(`http://localhost:3001/api/categories/${id}`, requestOptions)
        if (response.status === 200) {
          toast.success("Category successfully updated")
        } else {
          throw Error("Error updating a category")
        }
      } catch (error) {
        toast.error("There was an error while updating a category")
      } finally {
        setIsLoading(false)
      }
    } else {
      toast.error("For updating a category you must enter all values")
    }
  }

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/categories/${id}`)
        const data = await res.json()
        setCategoryInput({
          name: data?.name,
        })
      } catch (error) {
        toast.error("Error fetching category")
      }
    }

    fetchCategory()
  }, [id])

  return (
    <div className="space-y-6">
      <PageHeader title="Category Details" description="View and edit category information" />

      <Card>
        <CardHeader>
          <CardTitle>Edit Category</CardTitle>
          <CardDescription>Make changes to your category here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid gap-3">
              <Label htmlFor="name">Category name</Label>
              <Input
                id="name"
                value={formatCategoryName(categoryInput.name)}
                onChange={(e) => setCategoryInput({ ...categoryInput, name: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/admin/categories")}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button variant="destructive" onClick={deleteCategory} disabled={isLoading}>
              Delete Category
            </Button>
            <Button onClick={updateCategory} disabled={isLoading}>
              Update Category
            </Button>
          </div>
        </CardFooter>
      </Card>

      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>
          If you delete this category, you will delete all products associated with the category.
        </AlertDescription>
      </Alert>
    </div>
  )
}

