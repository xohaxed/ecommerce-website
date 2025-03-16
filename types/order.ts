export interface Product {
  id: string
  slug?: string
  title: string
  mainImage?: string
  price: number
  amount: number
  rating?: number
  description?: string
  manufacturer?: string
  inStock?: boolean
  categoryId?: string
}

export interface OrderData {
  id: string
  name: string
  lastname: string
  email: string
  phone: string
  company: string
  adress: string
  apartment?: string
  city: string
  country: string
  postalCode: string
  orderNotice?: string
  total: number
  subtotal?: number
  tax?: number
  shipping?: number
  date: string
  products: Product[]
}

