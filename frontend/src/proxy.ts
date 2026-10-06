import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/src/lib/auth";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isRead = req.method === "GET" || req.method === "HEAD";
  const isPublicWrite =
    req.method === "POST" &&
    (pathname === "/api/players" || pathname === "/api/admin/login");

  if (isRead || isPublicWrite || isAdminRequest(req)) return NextResponse.next();
  return NextResponse.json({ message: "No autorizado" }, { status: 401 });
}

export const config = { matcher: ["/api/:path*"] }; 