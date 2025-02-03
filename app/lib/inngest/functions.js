import { db } from "@/lib/prisma";
import { inngest } from "./client";

export const helloWorld = inngest.createFunction(
  { name: "Check Budget Alerts" },
  { cron: "0 */6 * * *" },
  async ({ step }) => {
    const budgets = step.run("get-budget", async () => {
      return await db.budget.findMany({
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
    });

    for (const budget of budgets) {
      const defaultAccount = budget.user.accounts[0];
      if (defaultAccount.balance >= budget.amount) {
        await step.sendEvent("budget-alert", {
          data: {
            userId: budget.userId,
            budgetId: budget.id,
            amount: budget.amount,
            balance: defaultAccount.balance,
          },
          user: budget.userId,
        });
      }
    }
  }
);
