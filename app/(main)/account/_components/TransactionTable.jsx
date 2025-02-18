"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  Search,
  Trash,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectTrigger,
} from "@/components/ui/select";
import { useFetch } from "@/hooks/useFetch";
import { bulkDeleteTransactions } from "@/actions/accounts";
import { toast } from "sonner";

import { BarLoader } from "react-spinners";

const RECURRING_INTERVALS = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};
const TransactionTable = ({ transactions }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [recurringFilter, setRecurringFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [page, setPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({
    field: "date",
    direction: "desc",
  });
  const router = useRouter();
  const {
    error,
    data: deleted,
    loading: deleteLoading,
    fn: deleteFn,
  } = useFetch(bulkDeleteTransactions);

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

  const handleSelectAll = () => {
    selectedIds.length === filterAndSortedTransactions.length
      ? setSelectedIds([])
      : setSelectedIds(filterAndSortedTransactions.map((t) => t.id));
  };

  const handleBulkDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedIds.length} transactions?`
      )
    )
      return;

    await deleteFn(selectedIds);
    setSelectedIds([]);
  };

  useEffect(() => {
    if (!deleteLoading && deleted) {
      toast.success("Transactions deleted");
     
    }
  }, [deleteLoading, deleted]);

  useEffect(() => {
    if (error && !deleteLoading) toast.error(error);
  }, [error, deleteLoading]);
  const handleClearFilters = () => {
    setSearchTerm("");
    setTypeFilter("");
    setRecurringFilter("");
    setSelectedIds([]);
  };
  let filterAndSortedTransactions = useMemo(() => {
    let filteredTransactions = transactions;
    // search filter
    if (searchTerm) {
      filteredTransactions = filteredTransactions.filter((t) =>
        Object.keys(t).some((key) =>
          t[key]?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    // type filter
    if (typeFilter) {
      filteredTransactions = filteredTransactions.filter(
        (t) => t.type === typeFilter
      );
    }
    // recurringFilter
    if (recurringFilter) {
      const isRecurring = recurringFilter === "recurring" ? true : false;
      filteredTransactions = filteredTransactions.filter(
        (t) => t.isRecurring === isRecurring
      );
    }

    // apply sorting
    filteredTransactions.sort((a, b) => {
      if (sortConfig.field === "date") {
        return sortConfig.direction === "asc"
          ? new Date(a.date) - new Date(b.date)
          : new Date(b.date) - new Date(a.date);
      } else if (sortConfig.field === "amount") {
        return sortConfig.direction === "asc"
          ? a.amount - b.amount
          : b.amount - a.amount;
      } else if (sortConfig.field === "category") {
        return sortConfig.direction === "asc"
          ? a.category.localeCompare(b.category)
          : b.category.localeCompare(a.category);
      }
      return 0;
    });
    return filteredTransactions;
  }, [
    transactions,
    searchTerm,
    typeFilter,
    recurringFilter,
    sortConfig.direction,
    sortConfig.field,
  ]);
  const totalPages = Math.ceil(filterAndSortedTransactions.length / 10);
  console.log(filterAndSortedTransactions)
  return (
    <div className="space-y-4">
      {deleteLoading && (
        <BarLoader className="mt-4" width={"100%"} color="#9333ea" />
      )}
      <div className="flex sm:flex-row flex-col">
        <div className="relative flex flex-col sm:flex-row gap-4 flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search transactions"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value.trim())}
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={typeFilter}
            onValueChange={(val) => setTypeFilter(val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INCOME">Income</SelectItem>
              <SelectItem value="EXPENSE">Expense</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={recurringFilter}
            onValueChange={(val) => setRecurringFilter(val)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Transaction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recurring">Recurring </SelectItem>
              <SelectItem value="non-recurring">Non-recurring</SelectItem>
            </SelectContent>
          </Select>
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleBulkDelete}
                variant="destructive"
              >
                <Trash className="h-4 w-4 mr-2" />
                Delete Selected ({selectedIds.length})
              </Button>
            </div>
          )}
        </div>
        {[searchTerm, typeFilter, recurringFilter].some(
          (filter) => filter !== "" && filter
        ) && (
          <div>
            <Button
              title="Clear Filters"
              variant="outline"
              size="icon"
              onClick={handleClearFilters}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
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
              filterAndSortedTransactions
                .slice(page * 10 - 10, page * 10)
                .map((transaction) => (
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
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(
                                `/transaction/create?edit=${transaction.id}`
                              )
                            }
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={async () =>
                              await deleteFn([transaction.id])
                            }
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
      <div className="flex justify-center items-center space-x-2">
        <Button
          className="hover:cursor-pointer disabled:cursor-not-allowed
          disabled:pointer-events-none
          "
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          variant="outline"
        >
          Prev
        </Button>

        <span>
          {`${page} of 
          ${totalPages}`}
        </span>

        <Button
          className="hover:cursor-pointer disabled:cursor-not-allowed  disabled:pointer-events-none"
          onClick={() => setPage(page + 1)}
          disabled={page === totalPages}
          variant="outline"
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default TransactionTable;
