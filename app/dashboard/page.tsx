"use client"

import { useState, useEffect } from "react"
import { TableList } from "@/components/dashboard/table-list"
import { CreateTableButton } from "@/components/dashboard/create-table-button"
import { useToast } from "@/hooks/use-toast"

export default function DashboardPage() {
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await fetch("/api/tables", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch tables")
        }

        const data = await response.json()
        setTables(data.tables)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load tables",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTables()
  }, [toast])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <CreateTableButton onTableCreated={(newTable) => setTables([...tables, newTable])} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <TableList tables={tables} />
      )}
    </div>
  )
}

