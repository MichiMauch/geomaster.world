import { NextResponse } from "next/server";

// Increment this to force all clients to update
const APP_VERSION = "2.0.0";

export async function GET() {
  return NextResponse.json(
    { version: APP_VERSION, timestamp: Date.now() },
    {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    }
  );
}
