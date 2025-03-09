import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import jwt from "jsonwebtoken"
import { ObjectId } from "mongodb"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }

      const db = await connectToDatabase()
      const usersCollection = db.collection("users")

      const user = await usersCollection.findOne({ _id: new ObjectId(decoded.userId) })

      if (!user) {
        return NextResponse.json({ message: "User not found" }, { status: 401 })
      }

      return NextResponse.json({ valid: true })
    } catch (error) {
      return NextResponse.json({ message: "Invalid or expired token" }, { status: 401 })
    }
  } catch (error) {
    console.error("Verification error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

