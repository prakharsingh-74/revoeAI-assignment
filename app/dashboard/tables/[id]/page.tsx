"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { DataTable } from "@/components/dashboard/data-table"
import { AddColumnDialog } from "@/components/dashboard/add-column-dialog"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw } from "lucide-react"

export default function TablePage() {
  const params = useParams()
  const tableId = params.id as string
  const [tableData, setTableData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [columns, setColumns] = useState([])
  const [rows, setRows] = useState([])
  const { toast } = useToast()

  const fetchTableData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/tables/${tableId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch table data")
      }

      const data = await response.json()
      setTableData(data.table)
      setColumns(data.table.columns)
      setRows(data.table.rows)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load table data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTableData()

    // Set up WebSocket connection for real-time updates
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/tables/${tableId}`)

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === "update") {
        setRows(data.rows)
      }
    }

    return () => {
      ws.close()
    }
  }, [tableId, toast])

  const handleAddColumn = async (newColumn) => {
    try {
      const response = await fetch(`/api/tables/${tableId}/columns`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ column: newColumn }),
      })

      if (!response.ok) {
        throw new Error("Failed to add column")
      }

      const data = await response.json()
      setColumns([...columns, data.column])

      toast({
        title: "Success",
        description: "Column added successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add column",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{tableData?.name}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchTableData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <AddColumnDialog onAddColumn={handleAddColumn} />
        </div>
      </div>

      <DataTable columns={columns} data={rows} />
    </div>
  )
}

