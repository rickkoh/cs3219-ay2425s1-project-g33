import { z } from "zod";
import { ProficiencyEnum } from "./Proficiency";
import { LanguageEnum } from "./Languages";
import { RoleEnum } from "./Role";

const UserProfileSchema = z.object({
  username: z.string(),
  displayName: z.string(),
  email: z.string().email(),
  roles: z.array(RoleEnum),
  proficiency: ProficiencyEnum,
  languages: z.array(LanguageEnum),
});

type UserProfile = z.infer<typeof UserProfileSchema>;

export {
  UserProfileSchema,
  type UserProfile,
}
