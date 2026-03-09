import { fetchWithAuth } from "@/lib/auth"

export async function getFollowUps(status?: string) {

  const params = new URLSearchParams()

  if (status) params.set("status", status)

  params.set("limit", "200")

  const res = await fetchWithAuth(`/api/follow-ups?${params}`)

  if (!res.ok) throw new Error("Failed to fetch followups")

  return res.json()
}

export async function getFollowUpStats() {

  const res = await fetchWithAuth(`/api/follow-ups/stats`)

  if (!res.ok) throw new Error("Failed to fetch stats")

  return res.json()
}

export async function deleteFollowUp(id:string){

  return fetchWithAuth(`/api/follow-ups/${id}`,{
    method:"DELETE"
  })

}
