// components/dashboard/transaction-table.tsx
"use client"

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge" // For transaction type or status
import { cn } from "@/lib/utils" // For conditional class names

export interface Transaction {
  id: string
  date: string // Or Date object, formatted later
  description: string
  amount: number
  currency: string // e.g., "USD", "EUR"
  type: "income" | "expense" | "transfer" // Or more specific types
  category?: string // Optional category
}

interface TransactionTableProps {
  transactions: Transaction[]
  caption?: string
}

export function TransactionTable({
  transactions,
  caption = "Recent Transactions",
}: TransactionTableProps) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="p-4 border rounded-lg bg-card shadow-sm text-center">
        <p className="text-sm text-muted-foreground">
          No transactions to display yet. Process a file to see results.
        </p>
      </div>
    )
  }

  const formatCurrency = (amount: number, currencyCode: string) => {
    return new Intl.NumberFormat("en-US", {
      // TODO: Make locale dynamic later
      style: "currency",
      currency: currencyCode,
    }).format(amount)
  }

  return (
    <Table>
      <TableCaption>{caption}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[120px]">Date</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="w-[150px]">Category</TableHead>
          <TableHead className="w-[100px]">Type</TableHead>
          <TableHead className="text-right w-[150px]">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => (
          <TableRow key={transaction.id}>
            <TableCell className="font-medium">
              {new Date(transaction.date).toLocaleDateString("en-US", {
                // TODO: Make locale dynamic
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </TableCell>
            <TableCell>{transaction.description}</TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {transaction.category || "N/A"}
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  transaction.type === "income"
                    ? "default"
                    : transaction.type === "expense"
                      ? "destructive"
                      : "secondary"
                }
                className={cn(
                  transaction.type === "income" && "bg-green-600 hover:bg-green-700 text-white",
                )}
              >
                {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
              </Badge>
            </TableCell>
            <TableCell
              className={cn(
                "text-right font-medium",
                transaction.type === "income"
                  ? "text-green-600"
                  : transaction.type === "expense"
                    ? "text-destructive"
                    : "",
              )}
            >
              {transaction.type === "expense" ? "-" : ""}
              {formatCurrency(transaction.amount, transaction.currency)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
