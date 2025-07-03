# Subscription Testing Scripts

This directory contains scripts for testing and managing user subscriptions without going through Stripe payments.

**Default User ID:** `user_2xXeIhp0iMJeS5C9wXYfeZxIkMt` (used when no USER_ID provided)

## 🧰 Available Scripts

### 1. 📊 Check User Status
```bash
yarn tsx scripts/check-user-status.ts [USER_ID]
```
**Purpose:** Display current subscription status, plan details, and usage information.

**Examples:**
```bash
# Use default admin user
yarn tsx scripts/check-user-status.ts

# Use specific user ID
yarn tsx scripts/check-user-status.ts user_abc123
```

**Example Output:**
```
🎯 Using default admin user: user_2xXeIhp0iMJeS5C9wXYfeZxIkMt
🔍 Checking subscription status for user: user_2xXeIhp0iMJeS5C9wXYfeZxIkMt
═══════════════════════════════════════════════════════════
📋 Current Plan: PREMIUM
✅ Active Subscription Found:
   - Subscription ID: sub_xyz789
   - Plan Type: paid2
   - Status: active
   - Period End: 12/15/2024, 10:30:00 AM
```

### 2. 🚀 Grant Admin Access
```bash
yarn tsx scripts/grant-admin-access.ts [USER_ID]
```
**Purpose:** Grant Premium plan access without payment (for admin users).

**Examples:**
```bash
# Use default admin user
yarn tsx scripts/grant-admin-access.ts

# Use specific user ID
yarn tsx scripts/grant-admin-access.ts user_abc123
```

### 3. 🔄 Reset to Free Plan
```bash
yarn tsx scripts/reset-to-free.ts [USER_ID]
```
**Purpose:** Reset user back to free plan, canceling any active subscriptions.

**Examples:**
```bash
# Use default admin user
yarn tsx scripts/reset-to-free.ts

# Use specific user ID
yarn tsx scripts/reset-to-free.ts user_abc123
```

## 🧪 Testing Workflow

### Complete Subscription Flow Test:

1. **Check initial status:**
   ```bash
   yarn tsx scripts/check-user-status.ts
   ```

2. **Grant admin access for testing:**
   ```bash
   yarn tsx scripts/grant-admin-access.ts
   ```

3. **Verify premium access:**
   ```bash
   yarn tsx scripts/check-user-status.ts
   ```

4. **Test your app features** with premium plan

5. **Reset back to free:**
   ```bash
   yarn tsx scripts/reset-to-free.ts
   ```

6. **Test subscription flow through UI** (pricing page → Stripe checkout)

7. **Reset again for next test:**
   ```bash
   yarn tsx scripts/reset-to-free.ts
   ```

### Production Preparation:

1. **Grant yourself admin access:**
   ```bash
   yarn tsx scripts/grant-admin-access.ts
   ```

2. **Switch to production Stripe keys**

3. **Test with real customers**

4. **Remove/delete these scripts** (optional security measure)

## 🔍 Finding Your User ID

### Method 1: Clerk Dashboard
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Users → Find your email → Copy User ID

### Method 2: Browser Console
```javascript
// When logged into your app
console.log('My User ID:', window.__clerk?.user?.id)
```

### Method 3: Database Query
```sql
SELECT DISTINCT user_id FROM user_usage LIMIT 5;
```

## ⚠️ Important Notes

- **Safe for Production:** These scripts use the same database functions as webhooks
- **Fully Logged:** All actions are logged for audit purposes  
- **Clean State:** Scripts maintain proper database relationships
- **Reversible:** All changes can be undone with the reset script

## 🔒 Security

- Scripts require direct server access
- All actions are logged with user IDs
- No Stripe credentials needed for these operations
- Safe to delete after production launch

## 🐛 Troubleshooting

**"User ID not found"** → Check Clerk dashboard for correct user ID format  
**"Database error"** → Ensure Supabase connection and migrations are applied  
**"Permission denied"** → Verify environment variables are set correctly  

## 📈 Plan Types

- `free` → Free Plan (50 pages total)
- `paid1` → Lite Plan (500 pages/month) 
- `paid2` → Pro Plan (1000 pages/month) 