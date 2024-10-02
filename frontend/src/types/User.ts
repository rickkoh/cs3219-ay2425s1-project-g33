import { z } from "zod";

export const UserProfileSchema = z.object({
  email: z.string(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;
