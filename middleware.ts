import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Optional: add auth redirects when you have server-side session/cookies.
// For now, client-side AuthContext handles protection; middleware can enforce redirects later.
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
