"use client"

import { PageHeader } from "@/components/page-header"
import { UserForm } from "@/components/user-form"

interface UserDetailPageProps {
  params: { id: string }
}

export default function UserDetailPage({ params }: UserDetailPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader title="User Details" description="View and edit user information" />

      <UserForm userId={params.id} isEdit={true} />
    </div>
  )
}

