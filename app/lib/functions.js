import { db } from "@/lib/prisma";
import sendEmail from "@/actions/send-email";
import EmailTemplate from "@/emails/template";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const checkBudgetAlert = async () => {
  const budgets = await db.budget.findMany({
    include: {
      user: {
        include: {
          accounts: {
            where: {
              isDefault: true,
            },
          },
        },
      },
    },
  });

  for (const budget of budgets) {
    const defaultAccount = budget.user.accounts[0];
    if (!defaultAccount) continue; // skip if no default account

    const startDate = new Date();
    startDate.setDate(1); //Start of current month
    const expenses = await db.transaction.aggregate({
      where: {
        userId: budget.userId,
        type: "EXPENSE",
        date: {
          gte: startDate, // for the current month and above
        },
        accountId: defaultAccount.id,
      },
      _sum: {
        amount: true,
      },
    });
    const totalExpenses = expenses._sum.amount?.toNumber() || 0;
    const budgetAmount = budget.amount.toNumber();
    const percentageUsed = (totalExpenses / budgetAmount) * 100;

    if (
      percentageUsed >= 80 &&
      (!budget.lastAlertSent ||
        isNewMonth(new Date(budget.lastAlertSent), new Date()))
    ) {
      // send email

      await sendEmail({
        react: EmailTemplate({
          userName: budget.user.name,
          type: "budget-alert",
          data: {
            percentageUsed,
            budgetAmount: parseInt(budgetAmount).toFixed(1),
            totalExpenses: parseInt(totalExpenses).toFixed(1),
            accountName: defaultAccount.name,
          },
        }),
        to: budget.user.email,
        subject: `Budget Alert for ${defaultAccount.name}`,
      });
      // update last alert sent date
      await db.budget.update({
        where: {
          id: budget.id,
        },
        data: {
          lastAlertSent: new Date(),
        },
      });
    }
  }
};

// Trigger recurring transactions with batching
export const triggerRecurringTransactions = async () => {
  const recurringTransactions = await db.transaction.findMany({
    where: {
      isRecurring: true,
      status: "COMPLETED",
      OR: [
        { lastProcessed: null },
        {
          nextRecurringDate: {
            lte: new Date(), // due date passed
          },
        },
      ],
    },
  });

  if (!recurringTransactions.length) return;

  for (const transaction of recurringTransactions) {
    const singleTransaction = await db.transaction.findUnique({
      where: {
        id: transaction.id,
        userId: transaction.userId,
      },
    });

    if (!singleTransaction || !isTransactionDue(singleTransaction)) continue;

    await db.$transaction(async (tx) => {
      await tx.transaction.create({
        data: {
          amount: singleTransaction.amount,
          type: singleTransaction.type,
          accountId: singleTransaction.accountId,
          userId: singleTransaction.userId,
          category: singleTransaction.category,
          date: new Date(),
          isRecurring: false,
          description: `${singleTransaction.description} (Recurring)`,
        },
      });

      const balanceChange =
        singleTransaction.type === "EXPENSE"
          ? -singleTransaction.amount.toNumber()
          : singleTransaction.amount.toNumber();

      await tx.account.update({
        where: {
          id: singleTransaction.accountId,
        },
        data: {
          balance: {
            increment: balanceChange,
          },
        },
      });

      await tx.transaction.update({
        where: {
          id: singleTransaction.id,
        },
        data: {
          lastProcessed: new Date(),
          nextRecurringDate: calculateNextRecurringDate(
            new Date(),
            singleTransaction.recurringInterval
          ),
        },
      });
    });
  }
};

function isTransactionDue(transaction) {
  // if (!transaction.lastProcessed) return true;

  const today = new Date();
  const nextDueDate = new Date(transaction.nextRecurringDate);

  // Compare with next due date
  return nextDueDate <= today;
}

function calculateNextRecurringDate(date, interval) {
  const nextDate = new Date(date);

  switch (interval) {
    case "DAILY":
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case "WEEKLY":
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case "MONTHLY":
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case "YEARLY":
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
  }

  return nextDate;
}

async function getMonthlyStats(userId, month) {
  const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
  const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const transactions = await db.transaction.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });
  return transactions.reduce(
    (acc, t) => {
      if (t.type === "INCOME") {
        acc.totalIncome += t.amount.toNumber();
      } else {
        acc.totalExpenses += t.amount.toNumber();
        acc.byCategory[t.category] =
          (acc.byCategory[t.category] || 0) + t.amount.toNumber();
      }
      return acc;
    },
    {
      totalIncome: 0,
      totalExpenses: 0,
      byCategory: {},
      transactionCount: transactions.length,
    }
  );
}
async function generateFinancialInsights(stats, month) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Analyze this financial data and provide 3 concise, actionable insights.
    Focus on spending patterns and practical advice.
    Keep it friendly and conversational.

    Financial Data for ${month}:
    - Total Income: $${stats.totalIncome}
    - Total Expenses: $${stats.totalExpenses}
    - Net Income: $${stats.totalIncome - stats.totalExpenses}
    - Expense Categories: ${Object.entries(stats.byCategory)
      .map(([category, amount]) => `${category}: $${amount}`)
      .join(", ")}

    Format the response as a JSON array of strings, like this:
    ["insight 1", "insight 2", "insight 3"]
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Error generating insights:", error);
    return [
      "Your highest expense category this month might need attention.",
      "Consider setting up a budget for better financial management.",
      "Track your recurring expenses to identify potential savings.",
    ];
  }
}

export const generateMonthlyReports = async () => {
  const users = await db.user.findMany({
    include: { accounts: true },
  });

  for (const user of users) {
    if (
      user.lastMonthlyAlertSent &&
      !isNewMonth(new Date(user.lastMonthlyAlertSent), new Date())
    ) {
      continue;
    }

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const stats = await getMonthlyStats(user.id, lastMonth);
    const monthName = lastMonth.toLocaleString("default", {
      month: "long",
    });

    // Generate AI insights
    const insights = await generateFinancialInsights(stats, monthName);

    await db.user.update({
      where: {
        id: user.id,
      },
      data: {
        lastMonthlyAlertSent: new Date(),
      },
    });

    await sendEmail({
      to: user.email,
      subject: `Your Monthly Financial Report - ${monthName}`,
      react: EmailTemplate({
        userName: user.name,
        type: "monthly-report",
        data: {
          stats,
          month: monthName,
          insights,
        },
      }),
    });
  }

  return { processed: users.length };
};

function isNewMonth(lastAlertDate, currentDate) {
  return (
    lastAlertDate.getMonth() !== currentDate.getMonth() ||
    lastAlertDate.getFullYear() !== currentDate.getFullYear()
  );
}
