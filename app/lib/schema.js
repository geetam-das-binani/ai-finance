import * as z from "zod";

export const accountSchema = z.object({
  name: z.string().min(3, "Name is required"),
  type: z.enum(["CURRENT", "SAVINGS"]),
  isDefault: z.boolean().default(false),
  balance: z.string().min(1, "Initial Balance is required"),
});
