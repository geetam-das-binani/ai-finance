"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { endOfDay, format, startOfDay, subDays } from "date-fns";
import React, { useState, useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Rectangle,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const DATE_RANGES = {
  "7D": { label: "Last 7 Days", days: 7 },
  "1M": { label: "Last Month", days: 30 },
  "3M": { label: "Last 3 Months", days: 90 },
  "6M": { label: "Last 6 Months", days: 180 },
  ALL: { label: "All Time", days: null },
};
const AccountChart = ({ transactions }) => {
  const [dateRange, setDateRange] = useState("1M");

  const filteredData = useMemo(() => {
    const range = DATE_RANGES[dateRange];
    const now = new Date();
    // const startDate = new Date(
    //   now.getFullYear(),
    //   now.getMonth(),
    //   now.getDate() - range.days
    // );
    // return transactions.filter((transaction) => {
    //   return transaction.date >= startDate && transaction.date <= now;
    // });

    const startDate = range.days
      ? startOfDay(subDays(now, range.days))
      : startOfDay(new Date(0));
    const filtered = transactions.filter(
      (transaction) =>
        new Date(transaction.date) >= startDate &&
        new Date(transaction.date) <= endOfDay(now)
    );
    const grouped = filtered.reduce((acc, t) => {
      const date = format(new Date(t.date), "MMM dd");
      if (!acc[date]) {
        acc[date] = {
          date,
          expense: 0,
          income: 0,
        };
      }

      if (t.type === "INCOME") {
        acc[date].income += parseFloat(t.amount);
      } else {
        acc[date].expense += parseFloat(t.amount);
      }
      return acc;
    }, {});

    return Object.values(grouped).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
  }, [dateRange, transactions]);

  const total = useMemo(() => {
    return filteredData.reduce(
      (acc, t) => ({
        expense: acc.expense + t.expense,
        income: acc.income + t.income,
      }),
      { expense: 0, income: 0 }
    );
  }, [dateRange, transactions]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
        <CardTitle className="text-base font-normal">
          Transaction Overview
        </CardTitle>
        <Select defaultValue={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(DATE_RANGES).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-muted-foreground">Total Income</p>
          <p className="text-lg font-bold text-green-500">
            ${total.income.toFixed(2)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-muted-foreground">Total Expenses</p>
          <p className="text-lg font-bold text-red-500">
            ${total.expense.toFixed(2)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-muted-foreground">Net</p>
          <p className="text-lg font-bold text-green-500">
            ${(total.income - total.expense).toFixed(2)}
          </p>
        </div>
      </CardContent>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
          
            data={filteredData}
            margin={{
              top: 10,
              right: 10,
              left: 10,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" />
            <YAxis
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${value}`} 
            />
            <Tooltip formatter={(value) => [`$${value}`,undefined]}  />
            <Legend />
            <Bar
              dataKey="income"
              fill="#22c55e"
              radius={[4,4,0,0]}
              
            />
            <Bar
              dataKey="expense"
              fill="#ef4444"
              radius={[4,4,0,0]}
              
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default AccountChart;
