import { NextResponse } from "next/server";
import { getServerSession, toPublicSessionView } from "@/lib/auth/session-store";

export async function GET(): Promise<NextResponse> {
  const session = await getServerSession();
  const publicView = toPublicSessionView(session);

  return NextResponse.json(publicView, {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
