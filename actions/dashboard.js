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
export const createAccount = async (data) => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });
    if (!user) throw new Error("User not found");

    const balanceFloat = parseFloat(data.balance);
    if (isNaN(balanceFloat)) throw new Error("Invalid balance amoount");

    const existingAcounts = await db.account.findMany({
      where: {
        userId: user.id,
      },
    });

    const shouldBeDefault = existingAcounts.length === 0 ? true : data.default;

    if (shouldBeDefault) {
      await db.account.updateMany({
        where: {
          userId: user.id,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }
    const account = await db.account.create({
      data: {
        ...data,
        userId: user.id,
        balance: balanceFloat,
        isDefault: shouldBeDefault,
      },
    });

    const serializedAccount = serializeTransaction(account);
    revalidatePath("/dashboard");
    return { data: serializedAccount };
  } catch (error) {
    console.log(error.message);
  }
};

export const getUserAccounts = async () => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  try {
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });
    if (!user) throw new Error("User not found");

    const accounts = await db.account.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    const serializedAccounts = accounts.map(serializeTransaction);

    return serializedAccounts;
  } catch (error) {
    console.log(error.message);
  }
};
