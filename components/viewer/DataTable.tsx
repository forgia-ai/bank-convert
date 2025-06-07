import React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatAmountWithSign, formatDateForLocale } from "@/lib/upload/locale-formatting"
import type { Locale } from "@/i18n-config"

interface Transaction {
  date: string
  description: string
  amount: number
  currency?: string
  type?: string
  originalType?: "credit" | "debit"
}

interface ColumnLabels {
  date: string
  description: string
  amount: string
  currency: string
  type: string
}

interface TransactionCountStrings {
  singular: string
  plural: string
}

export type { ColumnLabels, TransactionCountStrings }

interface DataTableProps {
  data?: Transaction[]
  columns?: ColumnLabels
  transactionCountStrings?: TransactionCountStrings
  customFooterMessage?: string // New prop for custom footer message
  locale?: Locale // Locale for formatting amounts and dates
}

const defaultData: Transaction[] = [
  {
    date: "2024-01-15",
    description: "Coffee Shop",
    amount: -5.75,
    currency: "USD",
    type: "Debit",
    originalType: "debit",
  },
  {
    date: "2024-01-16",
    description: "Salary Deposit",
    amount: 2500,
    currency: "USD",
    type: "Credit",
    originalType: "credit",
  },
  {
    date: "2024-01-17",
    description: "Online Shopping",
    amount: -78.99,
    currency: "USD",
    type: "Debit",
    originalType: "debit",
  },
  {
    date: "2024-01-18",
    description: "Groceries",
    amount: -120.5,
    currency: "USD",
    type: "Debit",
    originalType: "debit",
  },
  {
    date: "2024-01-19",
    description: "Rent Payment",
    amount: -1500,
    currency: "USD",
    type: "Debit",
    originalType: "debit",
  },
]

const defaultColumns: ColumnLabels = {
  date: "Date",
  description: "Description",
  amount: "Amount",
  currency: "Currency",
  type: "Type",
}

const defaultTransactionCountStrings: TransactionCountStrings = {
  singular: "1 transaction found.",
  plural: "{count} transactions found.",
}

const DataTable: React.FC<DataTableProps> = ({
  data = defaultData,
  columns = defaultColumns,
  transactionCountStrings = defaultTransactionCountStrings,
  customFooterMessage,
  locale = "en",
}) => {
  // Helper function to format amount using locale-aware formatting
  const formatAmount = (amount: number) => {
    const standardizedAmount = amount.toFixed(2) // Convert to standardized format
    return formatAmountWithSign(standardizedAmount, locale)
  }

  // Helper function to format date using locale-aware formatting
  const formatDate = (dateString: string) => {
    // The date is expected to be in ISO format (YYYY-MM-DD)
    return formatDateForLocale(dateString, locale)
  }

  // Helper function to get amount color based on positive/negative
  const getAmountColor = (amount: number) => {
    return amount >= 0 ? "text-green-600" : "text-red-600"
  }

  // Helper function to format transaction count text
  const formatTransactionCount = (count: number) => {
    if (count === 1) {
      return transactionCountStrings.singular
    } else {
      return transactionCountStrings.plural.replace("{count}", count.toString())
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Fixed table header */}
      <div className="bg-muted/50 border-b">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold w-[120px]">{columns.date}</TableHead>
              <TableHead className="font-semibold min-w-[200px]">{columns.description}</TableHead>
              <TableHead className="text-right font-semibold w-[120px]">
                {columns.amount}
              </TableHead>
              <TableHead className="font-semibold w-[100px]">{columns.currency}</TableHead>
              <TableHead className="font-semibold w-[100px]">{columns.type}</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      </div>

      {/* Scrollable table body */}
      <div className="max-h-[70vh] overflow-y-auto">
        <Table>
          <TableBody>
            {data.map((transaction, index) => (
              <TableRow key={index} className="hover:bg-muted/30">
                <TableCell className="font-medium w-[120px]">
                  {formatDate(transaction.date)}
                </TableCell>
                <TableCell className="min-w-[200px]">{transaction.description}</TableCell>
                <TableCell
                  className={`text-right font-medium w-[120px] ${getAmountColor(transaction.amount)}`}
                >
                  {formatAmount(transaction.amount)}
                </TableCell>
                <TableCell className="w-[100px]">{transaction.currency || "N/A"}</TableCell>
                <TableCell className="w-[100px]">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      transaction.originalType === "credit"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {transaction.type || "N/A"}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Fixed footer with transaction count or custom message */}
      <div className="bg-muted/20 border-t px-4 py-2 text-center">
        <p className="text-sm text-muted-foreground">
          {customFooterMessage || formatTransactionCount(data.length)}
        </p>
      </div>
    </div>
  )
}

export default DataTable
