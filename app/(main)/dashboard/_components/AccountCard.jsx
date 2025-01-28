"use client";
import { updateDefaultAccount } from "@/actions/accounts";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useFetch } from "@/hooks/useFetch";
import { ArrowDownRight, ArrowRight } from "lucide-react";
import Link from "next/link";
import React, { useEffect } from "react";
import { toast } from "sonner";

const AccountCard = ({ account }) => {
  const { name, type, balance, id, isDefault } = account;

  const {
    loading: updateDefaultLoading,
    fn: updateDefaultFn,
    error,
    data: updatedAccount,
  } = useFetch(updateDefaultAccount);

  const handleDefaultChange = async (e) => {
    e.preventDefault();

    if (isDefault) {
      toast.warning("You need atleast one default account");
      return;
    }
    await updateDefaultFn(id);
  };

  useEffect(() => {
    if (updatedAccount && !updateDefaultLoading) {
      toast.success("Default Account Updated");
    }
  }, [updateDefaultLoading, updatedAccount]);

  useEffect(() => {
    if (error && !updateDefaultLoading) {
      toast.error(error);
    }
  }, [updateDefaultLoading, error]);
  return (
    <Card className="hover:shadow-md transition-shadow group relative">
      <Link href={`/account/${id}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium capitalize">
            {name}
          </CardTitle>
          <Switch
            onClick={handleDefaultChange}
            disabled={updateDefaultLoading}
            checked={isDefault}
          />
        </CardHeader>
        <CardContent className="">
          <div className="text-2xl font-bold">
            ${parseFloat(balance).toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            {type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()} Account
          </p>
        </CardContent>
        <CardFooter className="flex justify-between text-sm text-muted-foreground">
          <div className="flex items-center">
            <ArrowRight className="mr-1 h-4 w-4 text-green-500" />
            Income
          </div>
          <div className="flex items-center">
            <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
            Expenses
          </div>
        </CardFooter>
      </Link>
    </Card>
  );
};

export default AccountCard;
