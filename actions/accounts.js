"use server";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

const serializeTransaction = (obj) => {
  const serialized = { ...obj };

  if (obj.balance) {
    serialized.balance = Number(obj.balance);
  }

  if (obj.amount) {
    serialized.amount = Number(obj.amount);
  }

  return serialized;
};

export const updateDefaultAccount = async (accountId) => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });
    if (!user) throw new Error("User not found");
    await db.account.updateMany({
      where: {
        userId: user.id,
        isDefault: true,
      },
      data: {
        isDefault: false,
      },
    });

    const account = await db.account.update({
      where: {
        id: accountId,
        userId: user.id,
      },
      data: {
        isDefault: true,
      },
    });

    revalidatePath("/dashboard");
    return { data: serializeTransaction(account), success: true };
  } catch (error) {
    console.log(error.message);
    return { error: error.message || "Something went wrong", success: false };
  }
};

export const getAccountWithTransactions = async (accountId) => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });
    if (!user) throw new Error("User not found");

    const account = await db.account.findUnique({
      where: {
        id: accountId,
        userId: user.id,
      },
      include: {
        transactions: {
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    if (!account) return null;

    return {
      ...serializeTransaction(account),
      transactions: account.transactions.map(serializeTransaction),
    };
  } catch (error) {
    console.log(error.message);
    return { error: error.message || "Something went wrong", success: false };
  }
};

export const bulkDeleteTransactions = async (transactionIds) => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });
    if (!user) throw new Error("User not found");

    const transactions = await db.transaction.findMany({
      where: {
        id: {
          in: transactionIds,
        },
        userId: user.id,
      },
    });
    const accountBalanceChanges = transactions.reduce((acc, transaction) => {
      const amount = parseFloat(transaction.amount);

      const change = transaction.type === "EXPENSE" ? amount : -amount;
      acc[transaction.accountId] = (acc[transaction.accountId] || 0) + change;
      return acc;
    }, {});

    // delete tranasaction and update account  balance

    await db.$transaction(async (tx) => {
      await tx.transaction.deleteMany({
        where: {
          id: {
            in: transactionIds,
          },
          userId: user.id,
        },
      });
      for (const [accountId, balanceChange] of Object.entries(
        accountBalanceChanges
      )) {
        await tx.account.update({
          where: {
            id: accountId,
          },
          data: {
            balance: { increment: balanceChange.toFixed(2) },
          },
        });
      }
    });

    revalidatePath("/dashboard");
    revalidatePath("/account/[id]");

    return {
      success: true,
    };
  } catch (error) {
    console.log(error.message);
    return { error: error.message || "Something went wrong", success: false };
  }
};
