"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { categoryColors } from "@/data/categories";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

const TransactionTable = ({ transactions }) => {
  let filterAndSortedTransactions = transactions;
  const handleSort = () => {};
  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableCaption>A list of your recent invoices.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox />
              </TableHead>
              <TableHead
                onClick={() => handleSort("date")}
                className="cursor-pointer"
              >
                <div className="flex items-center">Date</div>
              </TableHead>
              <TableHead>Description</TableHead>{" "}
              <TableHead
                onClick={() => handleSort("category")}
                className="cursor-pointer"
              >
                <div className="flex items-center"> Category</div>
              </TableHead>
              <TableHead
                onClick={() => handleSort("amount")}
                className="cursor-pointer"
              >
                <div className="flex items-center justify-end"> Amount </div>
              </TableHead>
              <TableHead>Recurring</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {!filterAndSortedTransactions.length ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground"
                >
                  No Transactions Found
                </TableCell>
              </TableRow>
            ) : (
              filterAndSortedTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <Checkbox />
                  </TableCell>
                  <TableCell>
                    {format(new Date(transaction.date), "PP")}
                  </TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell className="capitalize">
                    <span
                      style={{
                        background: categoryColors[transaction.category],
                      }}
                      className="px-2 py-1 text-sm text-white rounded-lg"
                    >
                      {transaction.category}
                    </span>
                  </TableCell>
                  <TableCell
                    style={{
                      color: transaction.type === "INCOME" ? "green" : "red",
                    }}
                    className="text-right font-medium"
                  >
                    {transaction.type === "INCOME" ? "+" : "-"}$
                    {transaction.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {transaction.isRecurring ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>Hover</TooltipTrigger>
                          <TooltipContent>
                            <p>Add to library</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <Badge variant={"outline"} className="gap-1 p-1">
                        <Clock className="h-3 w-3"/>
                        One-time
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TransactionTable;
