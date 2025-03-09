"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"

interface Column {
  id: string
  name: string
  type: "text" | "date"
}

interface DataTableProps {
  columns: Column[]
  data: any[]
}

export function DataTable({ columns, data }: DataTableProps) {
  const [rows, setRows] = useState(data)

  useEffect(() => {
    setRows(data)
  }, [data])

  const renderCell = (row: any, column: Column) => {
    const value = row[column.id]

    if (column.type === "date" && value) {
      return format(new Date(value), "PPP")
    }

    return value || ""
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.id}>{column.name}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No data available
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map((column) => (
                  <TableCell key={`${rowIndex}-${column.id}`}>{renderCell(row, column)}</TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

