"use client";

import { parseJwt } from "@/lib/auth";
import {
  AccessToken,
  AccessTokenPayload,
  AccessTokenPayloadSchema,
} from "@/types/Token";
import { UserProfile } from "@/types/User";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  PropsWithChildren,
} from "react";

const UserContext = createContext<UserProfile | undefined>(undefined);

export function UserProvider({ children }: PropsWithChildren) {
  // TODO: Once User Service is implemented on the backend, fetch user profile
  const [user, setUser] = useState<UserProfile>();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      const decoded = parseJwt(token);
      setUser(decoded);
    }
  }, []);

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}
