import { NextFetchEvent, NextRequest, NextResponse } from "next/server";
import { CustomMiddleware } from "./chain";
import { createResponseRedirect, setAuthCookieSession } from "@/lib/utils";

export function withAuthMiddlware(
  middleware: CustomMiddleware
): CustomMiddleware {
  return async (
    request: NextRequest,
    event: NextFetchEvent,
    response: NextResponse
  ) => {
    const accessToken = request.cookies.get("access_token")?.value;

    if (request.nextUrl.pathname.startsWith("/auth")) {
      if (accessToken) {
        const previousPage = request.headers.get("referer");
        const newResponse = createResponseRedirect(
          new URL(previousPage || "/dashboard", request.url)
        );
        return newResponse;
      }
    } else if (request.nextUrl.pathname.startsWith("/oauth")) {
      console.log("oauth middleware for oauth invoked");
      const accessToken = request.nextUrl.searchParams.get("accessToken");
      const refreshToken = request.nextUrl.searchParams.get("refreshToken");

      if (!accessToken || !refreshToken) {
        const newResponse = createResponseRedirect(
          new URL("/auth/signin", request.url)
        );
        return newResponse;
      }

      const newResponse = createResponseRedirect(
        new URL("/dashboard", request.url)
      );
      setAuthCookieSession(accessToken, refreshToken, newResponse);
      return newResponse;
    } else {
      // for required auth routes
      if (!accessToken) {
        const newResponse = createResponseRedirect(
          new URL("/auth/signin", request.url)
        );
        return newResponse;
      }

      // TODO refresh token if expired call nestjs backend
    }

    return middleware(request, event, response);
  };
}
