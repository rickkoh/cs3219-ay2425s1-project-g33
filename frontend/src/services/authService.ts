"use server";

import { cookies } from "next/headers";

import {
  AccessTokenResponse,
  AccessTokenResponseSchema,
  TokenPairResponseSchema,
} from "@/types/Token";
import { LoginCredentials, SignupData } from "@/types/AuthCredentials";
import { LogoutResponse, LogoutResposeSchema } from "@/types/AuthResponses";

export async function login(
  credientials: LoginCredentials
): Promise<AccessTokenResponse> {
  try {
    const res: Response = await fetch(
      process.env.PUBLIC_API_URL + `/api/auth/local/login`,
      {
        cache: "no-cache",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credientials),
      }
    );

    const resObj = await res.json();

    const authTokenResponse = TokenPairResponseSchema.parse(resObj);
    const accessTokenResponse = AccessTokenResponseSchema.parse(resObj);

    if (authTokenResponse.data) {
      const cookieStore = cookies();
      cookieStore.set("access_token", authTokenResponse.data.access_token, {
        httpOnly: true,
        // secure: true, // Uncomment this line when using HTTPS
        sameSite: "strict",
      });
      cookieStore.set("refresh_token", authTokenResponse.data.refresh_token, {
        maxAge: 60 * 60 * 24 * 7, // 7 days
        httpOnly: true,
        // secure: true, // Uncomment this line when using HTTPS
        sameSite: "strict",
      });
    }

    return accessTokenResponse;
  } catch (error) {
    return {
      statusCode: 500,
      message: String(error),
    };
  }
}

export async function signup(
  signupData: SignupData
): Promise<AccessTokenResponse> {
  try {
    const res: Response = await fetch(
      process.env.PUBLIC_API_URL + `/api/auth/local/signup`,
      {
        cache: "no-cache",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signupData),
      }
    );

    const resObj = await res.json();

    const authTokenResponse = TokenPairResponseSchema.parse(resObj);
    const accessTokenResponse = AccessTokenResponseSchema.parse(resObj);

    if (authTokenResponse.data) {
      const cookieStore = cookies();
      cookieStore.set("access_token", authTokenResponse.data.access_token, {
        httpOnly: true,
        // secure: true, // Uncomment this line when using HTTPS
        sameSite: "strict",
      });
      cookieStore.set("refresh_token", authTokenResponse.data.refresh_token, {
        maxAge: 60 * 60 * 24 * 7, // 7 days
        httpOnly: true,
        // secure: true, // Uncomment this line when using HTTPS
        sameSite: "strict",
      });
    }

    return accessTokenResponse;
  } catch (error) {
    return {
      statusCode: 500,
      message: String(error),
    };
  }
}

export async function logout(): Promise<LogoutResponse> {
  try {
    const access_token = cookies().get("access_token");

    const res: Response = await fetch(
      process.env.PUBLIC_API_URL + `/api/auth/logout`,
      {
        cache: "no-cache",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const resObj = await res.json();

    const cookieStore = cookies();
    cookieStore.delete("access_token");
    cookieStore.delete("refresh_token");

    return LogoutResposeSchema.parse(resObj);
  } catch (error) {
    return {
      statusCode: 500,
      message: String(error),
    };
  }
}
