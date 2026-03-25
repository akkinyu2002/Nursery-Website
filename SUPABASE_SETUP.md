# Supabase Setup

This project now supports Supabase for orders, feedback, and customer records with localStorage fallback.

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
  },
};
```

If `url` or `anonKey` is left blank, the app stays in localStorage mode.

## 3) Create an admin user for dashboard access

1. In Supabase Dashboard, open Authentication > Users.
2. Create a user with email + password.
3. Use that email/password on `admin-login.html`.

## 4) Verify flow

1. Place a checkout order from the storefront.
2. Login on admin page.
3. Confirm:
   - order appears in Orders table
   - customer appears in Customers panel
   - feedback submissions appear in Customer Reviews panel

## Notes

- This is a static frontend integration (no backend server required).
- The dashboard still works with local fallback if Supabase is unreachable.
- For production hardening, add a backend for stricter validation and anti-spam protections.
