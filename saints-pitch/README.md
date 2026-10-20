# SAINTS PITCH

[Open the live app](https://rochellekissun.github.io/gk-control/saints-pitch/)

Computer-first personal football development workspace. The app works in local mode without an account. Add a Supabase project to enable email sign-up, sign-in, password reset and per-account cloud backup.

## Turn on private accounts and cloud backup

1. Create a Supabase project on the Free plan. Check the current [Supabase pricing and limits](https://supabase.com/pricing); free projects pause after a week of inactivity and do not include automatic database backups.
2. In the project's SQL Editor, run [`schema.sql`](schema.sql). It creates one JSON record per account and enables row-level security so an authenticated user can access only their own record.
3. In Supabase Project Settings → API, copy the Project URL and the public anon/publishable key. Do not copy or publish the `service_role` key.
4. In Authentication settings, allow this redirect URL: `https://rochellekissun.github.io/gk-control/saints-pitch/`.
5. Open the app → Account, enter the Project URL and public key, and save. Create an account or sign in. Use **Save a private cloud copy** to back up, and **Restore from cloud** on another device.

The app stores its project URL/key and sign-in session in this browser's local storage. The public anon key is meant for browser use; privacy depends on the database RLS policies in `schema.sql`. Never add a service-role key or other secret to this repository. Cloud backup is manual; local changes are not automatically synced. Restore replaces the current device copy after confirmation.

Supabase's built-in auth email service is best effort and rate-limited; verify current limits in Supabase before relying on password resets. A custom SMTP service may be needed for dependable email. Scheduled training reminders and progress emails need a separate server-side scheduled function and SMTP configuration and are not included yet.

## Current workspace

- Dashboard and weekly plan
- Rule-based session generator across football positions and development areas
- Position finder
- Meal ideas with dietary preference and avoid filters
- Recovery check-ins, goals and progress history
- JSON export and local clear controls
- Optional Supabase account and private cloud backup

Training and nutrition ideas are general education, not clinical advice. Allergy filters are not safety guarantees. Avoid saving sensitive health details.
