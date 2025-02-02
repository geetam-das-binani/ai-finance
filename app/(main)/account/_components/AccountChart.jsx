"use client";
import {
  Card,
  CardContent,
  
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Select, SelectItem } from "@/components/ui/select";
import { SelectContent, SelectTrigger } from "@radix-ui/react-select";
import { endOfDay, format, startOfDay, subDays } from "date-fns";
import React, { useState, useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const DATE_RANGES = {
  "7D": { label: "Last 7 Days", days: 7 },
  "1M": { label: "Last Month", days: 30 },
  "3M": { label: "Last 3 Months", days: 90 },
  "6M": { label: "Last 3 Months", days: 180 },
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

  const totals = useMemo(() => {
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
      <CardHeader>
        <CardTitle> Transaction Overview</CardTitle>
        <Select>
            <SelectTrigger></SelectTrigger>
            <SelectContent>
                <SelectItem value="7D">Last 7 Days</SelectItem>
                
            </SelectContent>
        </Select>
      </CardHeader>
      <CardContent></CardContent>

      {/* <ResponsiveContainer width="100%" height="100%">
        <BarChart
          width={500}
          height={300}
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar
            dataKey="pv"
            fill="#8884d8"
            activeBar={<Rectangle fill="pink" stroke="blue" />}
          />
          <Bar
            dataKey="uv"
            fill="#82ca9d"
            activeBar={<Rectangle fill="gold" stroke="purple" />}
          />
        </BarChart>
      </ResponsiveContainer> */}
    </Card>
  );
};

export default AccountChart;
