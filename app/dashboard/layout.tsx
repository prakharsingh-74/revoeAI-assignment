"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { checkAuth } from "@/lib/auth-utils"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  useEffect(() => {
    const checkAuthentication = async () => {
      const isAuthenticated = await checkAuth()
      if (!isAuthenticated) {
        router.push("/")
      }
    }

    checkAuthentication()

    // Set up token expiration check
    const tokenExpirationCheck = setInterval(async () => {
      const isAuthenticated = await checkAuth()
      if (!isAuthenticated) {
        router.push("/")
      }
    }, 60000) // Check every minute

    return () => clearInterval(tokenExpirationCheck)
  }, [router])

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardNav />
      <div className="flex-1 p-6">{children}</div>
    </div>
  )
}

