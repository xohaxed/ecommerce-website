"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import toast from "react-hot-toast"
import { formatCategoryName } from "../utils/categoryFormating"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Category {
  id: string
  name: string
}

interface ProductFormProps {
  productId?: string
  isEdit?: boolean
}

export function ProductForm({ productId, isEdit = false }: ProductFormProps) {
  const [product, setProduct] = useState<any>({
    title: "",
    price: 0,
    manufacturer: "",
    inStock: 1,
    mainImage: "",
    description: "",
    slug: "",
    categoryId: "",
  })
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [otherImages, setOtherImages] = useState<any[]>([])
  const router = useRouter()

  const handleInputChange = (field: string, value: any) => {
    setProduct((prev: any) => ({
      ...prev,
      [field]: value,
    }))
  }

  const uploadFile = async (file: File) => {
    setIsLoading(true)
    const formData = new FormData()
    formData.append("uploadedFile", file)

    try {
      const response = await fetch("http://localhost:3001/api/main-image", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        handleInputChange("mainImage", file.name)
        toast.success("Image uploaded successfully")
      } else {
        toast.error("File upload unsuccessful")
      }
    } catch (error) {
      console.error("Error during file upload:", error)
      toast.error("There was an error during request sending")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!product.title || !product.manufacturer || !product.description || !product.slug) {
      toast.error("Please fill all required fields")
      return
    }

    setIsLoading(true)
    const url = isEdit ? `http://localhost:3001/api/products/${productId}` : "http://localhost:3001/api/products"

    const method = isEdit ? "PUT" : "POST"

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      })

      if (response.ok) {
        toast.success(isEdit ? "Product updated successfully" : "Product added successfully")
        if (!isEdit) {
          setProduct({
            title: "",
            price: 0,
            manufacturer: "",
            inStock: 1,
            mainImage: "",
            description: "",
            slug: "",
            categoryId: categories[0]?.id || "",
          })
        }
        router.push("/admin/products")
      } else {
        throw new Error(isEdit ? "Error updating product" : "Error creating product")
      }
    } catch (error) {
      toast.error(isEdit ? "Error updating product" : "Error creating product")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!isEdit || !productId) return

    setIsLoading(true)
    try {
      const response = await fetch(`http://localhost:3001/api/products/${productId}`, {
        method: "DELETE",
      })

      if (response.status === 204) {
        toast.success("Product deleted successfully")
        router.push("/admin/products")
      } else if (response.status === 400) {
        toast.error("Cannot delete the product because of foreign key constraint")
      } else {
        throw new Error("Error deleting product")
      }
    } catch (error) {
      toast.error("Error deleting product")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/categories")
        const data = await res.json()
        setCategories(data)

        if (!isEdit) {
          setProduct((prev) => ({
            ...prev,
            categoryId: data[0]?.id || "",
          }))
        }
      } catch (error) {
        console.error("Error fetching categories:", error)
      }
    }

    const fetchProduct = async () => {
      if (isEdit && productId) {
        try {
          const res = await fetch(`http://localhost:3001/api/products/${productId}`)
          const data = await res.json()
          setProduct(data)

          const imagesRes = await fetch(`http://localhost:3001/api/images/${productId}`)
          const imagesData = await imagesRes.json()
          setOtherImages(imagesData)
        } catch (error) {
          console.error("Error fetching product:", error)
        }
      }
    }

    fetchCategories()
    if (isEdit) {
      fetchProduct()
    }
  }, [isEdit, productId])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "Edit Product" : "Add New Product"}</CardTitle>
        <CardDescription>
          {isEdit ? "Update product information" : "Create a new product for your store"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title">Product Name</Label>
            <Input
              id="title"
              value={product.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Enter product name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Product Slug</Label>
            <Input
              id="slug"
              value={product.slug}
              onChange={(e) => handleInputChange("slug", e.target.value)}
              placeholder="product-url-slug"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              value={product.price}
              onChange={(e) => handleInputChange("price", Number(e.target.value))}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="manufacturer">Manufacturer</Label>
            <Input
              id="manufacturer"
              value={product.manufacturer}
              onChange={(e) => handleInputChange("manufacturer", e.target.value)}
              placeholder="Enter manufacturer"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={product.categoryId} onValueChange={(value) => handleInputChange("categoryId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {formatCategoryName(category.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="inStock">Stock Status</Label>
            <Select
              value={product.inStock.toString()}
              onValueChange={(value) => handleInputChange("inStock", Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select stock status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">In Stock</SelectItem>
                <SelectItem value="0">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={product.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            placeholder="Enter product description"
            rows={5}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mainImage">Main Image</Label>
          <Input
            id="mainImage"
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                uploadFile(file)
              }
            }}
          />
          {product.mainImage && (
            <div className="mt-2">
              <Image
                src={`/${product.mainImage}`}
                alt={product.title || "Product image"}
                width={100}
                height={100}
                className="rounded-md object-cover"
              />
            </div>
          )}
        </div>

        {isEdit && otherImages.length > 0 && (
          <div className="space-y-2">
            <Label>Other Images</Label>
            <div className="flex flex-wrap gap-2">
              {otherImages.map((image, index) => (
                <Image
                  key={index}
                  src={`/${image.image}`}
                  alt={`Product image ${index + 1}`}
                  width={100}
                  height={100}
                  className="rounded-md object-cover"
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => router.push("/admin/products")}>
          Cancel
        </Button>
        <div className="flex gap-2">
          {isEdit && (
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              Delete Product
            </Button>
          )}
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isEdit ? "Update Product" : "Create Product"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

