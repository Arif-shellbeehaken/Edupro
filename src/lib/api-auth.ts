import { auth } from "@/infrastructure/auth/auth";
import { NextResponse } from "next/server";

/** Shared guard for /api/v1/* — session JWT required */
export async function requireApiSession() {
  const session = await auth();
  if (!session?.user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      session: null as null,
    };
  }
  return { error: null, session };
}
