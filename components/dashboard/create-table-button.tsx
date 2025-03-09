"use client"

import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

const columnSchema = z.object({
  name: z.string().min(1, "Column name is required"),
  type: z.enum(["text", "date"]),
})

const createTableSchema = z.object({
  name: z.string().min(1, "Table name is required"),
  googleSheetId: z.string().min(1, "Google Sheet ID is required"),
  columns: z.array(columnSchema).min(1, "At least one column is required"),
})

type CreateTableFormValues = z.infer<typeof createTableSchema>

interface CreateTableButtonProps {
  onTableCreated: (table: any) => void
}

export function CreateTableButton({ onTableCreated }: CreateTableButtonProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [columns, setColumns] = useState([{ name: "", type: "text" }])
  const { toast } = useToast()

  const form = useForm<CreateTableFormValues>({
    resolver: zodResolver(createTableSchema),
    defaultValues: {
      name: "",
      googleSheetId: "",
      columns: [{ name: "", type: "text" }],
    },
  })

  const addColumn = () => {
    setColumns([...columns, { name: "", type: "text" }])
  }

  const removeColumn = (index: number) => {
    if (columns.length > 1) {
      const newColumns = [...columns]
      newColumns.splice(index, 1)
      setColumns(newColumns)
    }
  }

  const updateColumn = (index: number, field: string, value: string) => {
    const newColumns = [...columns]
    newColumns[index] = { ...newColumns[index], [field]: value }
    setColumns(newColumns)
    form.setValue("columns", newColumns)
  }

  async function onSubmit(data: CreateTableFormValues) {
    setIsLoading(true)

    try {
      const response = await fetch("/api/tables", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.message || "Failed to create table")
      }

      toast({
        title: "Success",
        description: "Table created successfully",
      })

      onTableCreated(responseData.table)
      setOpen(false)
      form.reset()
      setColumns([{ name: "", type: "text" }])
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to create table",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Table
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Table</DialogTitle>
          <DialogDescription>Create a new table connected to a Google Sheet</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Table Name</Label>
                <Input id="name" placeholder="My Table" {...form.register("name")} />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="googleSheetId">Google Sheet ID</Label>
                <Input
                  id="googleSheetId"
                  placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  {...form.register("googleSheetId")}
                />
                {form.formState.errors.googleSheetId && (
                  <p className="text-sm text-red-500">{form.formState.errors.googleSheetId.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Columns</Label>
                <Button type="button" variant="outline" size="sm" onClick={addColumn}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Column
                </Button>
              </div>

              <div className="space-y-2">
                {columns.map((column, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      placeholder="Column Name"
                      value={column.name}
                      onChange={(e) => updateColumn(index, "name", e.target.value)}
                    />
                    <Select value={column.type} onValueChange={(value) => updateColumn(index, "type", value)}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                      </SelectContent>
                    </Select>
                    {columns.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeColumn(index)}>
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {form.formState.errors.columns && (
                <p className="text-sm text-red-500">{form.formState.errors.columns.message}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Table"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

