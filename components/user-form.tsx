"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { isValidEmailAddressFormat } from "@/lib/utils"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface UserFormProps {
  userId?: string
  isEdit?: boolean
}

export function UserForm({ userId, isEdit = false }: UserFormProps) {
  const [userInput, setUserInput] = useState({
    email: "",
    password: "",
    newPassword: "",
    role: "user",
  })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleInputChange = (field: string, value: string) => {
    setUserInput((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const validateForm = () => {
    if (!userInput.email || (isEdit ? !userInput.newPassword : !userInput.password)) {
      toast.error("Please fill all required fields")
      return false
    }

    if (!isValidEmailAddressFormat(userInput.email)) {
      toast.error("You entered invalid email address format")
      return false
    }

    const passwordToCheck = isEdit ? userInput.newPassword : userInput.password
    if (passwordToCheck.length < 8) {
      toast.error("Password must be at least 8 characters long")
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    const url = isEdit ? `http://localhost:3001/api/users/${userId}` : "http://localhost:3001/api/users"

    const method = isEdit ? "PUT" : "POST"

    const payload = isEdit
      ? {
          email: userInput.email,
          password: userInput.newPassword,
          role: userInput.role,
        }
      : {
          email: userInput.email,
          password: userInput.password,
          role: userInput.role,
        }

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast.success(isEdit ? "User updated successfully" : "User added successfully")
        if (!isEdit) {
          setUserInput({
            email: "",
            password: "",
            newPassword: "",
            role: "user",
          })
        }
        router.push("/admin/users")
      } else {
        throw new Error(isEdit ? "Error updating user" : "Error creating user")
      }
    } catch (error) {
      toast.error(isEdit ? "Error updating user" : "Error creating user")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!isEdit || !userId) return

    setIsLoading(true)
    try {
      const response = await fetch(`http://localhost:3001/api/users/${userId}`, {
        method: "DELETE",
      })

      if (response.status === 204) {
        toast.success("User deleted successfully")
        router.push("/admin/users")
      } else {
        throw new Error("Error deleting user")
      }
    } catch (error) {
      toast.error("Error deleting user")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const fetchUser = async () => {
      if (isEdit && userId) {
        try {
          const res = await fetch(`http://localhost:3001/api/users/${userId}`)
          const data = await res.json()
          setUserInput({
            email: data.email,
            password: "",
            newPassword: "",
            role: data.role,
          })
        } catch (error) {
          console.error("Error fetching user:", error)
        }
      }
    }

    if (isEdit) {
      fetchUser()
    }
  }, [isEdit, userId])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "Edit User" : "Add New User"}</CardTitle>
        <CardDescription>{isEdit ? "Update user information" : "Create a new user account"}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={userInput.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            placeholder="user@example.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">{isEdit ? "New Password" : "Password"}</Label>
          <Input
            id="password"
            type="password"
            value={isEdit ? userInput.newPassword : userInput.password}
            onChange={(e) => handleInputChange(isEdit ? "newPassword" : "password", e.target.value)}
            placeholder="••••••••"
          />
          <p className="text-sm text-muted-foreground">Password must be at least 8 characters long</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">User Role</Label>
          <Select value={userInput.role} onValueChange={(value) => handleInputChange("role", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => router.push("/admin/users")}>
          Cancel
        </Button>
        <div className="flex gap-2">
          {isEdit && (
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              Delete User
            </Button>
          )}
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isEdit ? "Update User" : "Create User"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

