"use client";

import { useSession , signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { BarChart3, Package, ShoppingCart, Users, Tag, Settings, Home, LogOut, Search } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import toast from "react-hot-toast";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const handleLogout = () => {
  setTimeout(() => signOut(), 1000);
  toast.success("Logout successful!");
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      toast.error("You must be logged in.");
      router.push("/");
      return;
    }

    async function checkUserRole() {
      try {
        let email: string = await session?.user?.email;
        const res = await fetch(`http://localhost:3001/api/users/email/${email}`);
        const data = await res.json();

        if (data.role !== "admin") {
          toast.error("Access denied.");
          router.push("/");
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error checking role:", error);
        toast.error("An error occurred.");
        router.push("/");
      }
    }

    checkUserRole();
  }, [session, status, router]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/10">
        <Sidebar variant="floating" collapsible="icon">
          <SidebarHeader>
            <div className="flex items-center gap-2 px-4 py-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Admin Panel</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Main</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === "/admin"} tooltip="Dashboard">
                      <a href="/admin">
                        <Home className="h-4 w-4" />
                        <span>Dashboard</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname.includes("/admin/products")} tooltip="Products">
                      <a href="/admin/products">
                        <Package className="h-4 w-4" />
                        <span>Products</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname.includes("/admin/categories")} tooltip="Categories">
                      <a href="/admin/categories">
                        <Tag className="h-4 w-4" />
                        <span>Categories</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname.includes("/admin/orders")} tooltip="Orders">
                      <a href="/admin/orders">
                        <ShoppingCart className="h-4 w-4" />
                        <span>Orders</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname.includes("/admin/users")} tooltip="Users">
                      <a href="/admin/users">
                        <Users className="h-4 w-4" />
                        <span>Users</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Settings</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Settings">
                      <a href="/admin/settings">
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Logout">
                  <a onClick={handleLogout}>
                    <LogOut className="h-4 w-4"  />
                    <span>Logout</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger />
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="w-full rounded-lg bg-background pl-8 md:w-[300px] lg:w-[400px]"
              />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              <Avatar>
                <AvatarImage src={session?.user?.image || "/placeholder.svg?height=32&width=32"} alt="@admin" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
