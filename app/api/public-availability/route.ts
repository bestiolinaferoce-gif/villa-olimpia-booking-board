/**
 * Public read-only availability endpoint — consumed by the public website.
 * Returns occupied date ranges for a given lodge. No guest data is exposed.
 *
 * GET /api/public-availability?lodge=Frangipane
 *
 * Response: { lodge, ranges: [{start, end}], lastSyncedAt, source }
 */
import { NextRequest, NextResponse } from "next/server"

const BASE  = process.env.KV_REST_API_URL   ?? ""
const TOKEN = process.env.KV_REST_API_TOKEN ?? ""
const KEY   = "vob_bookings"

type OccupiedRange = { start: string; end: string }

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const lodge = req.nextUrl.searchParams.get("lodge")?.trim()
  if (!lodge) {
    return NextResponse.json({ error: "lodge parameter required" }, { status: 400 })
  }

  if (!BASE || !TOKEN) {
    return NextResponse.json(
      { lodge, ranges: [], lastSyncedAt: null, source: "booking-board" },
      { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=60" } }
    )
  }

  try {
    const res = await fetch(`${BASE}/get/${KEY}`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      cache: "no-store",
    })
    const json = (await res.json()) as { result: string | null }
    if (!json.result) {
      return NextResponse.json(
        { lodge, ranges: [], lastSyncedAt: null, source: "booking-board" },
        { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=60" } }
      )
    }

    const parsed = JSON.parse(json.result)
    const data: Array<{ lodge: string; checkIn: string; checkOut: string; status: string }> =
      Array.isArray(parsed) ? parsed : (parsed?.data ?? [])
    const lastSyncedAt: string | null = Array.isArray(parsed) ? null : (parsed?.ts ?? null)

    const ranges: OccupiedRange[] = data
      .filter((b) => b.lodge === lodge && b.status !== "cancelled")
      .map((b) => ({ start: b.checkIn, end: b.checkOut }))

    return NextResponse.json(
      { lodge, ranges, lastSyncedAt, source: "booking-board" },
      { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=60" } }
    )
  } catch (err) {
    console.error("[public-availability] KV read error:", err)
    return NextResponse.json(
      { lodge, ranges: [], lastSyncedAt: null, source: "booking-board" },
      { status: 200 }
    )
  }
}
