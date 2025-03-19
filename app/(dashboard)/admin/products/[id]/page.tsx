"use client"

import { PageHeader } from "@/components/page-header"
import { ProductForm } from "@/components/product-form"

interface ProductDetailPageProps {
  params: { id: string }
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader title="Product Details" description="View and edit product information" />

      <ProductForm productId={params.id} isEdit={true} />
    </div>
  )
}

