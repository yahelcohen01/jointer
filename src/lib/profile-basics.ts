import { z } from "zod";

export const DISPLAY_NAME_MAX = 60;
export const BIO_MAX = 280;

const displayName = z
  .string()
  .trim()
  .min(1, { error: "display_name_required" })
  .max(DISPLAY_NAME_MAX, { error: "display_name_too_long" });

const bio = z.string().trim().max(BIO_MAX, { error: "bio_too_long" });

const language = z.enum(["he", "en"], { error: "invalid_language" });

// Client-side form schema: validates user input as plain strings.
export const profileBasicsFormSchema = z.object({
  display_name: displayName,
  bio,
  language,
});

// Server-side schema: same validation plus transforms an empty bio to null
// so the DB column stays NULL rather than storing an empty string.
export const profileBasicsSchema = profileBasicsFormSchema.extend({
  bio: bio.transform((v) => (v.length === 0 ? null : v)),
});

export type ProfileBasicsFormInput = z.infer<typeof profileBasicsFormSchema>;
export type ProfileBasicsInput = z.infer<typeof profileBasicsSchema>;

export type ProfileBasicsFieldError =
  | "display_name_required"
  | "display_name_too_long"
  | "bio_too_long"
  | "invalid_language";

export type ProfileBasicsServerError = "unauthenticated" | "other";
