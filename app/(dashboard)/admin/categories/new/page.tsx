"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { convertCategoryNameToURLFriendly } from "../../../../../utils/categoryFormating"

import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export default function NewCategoryPage() {
  const [categoryInput, setCategoryInput] = useState({
    name: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const addNewCategory = async () => {
    if (categoryInput.name.length > 0) {
      setIsLoading(true)
      const requestOptions = {
        method: "post",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: convertCategoryNameToURLFriendly(categoryInput.name),
        }),
      }

      try {
        const response = await fetch(`http://localhost:3001/api/categories`, requestOptions)
        if (response.status === 201) {
          toast.success("Category added successfully")
          setCategoryInput({
            name: "",
          })
          router.push("/admin/categories")
        } else {
          throw Error("There was an error while creating category")
        }
      } catch (error) {
        toast.error("There was an error while creating category")
      } finally {
        setIsLoading(false)
      }
    } else {
      toast.error("You need to enter values to add a category")
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Add New Category" description="Create a new product category" />

      <Card>
        <CardHeader>
          <CardTitle>New Category</CardTitle>
          <CardDescription>Add a new category to organize your products</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid gap-3">
              <Label htmlFor="name">Category name</Label>
              <Input
                id="name"
                value={categoryInput.name}
                onChange={(e) => setCategoryInput({ ...categoryInput, name: e.target.value })}
                placeholder="Enter category name"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/admin/categories")}>
            Cancel
          </Button>
          <Button onClick={addNewCategory} disabled={isLoading}>
            Create Category
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

