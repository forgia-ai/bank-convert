// app/(dashboard)/settings/page.tsx
"use client" // Tabs component requires client-side interactivity

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator" // For visual separation

// Placeholder for Clerk's userProfile component or similar functionalities
// For now, we'll create basic forms and placeholders

export default function SettingsPage() {
  // Simulated user data for placeholders
  const user = {
    fullName: "Demo User",
    email: "demo@example.com",
  }

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
      <p className="text-muted-foreground mb-8">
        Manage your account settings, subscription, and security preferences.
      </p>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="subscription">Subscription & Billing</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" defaultValue={user.fullName} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" defaultValue={user.email} disabled />
                <p className="text-xs text-muted-foreground">
                  Email address cannot be changed here. Contact support if needed.
                </p>
              </div>
              <Button>Save Profile</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription">
          <Card>
            <CardHeader>
              <CardTitle>Subscription & Billing</CardTitle>
              <CardDescription>Manage your current plan and billing details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">Current Plan: Free</h3>
                <p className="text-sm text-muted-foreground">
                  You are currently on the Free plan.
                </p>
                <Button variant="outline" className="mt-2">
                  Upgrade Plan
                </Button>
              </div>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold">Payment Method</h3>
                <p className="text-sm text-muted-foreground">No payment method on file.</p>
                <Button variant="outline" className="mt-2">
                  Add Payment Method
                </Button>
              </div>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold">Billing History</h3>
                <p className="text-sm text-muted-foreground">No billing history yet.</p>
                {/* Placeholder for billing history items */}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Manage your password and account security.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" type="password" />
              </div>
              <Button>Change Password</Button>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold">Two-Factor Authentication (2FA)</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Enhance your account security by enabling 2FA.
                </p>
                <Button variant="outline">Enable 2FA (Coming Soon)</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
