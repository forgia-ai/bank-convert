// app/(dashboard)/billing/page.tsx
"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress" // For usage display
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CreditCard, Download, FileText, AlertTriangle } from "lucide-react"

// Simulated data for billing page
const currentPlan = {
  name: "Growth Plan",
  price: "$13.33/month",
  period: "Monthly",
  pageLimit: 500,
  pagesUsed: 120,
  nextBillingDate: "June 1, 2025",
  status: "Active",
}

const paymentMethod = {
  type: "Visa",
  last4: "4242",
  expiry: "12/2028",
}

const billingHistory = [
  { id: "inv-003", date: "May 1, 2025", amount: "$13.33", status: "Paid", plan: "Growth Plan" },
  { id: "inv-002", date: "April 1, 2025", amount: "$13.33", status: "Paid", plan: "Growth Plan" },
  { id: "inv-001", date: "March 1, 2025", amount: "$13.33", status: "Paid", plan: "Growth Plan" },
]

export default function BillingPage() {
  const usagePercentage = (currentPlan.pagesUsed / currentPlan.pageLimit) * 100

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Billing & Subscription</h1>
      <p className="text-muted-foreground mb-8">
        Manage your subscription, view billing history, and update payment methods.
      </p>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Current Plan Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Current Subscription</CardTitle>
            <div className="flex items-center justify-between">
              <CardDescription>Overview of your active plan and usage.</CardDescription>
              <Badge variant={currentPlan.status === "Active" ? "default" : "destructive"}>
                {currentPlan.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-baseline">
              <h3 className="text-2xl font-semibold">{currentPlan.name}</h3>
              <p className="text-lg font-medium text-muted-foreground">{currentPlan.price}</p>
            </div>

            <div>
              <div className="flex justify-between text-sm text-muted-foreground mb-1">
                <span>Page Usage</span>
                <span>
                  {currentPlan.pagesUsed} / {currentPlan.pageLimit} pages
                </span>
              </div>
              <Progress value={usagePercentage} className="h-2" />
              {usagePercentage > 85 && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start text-sm text-yellow-700">
                  <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                  You are approaching your monthly page limit. Consider upgrading to avoid service
                  interruptions.
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Your plan renews on {currentPlan.nextBillingDate}.
            </p>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline">Change Plan</Button>
            <Button variant="destructive" disabled>
              Cancel Subscription
            </Button>
          </CardFooter>
        </Card>

        {/* Payment Method Card */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>Your primary payment method.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {paymentMethod ? (
              <div className="flex items-center gap-3 p-3 border rounded-md bg-muted/30">
                <CreditCard className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">
                    {paymentMethod.type} ending in {paymentMethod.last4}
                  </p>
                  <p className="text-sm text-muted-foreground">Expires {paymentMethod.expiry}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No payment method on file.</p>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              {paymentMethod ? "Update Payment Method" : "Add Payment Method"}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Separator className="my-8" />

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>Review your past invoices and payments.</CardDescription>
        </CardHeader>
        <CardContent>
          {billingHistory.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billingHistory.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.id}</TableCell>
                    <TableCell>{invoice.date}</TableCell>
                    <TableCell>{invoice.plan}</TableCell>
                    <TableCell>{invoice.amount}</TableCell>
                    <TableCell>
                      <Badge variant={invoice.status === "Paid" ? "default" : "secondary"}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" title="Download Invoice">
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg">
              <FileText className="h-12 w-12 text-muted-foreground mb-3" />
              <h3 className="text-lg font-semibold mb-1">No Billing History</h3>
              <p className="text-sm text-muted-foreground">
                Your invoices will appear here once you make payments.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
