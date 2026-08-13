# PT Platform

A web app for personal trainers to manage clients, workouts, nutrition and
progress tracking in one place.

**Covers so far:**
- **Phase 1**: account sign-up/login for both trainers and clients
- **Phase 2**: trainers can invite clients by email, see their client list, and open a client's profile

No workout, nutrition, or progress-tracking features yet - those come in later phases.

## 1. Create your Supabase project

1. Go to [supabase.com](https://supabase.com), sign in, and click "New project".
2. Once it's created, open **Settings -> API** in the left sidebar. You'll need three values from this page in a moment: the **Project URL**, the **Publishable key** (also called "anon" key), and the **Secret key**.
   - The Secret key gives full admin access to your database - never paste it into `NEXT_PUBLIC_...` anything, and never put it anywhere a browser could see it.

## 2. Set up the database

1. In your Supabase project, open the **SQL Editor** tab.
2. Open the file `supabase/schema.sql` in this project, copy its entire contents, and paste it into the SQL Editor.
3. Click **Run**.

This creates:
- a `profiles` table that stores whether each person is a "trainer" or a "client" (with a profile row created automatically whenever someone signs up)
- a `trainer_clients` table linking each trainer to the clients they've invited, with email, goals, notes, and a status (Invited / Active)

## 3. Add your environment variables

1. Copy `.env.example` to a new file named `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Open `.env.local` and paste in the **Project URL**, **Publishable key**, and **Secret key** from step 1.

`.env.local` is never committed to git (it's listed in `.gitignore`), so your keys stay private.

## 4. Configure the invite email (needed for Phase 2)

Inviting a client sends them an email with a link to set up their account. By default, Supabase's invite link doesn't work with this app's link-handling page, so it needs a one-time tweak:

1. In Supabase, go to **Authentication -> Email Templates -> Invite user**.
2. Find the link in the template (it looks like `{{ .ConfirmationURL }}`) and replace it with:
   ```
   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type={{ .Type }}&next={{ .RedirectTo }}
   ```
3. Save.
4. Still in Supabase, go to **Authentication -> URL Configuration** and make sure your app's URL is in **Redirect URLs** as a wildcard, e.g. `https://yourapp.vercel.app/**` (or `http://localhost:3000/**` for local development). This lets Supabase redirect to any page in the app, not just the exact homepage.

## 5. Run the app

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to test Phase 1

1. **Sign up as a trainer**: go to `/signup`, choose "I'm a trainer", fill in the form, and submit.
2. **Confirm your email**: by default, Supabase requires email confirmation. Check the inbox of the address you signed up with and click the confirmation link (it'll redirect you back into the app and log you in). You should land on an empty trainer dashboard at `/trainer`.
   - Tip for faster testing: in your Supabase dashboard under **Authentication -> Sign In / Providers -> Email**, you can turn off "Confirm email" so accounts are active immediately - handy for development, but you'd normally want it on in production.
3. **Log out** using the button in the top-right corner. You should land back on the homepage.
4. **Sign up as a client**: repeat step 1 but choose "I'm a client". After confirming, you should land on an empty client dashboard at `/client`.
5. **Log in**: go to `/login` and sign in with either account. You should be sent to the correct dashboard for that account's role.
6. **Check the role guard**: while logged in as a client, try visiting `/trainer` directly in the address bar - you should be redirected to `/client` instead of seeing the trainer dashboard (and vice versa).
7. **Check the redirect guard**: while logged out, try visiting `/trainer` or `/client` directly - you should be redirected to `/login`.

If all of that works, Phase 1 is solid.

## How to test Phase 2

1. **Log in as a trainer**, then click **Add client** on the dashboard.
2. Fill in a client's name, email (use a real inbox you can check), and optionally goals/notes, then **Send invite**. You should land back on your client list, showing them as **Invited**.
3. **Check the invite email** - it should arrive addressed to the client, with a link to set a password.
4. Click that link. It should open **Set your password**, already signed in as the new client account.
5. Set a password. You should land on the (empty) client dashboard.
6. Back on the trainer's client list, refresh - that client should now show as **Active**.
7. Click into that client from the list - you should see their profile page with the goals/notes you entered.
8. **Check the guard**: while logged in as a different trainer (or logged out), try visiting another trainer's client profile URL directly - you should get a "not found" page, not their data.

If all of that works, Phase 2 is solid and we can move on to Phase 3 (workout programming).

## Project structure

- `src/app/` - pages and routes (Next.js App Router)
- `src/app/auth/actions.ts` - sign-up, login, and logout logic
- `src/app/trainer/clients/actions.ts` - inviting a client
- `src/app/invite/actions.ts` - a newly-invited client setting their password
- `src/lib/supabase/server.ts` / `client.ts` - the regular Supabase clients (respect Row Level Security)
- `src/lib/supabase/admin.ts` - the admin client (secret key, bypasses security rules) - only ever used server-side, only for inviting users
- `src/lib/supabase/dal.ts` - the "Data Access Layer" that checks who's logged in and what they're allowed to see
- `src/proxy.ts` - runs before every page request to keep sessions fresh and enforce redirects (Next.js 16 renamed "middleware" to "proxy")
- `src/components/` - shared, reusable pieces of UI
- `supabase/schema.sql` - the database setup script from step 2 above

## Branding

The colour palette (a calm sage green) and the app icons in `public/` are
placeholders. Swap `public/icon-192.png`, `public/icon-512.png`,
`public/apple-icon.png`, and the colours in `src/app/globals.css` and
`src/app/manifest.ts` for your own whenever you're ready.

## Tech stack

- [Next.js](https://nextjs.org) (App Router) - React framework
- [Tailwind CSS](https://tailwindcss.com) - styling
- [Supabase](https://supabase.com) - database, authentication, file storage
