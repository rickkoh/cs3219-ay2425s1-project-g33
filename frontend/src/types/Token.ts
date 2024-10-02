import { z } from "zod";
import { createResponseSchema } from "./Response";

export const TokenPairSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
});
export const AccessTokenSchema = TokenPairSchema.omit({
  refresh_token: true,
});

export const TokenPairResponseSchema = createResponseSchema(TokenPairSchema);
export const AccessTokenResponseSchema =
  createResponseSchema(AccessTokenSchema);

export type TokenPair = z.infer<typeof TokenPairSchema>;
export type AccessToken = z.infer<typeof AccessTokenSchema>;
export type TokenPairResponse = z.infer<typeof TokenPairResponseSchema>;
export type AccessTokenResponse = z.infer<typeof AccessTokenResponseSchema>;
