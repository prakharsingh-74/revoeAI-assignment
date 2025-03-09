"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"

interface Table {
  _id: string
  name: string
  googleSheetId: string
  createdAt: string
}

interface TableListProps {
  tables: Table[]
}

export function TableList({ tables }: TableListProps) {
  if (tables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border rounded-lg p-6 text-center">
        <h3 className="text-lg font-medium mb-2">No tables yet</h3>
        <p className="text-muted-foreground mb-4">Create your first table to get started</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {tables.map((table) => (
        <Card key={table._id}>
          <CardHeader>
            <CardTitle>{table.name}</CardTitle>
            <CardDescription>Created on {new Date(table.createdAt).toLocaleDateString()}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground truncate">Sheet ID: {table.googleSheetId}</p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button asChild>
              <Link href={`/dashboard/tables/${table._id}`}>View Table</Link>
            </Button>
            <Button variant="outline" asChild>
              <a
                href={`https://docs.google.com/spreadsheets/d/${table.googleSheetId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Sheet
              </a>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

