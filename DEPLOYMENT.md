# Deploy CampusFix AI

## Before deployment

1. In the Supabase dashboard, open **SQL Editor** and run `supabase/migrations/2026-10-23-campusfix-compat.sql` against the project.
2. Confirm the app's Supabase project URL and keys are available. Keep the secret/service-role key private; only enter it as a server environment variable.
3. Push the deployment files to the repository's `main` branch.

## Deploy on Render

1. Sign in to Render and choose **New → Blueprint**.
2. Connect `srishtiiimehta/CampuFix-AI` and select the branch containing `render.yaml`.
3. Create the service. Render will ask for the three Supabase values declared with `sync: false`; enter them in the dashboard.
4. Wait for the build and health check to pass. The service URL will be shown on its Render page.
5. Open the service URL and verify signup/login and ticket creation.

`GEMINI_API_KEY` is optional for the app to start; without it, AI analysis uses the app's fallback behavior. Add it under the Render service's environment settings to enable Gemini-powered analysis.

The supplied Blueprint uses Render's free web service plan. Free services may spin down while idle, so choose an always-on paid plan in Render if the app needs continuous availability. See [Render web services](https://render.com/docs/web-services), [Blueprints](https://render.com/docs/blueprint-spec), and [environment variables](https://render.com/docs/configure-environment-variables).
