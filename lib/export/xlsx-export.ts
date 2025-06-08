/**
 * XLSX export utilities for transaction data
 * Converts transaction data to Excel format with proper formatting
 */

import ExcelJS from "exceljs"

// Common transaction interface used by both preview and full transaction data
export interface TransactionForExport {
  date: string
  description: string
  amount: number
  currency?: string
  type?: string
}

export interface ExportOptions {
  filename?: string
  sheetName?: string
  includeHeader?: boolean
  columnHeaders?: {
    date: string
    description: string
    amount: string
    currency: string
    type: string
  }
}

/**
 * Generates an XLSX file from transaction data and triggers download
 */
export async function exportTransactionsToXLSX(
  transactions: TransactionForExport[],
  options: ExportOptions = {},
): Promise<void> {
  const {
    filename = "bank-statement-transactions.xlsx",
    sheetName = "Transactions",
    includeHeader = true,
    columnHeaders = {
      date: "Date",
      description: "Description",
      amount: "Amount",
      currency: "Currency",
      type: "Type",
    },
  } = options

  // Create a new workbook and worksheet
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet(sheetName)

  // Set up column headers and widths (using i18n headers)
  const columns = [
    { header: columnHeaders.date, key: "date", width: 12 },
    { header: columnHeaders.description, key: "description", width: 40 },
    { header: columnHeaders.amount, key: "amount", width: 15 },
    { header: columnHeaders.currency, key: "currency", width: 10 },
    { header: columnHeaders.type, key: "type", width: 10 },
  ]

  worksheet.columns = columns

  // Style the header row if included
  if (includeHeader) {
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE6F2FF" }, // Light blue background
    }
    worksheet.getRow(1).border = {
      bottom: { style: "thin", color: { argb: "FF000000" } },
    }
  }

  // Add transaction data
  transactions.forEach((transaction, index) => {
    const rowNumber = includeHeader ? index + 2 : index + 1
    const row = worksheet.getRow(rowNumber)

    // Set cell values
    row.getCell(1).value = transaction.date
    row.getCell(2).value = transaction.description
    row.getCell(3).value = transaction.amount
    row.getCell(4).value = transaction.currency || ""
    row.getCell(5).value = transaction.type || ""

    // Format the amount cell
    const amountCell = row.getCell(3)
    amountCell.numFmt = "#,##0.00"

    // Color code amounts (red for negative, green for positive)
    if (transaction.amount < 0) {
      amountCell.font = { color: { argb: "FFDC3545" } } // Red for debits/negative
    } else if (transaction.amount > 0) {
      amountCell.font = { color: { argb: "FF28A745" } } // Green for credits/positive
    }

    // Add alternating row colors for better readability
    if (index % 2 === 1) {
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF8F9FA" }, // Very light gray
      }
    }
  })

  // Auto-fit columns (except description which we set manually)
  worksheet.columns.forEach((column, index) => {
    if (index !== 1) {
      // Don't auto-fit description column
      column.width = Math.max(column.width || 10, 10)
    }
  })

  // Add borders to all cells with data
  const lastRow = includeHeader ? transactions.length + 1 : transactions.length
  const range = worksheet.getCell(1, 1).address + ":" + worksheet.getCell(lastRow, 5).address
  worksheet.getCell(range).border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  }

  // Apply borders to the entire data range
  for (let row = 1; row <= lastRow; row++) {
    for (let col = 1; col <= 5; col++) {
      const cell = worksheet.getCell(row, col)
      cell.border = {
        top: { style: "thin", color: { argb: "FFD1D3D4" } },
        left: { style: "thin", color: { argb: "FFD1D3D4" } },
        bottom: { style: "thin", color: { argb: "FFD1D3D4" } },
        right: { style: "thin", color: { argb: "FFD1D3D4" } },
      }
    }
  }

  // Generate the XLSX file buffer
  const buffer = await workbook.xlsx.writeBuffer()

  // Create blob and trigger download
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })

  // Create download link and trigger download
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Helper function to generate a filename with current date
 */
export function generateXLSXFilename(baseFilename?: string, includeDate: boolean = true): string {
  const base = baseFilename || "bank-statement"
  const cleanBase = base.replace(/\.[^/.]+$/, "") // Remove existing extension

  if (includeDate) {
    const now = new Date()
    const dateStr = now.toISOString().split("T")[0] // YYYY-MM-DD format
    return `${cleanBase}-${dateStr}.xlsx`
  }

  return `${cleanBase}.xlsx`
}
