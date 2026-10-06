import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/src/lib/auth";

export async function GET(req: NextRequest) {
  return NextResponse.json({ authenticated: isAdminRequest(req) });
}