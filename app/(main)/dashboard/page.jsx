import React from "react";
import CreateAccountDrawer from "@/components/CreateAccountDrawer";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { getUserAccounts } from "@/actions/dashboard";
import AccountCard from "./_components/AccountCard";
import { getCurrentBudget } from "@/actions/budget";

const DashboardPage = async () => {
  const accounts = await getUserAccounts();
  const defaultAccount = accounts?.find((t) => t.isDefault);

  let budgetData = "";
  if (defaultAccount) {
    budgetData = await getCurrentBudget(defaultAccount.id);
  }
  console.log(budgetData);
  return (
    <div className="px-5">
      {/* Budget Progress  */}
      {defaultAccount && (
        <BudgetProgress
          budget={budgetData?.budget}
          currentExpenses={budgetData?.currentExpenses  ||0 }
        />
      )}
      {/* Dashboard Overview */}
      {/* Accounts Grid  */}
      <div className="grid  md:grid-cols-2 lg:grid-cols-3 gap-4">
        <CreateAccountDrawer>
          <Card className="hover:shadow-md transition-shadow duration-300 ease-out cursor-pointer border-dashed">
            <CardContent className="flex flex-col items-center justify-center text-muted-foreground h-full pt-5">
              <Plus className="h-10 w-10 mb-2" />
              <p className="text-sm font-medium">Add New Account</p>
            </CardContent>
          </Card>
        </CreateAccountDrawer>

        {accounts?.length > 0 &&
          accounts?.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
      </div>
    </div>
  );
};

export default DashboardPage;
