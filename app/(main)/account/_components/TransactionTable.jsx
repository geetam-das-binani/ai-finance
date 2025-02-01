"use client";

import React, { useState } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { categoryColors } from "@/data/categories";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  MoreHorizontal,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const RECURRING_INTERVALS = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};
const TransactionTable = ({ transactions }) => {
  let filterAndSortedTransactions = transactions;
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    field: "date",
    direction: "asc",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [recurringFilter, setRecurringFilter] = useState("");
  const router = useRouter();
  const handleSort = (field) => {
    sortConfig.field === field
      ? setSortConfig({
          field,
          direction: sortConfig.direction === "asc" ? "desc" : "asc",
        })
      : setSortConfig({ field, direction: "asc" });
  };

  const handleSelect = (id) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((i) => i !== id) : [...current, id]
    );
  };
  console.log(selectedIds);
  const handleSelectAll = () => {
    selectedIds.length === filterAndSortedTransactions.length
      ? setSelectedIds([])
      : setSelectedIds(filterAndSortedTransactions.map((t) => t.id));
  };
  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableCaption>A list of your recent invoices.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  onCheckedChange={handleSelectAll}
                  checked={
                    selectedIds.length === filterAndSortedTransactions.length &&
                    filterAndSortedTransactions.length > 0
                  }
                />
              </TableHead>
              <TableHead
                onClick={() => handleSort("date")}
                className="cursor-pointer"
              >
                <div className="flex items-center">
                  Date
                  {sortConfig.field === "date" &&
                    (sortConfig.direction === "asc" ? (
                      <ChevronUp className="ml-2" />
                    ) : (
                      <ChevronDown className="ml-2" />
                    ))}
                </div>
              </TableHead>
              <TableHead>Description</TableHead>{" "}
              <TableHead
                onClick={() => handleSort("category")}
                className="cursor-pointer"
              >
                <div className="flex items-center">
                  {" "}
                  Category
                  {sortConfig.field === "category" &&
                    (sortConfig.direction === "asc" ? (
                      <ChevronUp className="ml-2" />
                    ) : (
                      <ChevronDown className="ml-2" />
                    ))}
                </div>
              </TableHead>
              <TableHead
                onClick={() => handleSort("amount")}
                className="cursor-pointer"
              >
                <div className="flex items-center justify-end">
                  {" "}
                  Amount
                  {sortConfig.field === "amount" &&
                    (sortConfig.direction === "asc" ? (
                      <ChevronUp className="ml-2" />
                    ) : (
                      <ChevronDown className="ml-2" />
                    ))}
                </div>
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
                    <Checkbox
                      onCheckedChange={() => handleSelect(transaction.id)}
                      checked={selectedIds.includes(transaction.id)}
                    />
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
                          <TooltipTrigger>
                            <Badge
                              variant={"outline"}
                              className="gap-1 bg-purple-100 text-purple-700 hover:bg-purple-200"
                            >
                              <RefreshCw className="h-3 w-3" />
                              {
                                RECURRING_INTERVALS[
                                  transaction.recurringInterval
                                ]
                              }
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div>
                              <div className="font-medium">Next Date:</div>
                              <div className="text-sm">
                                {format(
                                  new Date(transaction.nextRecurringDate),
                                  "PP"
                                )}
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <Badge variant={"outline"} className="gap-1 p-1">
                        <Clock className="h-3 w-3" />
                        One-time
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="p-0 w-8 h-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuLabel
                          onClick={() =>
                            router.push(
                              `/transaction/create?edit${transaction.id}`
                            )
                          }
                        >
                          Edit
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={() => {}}
                          className="text-destructive"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
