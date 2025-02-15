import { getUserAccounts } from "@/actions/dashboard";
import { defaultCategories } from "@/data/categories";
import React from "react";
import AddTransactionForm from "./_components/AddTransactionForm";
import { Toaster } from "sonner";

const AddTransaction = async () => {
  const accounts = await getUserAccounts();
  return (
    <div className="max-w-3xl mx-auto px-5">
      <h1 className="text-5xl  mb-8 gradient-title text-center">
        Add Transaction
      </h1>

      <AddTransactionForm accounts={accounts} categories={defaultCategories} />
      <Toaster richColors />
    </div>
  );
};

export default AddTransaction;
