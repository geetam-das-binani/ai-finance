"use server";

import { aj } from "@/app/lib/arcjet";
import { db } from "@/lib/prisma";
import { request } from "@arcjet/next";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function serializeAmount(transaction) {
  return {
    ...transaction,
    amount: transaction.amount.toNumber(),
  };
}
export const createTransaction = async (data) => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  try {
    // Get request data for ArcJet
    const req = await request();

    // Check rate limit
    const decision = await aj.protect(req, {
      userId,
      requested: 1, // Specify how many tokens to consume
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        const { remaining, reset } = decision.reason;
        console.error({
          code: "RATE_LIMIT_EXCEEDED",
          details: {
            remaining,
            resetInSeconds: reset,
          },
        });

        throw new Error("Too many requests. Please try again later.");
      }

      throw new Error("Request blocked");
    }

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
              ? calculateNextRecurringDate(data?.date, data?.recurringInterval)
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

    console.log(transaction, "transaction");
    revalidatePath("/dashboard");
    revalidatePath(`/account/${transaction.accountId}`);
    return { success: true, data: serializeAmount(transaction) };
  } catch (error) {
    throw new Error(error.message);
  }
};
function calculateNextRecurringDate(startDate, recurringInterval) {
  let date = new Date(startDate);
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
export const scanReceipt = async (file) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const arrayBuffer = await file.arrayBuffer();
    const base64String = Buffer.from(arrayBuffer).toString("base64");
    const prompt = ` Analyze this receipt image and extract the following information in JSON format:
      - Total amount (just the number)
      - Date (in ISO format)
      - Description or items purchased (brief summary)
      - Merchant/store name
      - Suggested category (one of: housing,transportation,groceries,utilities,entertainment,food,shopping,healthcare,education,personal,travel,insurance,gifts,bills,other-expense,salary,freelance,investments,business,other-income,rental)
      
      Only respond with valid JSON in this exact format:
      {
        "amount": number,
        "date": "ISO date string",
        "description": "string",
        "merchantName": "string",
        "category": "string"
      }

      If its not a recipt, return an empty object`;

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      },
      prompt,
    ]);

    const response = await result.response;
    const text = response.text();
    const cleanedText = text
      .toString()
      .replace(/```(?:json)?\n?/g, "")
      .trim();

    try {
      const data = JSON.parse(cleanedText);
      return {
        data: {
          amount: data.amount,
          date: new Date(data.date).toISOString(),
          description: data.description,
          merchantName: data.merchantName,
          category: data.category,
        },
        success: true,
      };
    } catch (parseError) {
      console.error("Error parsing JSON response:", parseError);
      throw new Error("Invalid response format from Gemini");
    }
  } catch (error) {
    console.error("Error scanning receipt:", error?.message);
    throw new Error("Failed to scan receipt");
  }
};

export const getTransaction = async (id) => {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });
    if (!user) throw new Error("User not found");

    const transaction = await db.transaction.findUnique({
      where: {
        id,
        userId: user.id,
      },
    });
    if (!transaction) throw new Error("Transaction not found");
    return serializeAmount(transaction);
  } catch (error) {
    console.error("error fetching transaction");
    throw new Error(error?.message);
  }
};

export const updateTransaction = async (id, data) => {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });
    if (!user) throw new Error("User not found");

    const transaction = await db.transaction.findUnique({
      where: {
        id,
        userId: user.id,
      },
      include: {
        account: true,
      },
    });
    if (!transaction) throw new Error("Transaction not found");
    const oldBalance =
      transaction.type === "EXPENSE"
        ? -transaction.amount.toNumber()
        : transaction.amount.toNumber();
    const newBalance = data.type === "EXPENSE" ? -data.amount : data.amount;
    const netBalanceChange = newBalance - oldBalance;

    const updatedTransaction = await db.$transaction(async (tx) => {
      const updatedTransaction = await tx.transaction.update({
        where: {
          id,
          userId: user.id,
        },
        data: {
          ...data,
          nextRecurringDate:
            data.isRecurring && data.recurringInterval
              ? calculateNextRecurringDate(data?.date, data?.recurringInterval)
              : null,
        },
      });

      await tx.account.update({
        where: {
          id: updatedTransaction.accountId,
        },
        data: {
          balance: {
            increment: netBalanceChange,
          },
        },
      });
      return updatedTransaction;
    });
    revalidatePath("/dashboard");
    revalidatePath(`/account/${updatedTransaction.accountId}`);
    return {success:true,data:serializeAmount(updatedTransaction)}
  } catch (error) {
    console.error("error updating transaction");
    throw new Error(error?.message);
  }
};
