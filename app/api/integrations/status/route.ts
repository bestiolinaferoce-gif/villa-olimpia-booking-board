import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    kvConfigured: Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN),
    n8nConfigured: Boolean(process.env.N8N_BOOKING_WEBHOOK_URL && process.env.N8N_WEBHOOK_SECRET),
  });
}
