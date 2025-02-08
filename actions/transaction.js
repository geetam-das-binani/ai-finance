import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export const createTransaction = async (data) => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  try {
    //  Arcjet to add rate limiting
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });
    if (!user) throw new Error("User not found");
    const account = await db.account.findUnique({
      where: {
        id: data.accountId,
        userId: user.id,
      },
    });
    if (!account) throw new Error("Account not found");
    const balanceChange = data.type === "EXPENSE" ? -data.amount : data.amount;
    const newBalance = account.balance.toNumber() + balanceChange;

    const transaction = await db.$transaction(async (tx) => {
      const newTransaction = await tx.transaction.create({
        data: {
          ...data,
          userId: user.id,
          nextRecurringDate:
            data.isRecurring && data.recurringInterval
              ? calculateNextRecurringDate(data.date, data.recurringInterval)
              : null,
        },
      });

      await tx.account.update({
        where: {
          id: data.accountId,
        },
        data: {
          balance: newBalance,
        },
      });
      return newTransaction;
    });

    revalidatePath("/dashboard");
    revalidatePath(`/account/${transaction.accountId}`);
  } catch (error) {
    console.log(error.message || "Something went wrong");
  }
};

function calculateNextRecurringDate(date, recurringInterval) {
  const date = new Date(date);
  switch (recurringInterval) {
    case "DAILY":
      date.setDate(date.getDate() + 1);
    case "WEEKLY":
      date.setDate(date.getDate() + 7);
    case "MONTHLY":
      date.setMonth(date.getMonth() + 1);
      break;
    case "YEARLY":
      date.setFullYear(date.getFullYear() + 1);
      break;
  }

  return date;
}
