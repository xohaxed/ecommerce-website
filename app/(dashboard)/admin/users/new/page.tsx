"use client"

import { PageHeader } from "@/components/page-header"
import { UserForm } from "@/components/user-form"

export default function NewUserPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Add New User" description="Create a new user account" />

      <UserForm />
    </div>
  )
}

