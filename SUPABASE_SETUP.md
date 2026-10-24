# Supabase setup for CampusFix AI

This project already has `public.profiles` (`id`, `full_name`, `role`) and `public.tickets`. The app uses those profiles for sign-in and keeps its full-fidelity ticket records in a separate `public.campusfix_ticket_records` table so it does not alter your existing ticket table.

1. In Supabase **SQL Editor**, run [`supabase/migrations/2026-10-23-campusfix-compat.sql`](supabase/migrations/2026-10-23-campusfix-compat.sql) if it has not already been applied. Then run [`supabase/migrations/2026-10-24-staff-approval-categories.sql`](supabase/migrations/2026-10-24-staff-approval-categories.sql). The new migration adds profile categories and staff approval status without deleting accounts or tickets; existing staff are marked approved to preserve their access.
2. In the project `.env`, set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and the server-only `SUPABASE_SECRET_KEY`. Never put the secret key in a `VITE_*` variable or commit `.env`.
3. In Supabase **Authentication → Providers → Email**, enable email signups and turn **Confirm email** on. Set the correct Site URL and add your deployed app URL to the allowed redirect URLs. The server checks Supabase's `email_confirmed_at` field, but the Supabase setting must be enabled so new staff cannot be auto-confirmed.

4. Students can choose `Student` or `CR (Class Representative)`. Staff applicants can choose Dean, Professor, Sweeper, Plumber, or Electrician. A staff category is only a request: staff signups are stored with `role = 'staff'` and `staff_approved = false`, and cannot sign in until both email confirmation and administrator approval are complete.

5. **Approve the first staff account:** after the person has confirmed their email, an authorized project administrator should find their Auth UID in **Authentication → Users**, verify their identity, then run this in the SQL Editor (replace the UUID):

   ```sql
   update public.profiles
   set staff_approved = true
   where id = 'AUTH-USER-UUID'
     and role = 'staff';
   ```

   Verify exactly one row was updated. Do not approve an account based only on the selected category or an unverified email. Existing staff are grandfathered as approved by the migration. The app does not expose a public staff-approval endpoint.

6. Start the app with `npm run dev` and sign in with an email and password.

The Supabase secret/service-role key is used only by the server in request headers. Never expose it to the browser, use it in a `VITE_*` variable, or commit it; the browser communicates with the app API using the signed-in user's access token.
