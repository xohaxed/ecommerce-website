"use client"

import { PageHeader } from "@/components/page-header"
import { ProductForm } from "@/components/product-form"

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Add New Product" description="Create a new product for your store" />

      <ProductForm />
    </div>
  )
}

