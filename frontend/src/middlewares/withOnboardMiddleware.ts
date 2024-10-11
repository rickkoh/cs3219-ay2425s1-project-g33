import { NextFetchEvent, NextRequest, NextResponse } from "next/server";
import { CustomMiddleware } from "./chain";
import { parseJwt } from "@/lib/auth";
import { createResponseRedirect } from "@/lib/utils";

export function withOnboardMiddlware(
  middleware: CustomMiddleware
): CustomMiddleware {
  return async (
    request: NextRequest,
    event: NextFetchEvent,
    response: NextResponse
  ) => {
    const accessToken = request.cookies.get("access_token")?.value;

    response = response || NextResponse.next();

    if (!accessToken) return middleware(request, event, response);

    const decoded = parseJwt(accessToken);

    if (request.nextUrl.pathname.startsWith("/onboard")) {
      if (decoded.isOnboarded) {
        const previousPage = request.headers.get("referer");
        const newResponse = createResponseRedirect(
          new URL(previousPage || "/dashboard", request.url)
        );
        return newResponse;
      }
    } else {
      if (!decoded.isOnboarded) {
        const newResponse = createResponseRedirect(
          new URL("/onboard", request.url)
        );
        return newResponse;
      }
    }

    return middleware(request, event, response);
  };
}
