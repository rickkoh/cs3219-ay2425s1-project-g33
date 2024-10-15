"use server";

import { cookies } from "next/headers";

import {
  AccessTokenResponse,
  AccessTokenResponseSchema,
  RefreshTokenSchema,
  TokenPairResponse,
  TokenPairResponseSchema,
} from "@/types/Token";
import {
  LoginCredentials,
  SignupData,
  SignupDataSchema,
} from "@/types/AuthCredentials";
import {
  RequestSSOUrlResponse,
  RequestSSOUrlResponseSchema,
  LogoutResponse,
  LogoutResposeSchema,
} from "@/types/AuthResponses";
import {
  deleteAuthCookieSession,
  getAccessToken,
  getRefreshToken,
  setAuthCookieSession,
} from "@/lib/auth";
import { AccountProvider } from "@/types/AccountProvider";

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

    const tokenPairResponse = TokenPairResponseSchema.parse(resObj);
    const accessTokenResponse = AccessTokenResponseSchema.parse(resObj);

    if (tokenPairResponse.data) {
      await setAuthCookieSession(tokenPairResponse.data);
    }

    return accessTokenResponse;
  } catch (error) {
    return {
      statusCode: 500,
      message: String(error),
    };
  }
}

export async function requestSSOUrl(
  provider: AccountProvider
): Promise<RequestSSOUrlResponse> {
  try {
    const res: Response = await fetch(
      process.env.PUBLIC_API_URL + `/api/auth/${provider}`,
      {
        cache: "no-cache",
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        redirect: "manual",
      }
    );

    return RequestSSOUrlResponseSchema.parse({
      statusCode: res.status,
      message: "SSO redirect request fetched",
      data: res.headers.get("Location"),
    });
  } catch (error) {
    console.error(error);
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
    const parsedSignupData = SignupDataSchema.parse(signupData);
    const res: Response = await fetch(
      process.env.PUBLIC_API_URL + `/api/auth/local/signup`,
      {
        cache: "no-cache",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsedSignupData),
      }
    );

    const resObj = await res.json();

    const tokenPairResponse = TokenPairResponseSchema.parse(resObj);
    const accessTokenResponse = AccessTokenResponseSchema.parse(resObj);

    if (tokenPairResponse.data) {
      await setAuthCookieSession(tokenPairResponse.data);
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
    const access_token = await getAccessToken();

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

    await deleteAuthCookieSession();

    return LogoutResposeSchema.parse(resObj);
  } catch (error) {
    return {
      statusCode: 500,
      message: String(error),
    };
  }
}

export async function refreshAccessToken(): Promise<TokenPairResponse> {
  try {
    const refresh_token = await getRefreshToken();

    const res: Response = await fetch(
      process.env.PUBLIC_API_URL + `/api/auth/refresh`,
      {
        cache: "no-cache",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${refresh_token}`,
        },
      }
    );

    const resObj = await res.json();

    const tokenPairResponse = TokenPairResponseSchema.parse(resObj);

    return tokenPairResponse;
  } catch (error) {
    return {
      statusCode: 500,
      message: String(error),
    };
  }
}
