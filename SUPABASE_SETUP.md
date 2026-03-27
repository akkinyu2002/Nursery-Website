# Supabase Setup

This project now supports Supabase for orders, feedback, customer records, and admin notifications with localStorage fallback.

## 1) Create tables and policies

1. Open your Supabase project.
2. Go to SQL Editor.
3. Run [`supabase/schema.sql`](./supabase/schema.sql).

## 2) Add project credentials

Edit [`js/supabase-config.js`](./js/supabase-config.js):

```js
window.NurserySupabaseConfig = {
  url: "https://YOUR_PROJECT_REF.supabase.co",
  anonKey: "YOUR_SUPABASE_ANON_KEY",
  tables: {
    orders: "orders",
    feedback: "feedback",
    customers: "customers",
    notifications: "notifications",
  },
};
```

If `url` or `anonKey` is left blank, the app stays in localStorage mode.

## 3) Create an admin user for dashboard access

1. In Supabase Dashboard, open Authentication > Users.
2. Create a user with email + password.
3. Use that email/password on `admin-login.html`.

## 4) Enable email notifications

This sends a real admin email whenever a new order is placed.

1. Create a Resend account and generate an API key.
2. Set Supabase function secrets:
   - `supabase secrets set RESEND_API_KEY=YOUR_RESEND_API_KEY`
   - Optional sender override:
     - `supabase secrets set ORDER_ALERT_FROM_EMAIL=\"Nursery Alerts <alerts@yourdomain.com>\"`
3. Deploy the function from this repo:
   - `supabase functions deploy order-email-alert`

Function source: [`supabase/functions/order-email-alert/index.ts`](./supabase/functions/order-email-alert/index.ts)

Email recipient is fixed in code to `nyupaneaakash@gmail.com`.

## 5) Verify flow

1. Place a checkout order from the storefront.
2. Login on admin page.
3. Confirm:
   - order appears in Orders table
   - customer appears in Customers panel
   - notification appears in Admin Notifications panel
   - admin email receives a new order alert
   - feedback submissions appear in Customer Reviews panel and are visible on the homepage immediately
   - admin can delete any review from the Customer Reviews panel if it should not stay live

## Notes

- This is a static frontend integration (no backend server required).
- The dashboard still works with local fallback if Supabase is unreachable.
- Email alerts work only when Supabase mode is enabled.
- For production hardening, add a backend for stricter validation and anti-spam protections.
