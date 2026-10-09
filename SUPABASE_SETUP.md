# NIYANTRIX — Shared session storage setup

The game is hosted on GitHub Pages, which serves static files. It cannot safely accept and centrally store session submissions by itself. This repo now supports Supabase as the shared database, so teams on different phones/PCs can appear in the same admin portal.

## One-time setup

1. Create a Supabase project at https://supabase.com/ and open its **SQL Editor**.
2. Open `supabase-schema.sql` from this repository, copy all of its SQL, paste it into the SQL Editor, and run it.
3. In Supabase, open **Authentication → Sign In / Providers**. Enable **Anonymous sign-ins** for the game players and enable the **Email** provider for the organizer account.
4. Open **Authentication → Users** and create an organizer user with your email and a strong password.
5. Copy that user’s UUID from the Users page. In the SQL Editor, run this command after replacing the placeholder with the copied UUID:

   ```sql
   insert into public.niyantrix_admins (user_id)
   values ('PASTE_ORGANIZER_USER_UUID_HERE')
   on conflict do nothing;
   ```

6. In Supabase **Project Settings → API**, copy the Project URL and the **publishable** key (or legacy anon/public key).
7. Open `database-config.js` in this GitHub repository and fill in the two empty values:

   ```js
   window.NIYANTRIX_CONFIG = Object.freeze({
     SUPABASE_URL: "https://YOUR-PROJECT.supabase.co",
     SUPABASE_ANON_KEY: "YOUR_PUBLIC_PUBLISHABLE_OR_ANON_KEY"
   });
   ```

8. Commit the change to GitHub. Wait for GitHub Pages to publish it, then reload the game and admin portal.

## What is saved

After a team creates a mission session, the shared database stores the team name, mission ID, start/last-seen/finish timestamps, status, duration, errors, and hints. **The access code entered by a team is not sent to or stored in the database.**

## How to sign in to Admin Portal

Use the organizer email and password created in Supabase Authentication. Only the user whose UUID is listed in `public.niyantrix_admins` can read all teams or clear all sessions.

## Security essentials

- Use only the public **publishable/anon** key in `database-config.js`; Row Level Security policies protect the tables.
- **Never** put a Supabase `service_role` or secret key into GitHub Pages or browser JavaScript.
- Do not use the public database for sensitive personal information.
- If the URL/key are left blank, the game can still run, but cross-device cloud tracking will not work and the admin dashboard will ask for setup.
