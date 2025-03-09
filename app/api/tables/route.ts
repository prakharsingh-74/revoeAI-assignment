import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyAuth } from "@/lib/auth-middleware"
import { google } from "googleapis"

export async function GET(request: Request) {
  try {
    const userId = await verifyAuth(request)

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const db = await connectToDatabase()
    const tablesCollection = db.collection("tables")

    const tables = await tablesCollection.find({ userId }).sort({ createdAt: -1 }).toArray()

    return NextResponse.json({ tables })
  } catch (error) {
    console.error("Get tables error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const userId = await verifyAuth(request)

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { name, googleSheetId, columns } = await request.json()

    // Validate Google Sheet ID and access
    try {
      await validateGoogleSheet(googleSheetId)
    } catch (error) {
      return NextResponse.json({ message: "Invalid or inaccessible Google Sheet" }, { status: 400 })
    }

    const db = await connectToDatabase()
    const tablesCollection = db.collection("tables")

    // Create table with columns
    const result = await tablesCollection.insertOne({
      name,
      googleSheetId,
      columns: columns.map((column, index) => ({
        id: `col_${index}`,
        name: column.name,
        type: column.type,
        isGoogleSheet: true,
      })),
      userId,
      createdAt: new Date(),
    })

    const table = await tablesCollection.findOne({ _id: result.insertedId })

    return NextResponse.json({ table })
  } catch (error) {
    console.error("Create table error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

async function validateGoogleSheet(sheetId: string) {
  // Initialize the Google Sheets API client
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || "{}"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  })

  const sheets = google.sheets({ version: "v4", auth })

  // Try to access the sheet to validate it
  await sheets.spreadsheets.get({
    spreadsheetId: sheetId,
  })
}

