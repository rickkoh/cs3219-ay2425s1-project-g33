"use server";

import { getAccessToken } from "@/lib/auth";
import {
  SessionInfoResponse,
  SessionInfoResponseSchema,
} from "@/types/SessionInfo";
import { cache } from "react";

export const getSessionInfo = cache(async function (
  sessionId: string
): Promise<SessionInfoResponse> {
  try {
    const access_token = await getAccessToken();

    const res = await fetch(
      process.env.PUBLIC_API_URL + `/api/collaboration/${sessionId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const data = await res.json();

    console.log(data);

    return SessionInfoResponseSchema.parse(data);
  } catch (error) {
    return {
      statusCode: 500,
      message: String(error),
    };
  }
});
