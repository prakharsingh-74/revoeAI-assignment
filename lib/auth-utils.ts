"use client"

export async function checkAuth() {
  const token = localStorage.getItem("token")

  if (!token) {
    return false
  }

  try {
    const response = await fetch("/api/auth/verify", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return response.ok
  } catch (error) {
    console.error("Auth verification error:", error)
    return false
  }
}

