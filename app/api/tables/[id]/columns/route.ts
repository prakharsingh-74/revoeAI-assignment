import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyAuth } from "@/lib/auth-middleware"
import { ObjectId } from "mongodb"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await verifyAuth(request)

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { column } = await request.json()

    const db = await connectToDatabase()
    const tablesCollection = db.collection("tables")

    // Find the table
    const table = await tablesCollection.findOne({
      _id: new ObjectId(params.id),
      userId,
    })

    if (!table) {
      return NextResponse.json({ message: "Table not found" }, { status: 404 })
    }

    // Generate a unique column ID
    const columnId = `custom_${Date.now()}`

    // Create the new column
    const newColumn = {
      id: columnId,
      name: column.name,
      type: column.type,
      isGoogleSheet: false,
    }

    // Add the column to the table
    await tablesCollection.updateOne({ _id: new ObjectId(params.id) }, { $push: { columns: newColumn } })

    return NextResponse.json({ column: newColumn })
  } catch (error) {
    console.error("Add column error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

