# SAINTS PITCH — product and build plan

## Product direction

SAINTS PITCH is a computer-first football development workspace for one person to trial. The visual identity is text-only: SAINTS in electric purple `#8B5CF6`, PITCH in turquoise `#2DD4BF`, on obsidian `#09090B`. No logo, tagline, public launch, or subscription model is planned.

## Current feature scope

- Dashboard with weekly activity, role, goals and shortcut cards
- Weekly session planner for team training, technical work, strength/movement, matches, recovery and rest
- Rule-based session outlines for goalkeeper, defensive, midfield and attacking positions
- Position finder based on play preferences
- Meal ideas with budget, food preferences and avoid-list filters
- Readiness check-ins for sleep, energy, soreness and pain
- Progress entries, goals, JSON export, and local clear controls
- Local-first use plus optional Supabase email account, password reset and manual private cloud backup

## Privacy and data boundaries

GitHub Pages serves public static code. It does not provide private server storage, accounts, password reset or scheduled email. Local mode saves records in the browser on this device and is not encrypted. Optional cloud storage uses Supabase Auth and a one-row-per-user table protected by row-level security; `schema.sql` defines the table and owner policies. The browser client must use only the public anon/publishable key. Never expose a service-role key.

Cloud backup is manual and restore replaces the local device data after confirmation. Cloud account setup is an explicit user step. Until configured, no sign-in or cloud features are active. Do not store detailed medical information. Training and meal ideas are educational and cannot replace professional advice or guarantee allergy safety.

## Current build and remaining work

1. **Workspace foundation:** dashboard, planner, training/position/nutrition flows, recovery, progress and goals.
2. **Private account:** Supabase sign-up/sign-in/password reset and per-user backup UI plus database policy file. The user must create the project, run the SQL, set the allowed redirect URL, and enter the public URL/key in Account.
3. **Product depth:** validate meal constraints with the user, add richer training progress views and weekly review, and improve backup conflict handling.
4. **Notifications:** scheduled email reminders need a server-side scheduler and SMTP. They are not configured by GitHub Pages alone.
5. **Release:** keep root `index.html` as the original GK CONTROL page; the SAINTS PITCH app lives under `saints-pitch/`.

## Free-tier notes

Supabase currently lists a $0 Free plan with authentication, database and storage quotas, but free projects pause after one week of inactivity and do not include automatic backups. The default auth email service is best effort and rate-limited. Check [current Supabase pricing](https://supabase.com/pricing) and email limits before depending on the free tier. GitHub Pages only hosts the front end; it does not provide backend services.
