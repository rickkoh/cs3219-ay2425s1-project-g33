import { z } from "zod";
import { ProficiencyEnum } from "./Proficiency";
import { LanguagesEnum } from "./Languages";

const UserSchema = z.object({
  username: z.string(),
  displayName: z.string(),
  email: z.string().email(),
  proficiency: ProficiencyEnum,
  languages: LanguagesEnum,
});

type User = z.infer<typeof UserSchema>;

export { UserSchema, type User };
