import { z } from "zod";
import { ProficiencyEnum } from "./Proficiency";
import { LanguageEnum } from "./Languages";

const UserProfileSchema = z.object({
  username: z.string(),
  displayName: z.string(),
  email: z.string().email(),
  roles: z.string().array(),
  proficiency: ProficiencyEnum,
  languages: z.array(LanguageEnum),
});

type UserProfile = z.infer<typeof UserProfileSchema>;

export {
  UserProfileSchema,
  type UserProfile,
}
