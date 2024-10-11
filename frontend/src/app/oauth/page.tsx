import { redirect } from "next/navigation";

interface OAuthPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function Page({ searchParams }: OAuthPageProps) {
  console.log("redirected here");
  let { accessToken, refreshToken } = searchParams || {};

  if (!accessToken || !refreshToken) {
    redirect("/auth/signin");
  }

  accessToken = Array.isArray(accessToken) ? accessToken[0] : accessToken;
  refreshToken = Array.isArray(refreshToken)
    ? refreshToken[0]
    : refreshToken;

  // await setAuthCookieSession(accessToken, refreshToken);

  redirect("/dashboard");

  return <></>;
}
