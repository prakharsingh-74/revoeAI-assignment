import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyAuth } from "@/lib/auth-middleware"
import { ObjectId } from "mongodb"
import { google } from "googleapis"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await verifyAuth(request)

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const db = await connectToDatabase()
    const tablesCollection = db.collection("tables")

    const table = await tablesCollection.findOne({
      _id: new ObjectId(params.id),
      userId,
    })

    if (!table) {
      return NextResponse.json({ message: "Table not found" }, { status: 404 })
    }

    // Fetch data from Google Sheet
    const rows = await fetchGoogleSheetData(table.googleSheetId, table.columns)

    return NextResponse.json({
      table: {
        ...table,
        rows,
      },
    })
  } catch (error) {
    console.error("Get table error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

async function fetchGoogleSheetData(sheetId: string, columns: any[]) {
  // Initialize the Google Sheets API client
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || "{}"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  })

  const sheets = google.sheets({ version: "v4", auth })

  // Get the first sheet
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: sheetId,
  })

  const sheetTitle = spreadsheet.data.sheets?.[0].properties?.title

  if (!sheetTitle) {
    throw new Error("No sheets found in the spreadsheet")
  }

  // Get the data from the sheet
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: sheetTitle,
  })

  const values = response.data.values || []

  // Skip the header row and convert to objects
  const headerRow = values[0] || []
  const dataRows = values.slice(1)

  return dataRows.map((row) => {
    const rowData: Record<string, any> = {}

    // Map Google Sheet columns to our columns
    columns.forEach((column, index) => {
      if (column.isGoogleSheet && index < headerRow.length) {
        rowData[column.id] = row[index] || ""
      }
    })

    return rowData
  })
}

