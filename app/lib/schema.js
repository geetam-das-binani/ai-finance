import * as z from "zod";

export const accountSchema = z.object({
  name: z.string().min(3, "Name is required"),
  type: z.enum(["CURRENT", "SAVINGS"]),
  isDefault: z.boolean().default(false),
  balance: z.string().min(1, "Initial Balance is required"),
});

export const transactionSchema = z
  .object({
    type: z.enum(["INCOME", "EXPENSE"]),
    amount: z.string().min(1, "Amount is required"),
    description: z.string().optional(),
    date: z.date({ required_error: "Date is required" }),
    accountId: z.string().min(1, "Account is required"),
    category: z.string().min(1, "Category is required"),
    isRecurring: z.boolean().default(false),
    recurringInterval: z
      .enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"])
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isRecurring && !data.recurringInterval) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Recurring Interval is required",
        path: ["recurringInterval"],
      });
    }
  });
