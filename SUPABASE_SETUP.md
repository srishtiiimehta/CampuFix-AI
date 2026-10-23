# Supabase setup for CampusFix AI

This project already has `public.profiles` (`id`, `full_name`, `role`) and `public.tickets`. The app uses those profiles for sign-in and keeps its full-fidelity ticket records in a separate `public.campusfix_ticket_records` table so it does not alter your existing ticket table.

1. In Supabase **SQL Editor**, run [`supabase/migrations/2026-10-23-campusfix-compat.sql`](supabase/migrations/2026-10-23-campusfix-compat.sql). This creates the app's ticket table and a profile trigger for future signups.
2. In the project `.env`, set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and the server-only `SUPABASE_SECRET_KEY`. Never put the secret key in a `VITE_*` variable or commit `.env`.
3. Enable email signups in the Supabase Auth settings. Students can create accounts from the app’s **Create an account** link; if email confirmation is enabled, they must confirm from their inbox before signing in. New signups get the `student` role. Set staff roles in SQL, replacing the UUID with the user's Auth UID:

   ```sql
   update public.profiles set role = 'staff' where id = 'AUTH-USER-UUID';
   ```

4. Start the app with `npm run dev` and sign in with an email and password.

The server uses the secret key only in its `apikey` request header. The browser uses the publishable key and the signed-in user's access token.
