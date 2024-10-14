import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const queryParams = request.nextUrl.searchParams;
  const accessToken = queryParams.get("accessToken");
  const refreshToken = queryParams.get("refreshToken");
  
  if (!accessToken) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  const cookieStore = cookies();
  cookieStore.set("access_token", accessToken);
  if (refreshToken) cookieStore.set("refresh_token", refreshToken);

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
