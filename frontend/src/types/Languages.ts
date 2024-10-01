import { z } from "zod";

const LanguagesEnum = z.enum(["Python", "Java", "C++"]);

type Languages = z.infer<typeof LanguagesEnum>;

export { LanguagesEnum, type Languages };
