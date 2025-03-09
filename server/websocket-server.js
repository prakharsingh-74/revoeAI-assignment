const WebSocket = require("ws")
const http = require("http")
const { google } = require("googleapis")
const { MongoClient, ObjectId } = require("mongodb")

// Configuration
const PORT = process.env.WS_PORT || 8080
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/dashboard"
const MONGODB_DB = process.env.MONGODB_DB || "dashboard"
const POLL_INTERVAL = 10000 // 10 seconds

// Create HTTP server
const server = http.createServer()

// Create WebSocket server
const wss = new WebSocket.Server({ server })

// MongoDB connection
let db

async function connectToMongo() {
  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  db = client.db(MONGODB_DB)
  console.log("Connected to MongoDB")
}

// Google Sheets API setup
async function getGoogleSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || "{}"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  })

  return google.sheets({ version: "v4", auth })
}

// Track active connections by table ID
const tableConnections = new Map()

// Handle WebSocket connections
wss.on("connection", async (ws, req) => {
  // Extract table ID from URL path
  const url = new URL(req.url, "http://localhost")
  const pathParts = url.pathname.split("/")
  const tableId = pathParts[pathParts.length - 1]

  if (!tableId) {
    ws.close(1008, "Invalid table ID")
    return
  }

  console.log(`New connection for table: ${tableId}`)

  // Add this connection to the table's connections
  if (!tableConnections.has(tableId)) {
    tableConnections.set(tableId, new Set())
    // Start polling for this table
    startPollingTable(tableId)
  }

  tableConnections.get(tableId).add(ws)

  // Handle disconnection
  ws.on("close", () => {
    console.log(`Connection closed for table: ${tableId}`)
    const connections = tableConnections.get(tableId)
    connections.delete(ws)

    // If no more connections for this table, stop polling
    if (connections.size === 0) {
      tableConnections.delete(tableId)
      // Could stop polling here, but we'll keep it running for simplicity
    }
  })
})

// Poll Google Sheets for changes
async function startPollingTable(tableId) {
  let lastData = null

  const pollTable = async () => {
    try {
      // Skip if no active connections
      if (!tableConnections.has(tableId)) {
        return
      }

      // Get table info from MongoDB
      const table = await db.collection("tables").findOne({ _id: new ObjectId(tableId) })

      if (!table) {
        console.error(`Table not found: ${tableId}`)
        return
      }

      // Fetch data from Google Sheets
      const sheets = await getGoogleSheetsClient()

      // Get the first sheet
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: table.googleSheetId,
      })

      const sheetTitle = spreadsheet.data.sheets?.[0].properties?.title

      if (!sheetTitle) {
        console.error("No sheets found in the spreadsheet")
        return
      }

      // Get the data from the sheet
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: table.googleSheetId,
        range: sheetTitle,
      })

      const values = response.data.values || []

      // Skip the header row and convert to objects
      const headerRow = values[0] || []
      const dataRows = values.slice(1)

      const rows = dataRows.map((row) => {
        const rowData = {}

        // Map Google Sheet columns to our columns
        table.columns.forEach((column, index) => {
          if (column.isGoogleSheet && index < headerRow.length) {
            rowData[column.id] = row[index] || ""
          }
        })

        return rowData
      })

      // Check if data has changed
      const dataString = JSON.stringify(rows)
      if (dataString !== lastData) {
        lastData = dataString

        // Broadcast to all connections for this table
        const connections = tableConnections.get(tableId)
        const message = JSON.stringify({
          type: "update",
          rows,
        })

        for (const client of connections) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(message)
          }
        }
      }
    } catch (error) {
      console.error(`Error polling table ${tableId}:`, error)
    }

    // Schedule next poll
    setTimeout(pollTable, POLL_INTERVAL)
  }

  // Start polling
  pollTable()
}

// Start the server
async function startServer() {
  try {
    await connectToMongo()
    server.listen(PORT, () => {
      console.log(`WebSocket server running on port ${PORT}`)
    })
  } catch (error) {
    console.error("Failed to start server:", error)
    process.exit(1)
  }
}

startServer()

