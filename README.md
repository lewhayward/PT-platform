# PT Platform

A web app for personal trainers to manage clients, workouts, nutrition and
progress tracking in one place.

**Phase 1 (this version) covers:** account sign-up/login for both trainers
and clients, and an empty dashboard shell for each. No client management,
workouts, or nutrition features yet - those come in later phases.

## 1. Create your Supabase project

1. Go to [supabase.com](https://supabase.com), sign in, and click "New project".
2. Once it's created, open **Settings -> API** in the left sidebar. You'll need two values from this page in a moment: the **Project URL** and the **anon public** key.

## 2. Set up the database

1. In your Supabase project, open the **SQL Editor** tab.
2. Open the file `supabase/schema.sql` in this project, copy its entire contents, and paste it into the SQL Editor.
3. Click **Run**.

This creates a `profiles` table that stores whether each person is a
"trainer" or a "client", and wires it up so a profile row is created
automatically whenever someone signs up.

## 3. Add your environment variables

1. Copy `.env.example` to a new file named `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Open `.env.local` and paste in the **Project URL** and **anon public** key from step 1.

`.env.local` is never committed to git (it's listed in `.gitignore`), so your keys stay private.

## 4. Run the app

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

If all of that works, Phase 1 is solid and we can move on to Phase 2 (client management).

## Project structure

- `src/app/` - pages and routes (Next.js App Router)
- `src/app/auth/actions.ts` - sign-up, login, and logout logic
- `src/lib/supabase/` - Supabase client setup and the "Data Access Layer" (`dal.ts`) that checks who's logged in
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
