import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAccessToken, parseJwt } from "@/lib/auth";
import { AccessToken, AccessTokenSchema } from "./types/Token";

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const token = await getAccessToken();

  if (!token) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  const tokenValue: AccessToken = AccessTokenSchema.parse(token);
  const decoded = parseJwt(tokenValue);

  if (!decoded.isOnboarded) {
    return NextResponse.redirect(new URL("/onboard", request.url));
  }

  return NextResponse.next();
}

// Define routes that should use the middleware
export const config = {
  matcher: ["/dashboard/:path*"],
};
