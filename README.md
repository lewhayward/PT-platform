# PT Platform

A web app for personal trainers to manage clients, workouts, nutrition and
progress tracking in one place.

**Covers so far:**
- **Phase 1**: account sign-up/login for both trainers and clients
- **Phase 2**: trainers can invite clients by email, see their client list, and open a client's profile
- **Phase 3**: trainers can build a client's weekly workout programme, with a built-in exercise library, suggested starter programmes, and easy re-use of workouts already built
- **Phase 4**: clients log what they actually did (reps/weight per set) against their assigned workout, and trainers can see completed vs. assigned per client
- **Phase 5**: trainers set daily calorie/macro targets per client, clients log food eaten (with a one-tap "log again" for anything eaten before), and trainers can see day-by-day nutrition history vs. targets

No progress-tracking features yet - that comes in a later phase.

## 1. Create your Supabase project

1. Go to [supabase.com](https://supabase.com), sign in, and click "New project".
2. Once it's created, open **Settings -> API** in the left sidebar. You'll need three values from this page in a moment: the **Project URL**, the **Publishable key** (also called "anon" key), and the **Secret key**.
   - The Secret key gives full admin access to your database - never paste it into `NEXT_PUBLIC_...` anything, and never put it anywhere a browser could see it.

## 2. Set up the database

1. In your Supabase project, open the **SQL Editor** tab.
2. Open the file `supabase/schema.sql` in this project, copy its entire contents, and paste it into the SQL Editor, then click **Run**.
3. Do the same with `supabase/seed.sql` - paste its contents in and click **Run**. This loads the exercise library and starter workout programmes.

`schema.sql` creates:
- a `profiles` table that stores whether each person is a "trainer" or a "client" (with a profile row created automatically whenever someone signs up)
- a `trainer_clients` table linking each trainer to the clients they've invited, with email, goals, notes, primary goal, days per week, and a status (Invited / Active)
- `exercises`, `workout_templates`, `programme_templates` and related tables for Phase 3's workout programming
- `workout_logs` and related tables for Phase 4's workout logging
- `nutrition_targets` and `food_logs` for Phase 5's nutrition tracking

Both files are safe to re-run any time (e.g. after pulling an update) - they won't duplicate data or wipe anything a trainer or client has already entered.

## 3. Add your environment variables

1. Copy `.env.example` to a new file named `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Open `.env.local` and paste in the **Project URL**, **Publishable key**, and **Secret key** from step 1.

`.env.local` is never committed to git (it's listed in `.gitignore`), so your keys stay private.

## 4. Allow the invite redirect (needed for Phase 2)

Inviting a client sends them an email with a link to set up their account. Supabase only allows redirecting to URLs you've explicitly approved, so:

1. In Supabase, go to **Authentication -> URL Configuration**.
2. Under **Redirect URLs**, add your app's URL as a wildcard, e.g. `https://yourapp.vercel.app/**` (or `http://localhost:3000/**` for local development). This lets Supabase redirect to any page in the app, not just the exact homepage.

(No email template editing is needed - customising templates requires setting up your own SMTP provider, which isn't necessary for this app.)

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

If all of that works, Phase 2 is solid.

## How to test Phase 3

1. **Add a new client** (or use an existing one) - this time fill in **Primary goal** and **Days per week**, e.g. "Bodybuilding" and "3 days".
2. From that client's profile, click **View programme**. If their goal/frequency matches one of the built-in starter programmes, you'll see it suggested - click **Use this programme**.
   - You should land on a week view (Monday-Sunday), with the matching days already filled in with exercises and the rest marked as rest days.
3. **Edit an exercise**: click **Edit** on any exercise, change the sets/reps/weight, and save - it should update just that one exercise.
4. **Add an exercise**: on any day, click **+ Add exercise**, start typing in the exercise field - you should see suggestions from the library appear. Try typing something not in the list too (e.g. "Sled Push") and save - it should still save fine as a custom exercise.
5. **The main "reuse" test**: on a day that already has exercises, click **Copy to other days...**, tick a couple of the rest days, and copy. Those days should now show the identical workout - no rebuilding by hand.
6. **Save as template**: on a built day, click **Save as template**, give it a name. Then go to a *different* client's programme (or a rest day on the same one) and check that template appears in the "Use one of my templates..." dropdown at the bottom of a day card - selecting it and clicking Apply should fill that day in instantly.
7. **Mark as rest day**: click it on a day with exercises - it should clear the exercises and show as a rest day again.
8. **Check the client's view**: log in as that client (or open an incognito window) and check their dashboard shows today's actual assigned workout (or "Rest day" if today happens to be a rest day in their schedule).
9. **Check the guard**: try building a programme for a client that isn't yours (a different trainer's client) by guessing a URL - you should get a "not found" page.

If all of that works, Phase 3 is solid.

## How to test Phase 4

1. **Log in as a client** with an assigned workout today, and click **Log this workout** on the dashboard.
2. You'll see each exercise with a row per prescribed set, pre-filled with the prescribed reps/weight. Change a couple of numbers to simulate doing something slightly different, add a note, and **Save log**.
3. Back on the dashboard, you should see **"✓ Logged for today"** instead of the log button. Click **Edit log** - your changes should still be there.
4. **Log in as that client's trainer**, open the client's profile, and click **Workout history**. You should see today's entry showing what was prescribed vs. what was actually completed for each exercise.
5. **Check the guard**: while logged in as a different trainer, try visiting another trainer's client's history page directly via URL - you should get a "not found" page.

If all of that works, Phase 4 is solid.

## How to test Phase 5

1. **Log in as a trainer**, open a client's profile, and click **Nutrition targets**. Set a daily calorie target and protein/carbs/fat targets in grams, then save.
2. **Log in as that client** (or open an incognito window) - their dashboard should show a "Nutrition" card. Click **Log food**.
3. Type in a food name plus its calories and macros, and **Log food**. It should appear under "Logged today", and the totals at the top should update against the targets you set.
4. **Log the same food again**: it should now appear under "Recently logged" - click the **+** next to it. It should be added again with the same values, no retyping needed.
5. **Remove an entry**: click **Remove** on a logged item - it should disappear and the totals should update.
6. **Log in as that client's trainer** again, open their profile, and click **Nutrition history**. You should see today listed with the totals vs. targets you'd expect.
7. **Check the guard**: while logged in as a different trainer, try visiting another trainer's client's nutrition pages directly via URL - you should get a "not found" page.

If all of that works, Phase 5 is solid.

## Project structure

- `src/app/` - pages and routes (Next.js App Router)
- `src/app/auth/actions.ts` - sign-up, login, and logout logic
- `src/app/trainer/clients/actions.ts` - inviting a client
- `src/app/trainer/clients/[id]/programme/actions.ts` - building, editing, and reusing a client's workout programme
- `src/app/client/log/actions.ts` - a client logging what they actually did against today's plan
- `src/app/trainer/clients/[id]/nutrition/actions.ts` - a trainer setting a client's daily nutrition targets
- `src/app/client/nutrition/actions.ts` - a client logging food eaten, re-logging a previous entry, and deleting an entry
- `src/app/invite/actions.ts` - a newly-invited client setting their password
- `src/lib/supabase/server.ts` / `client.ts` - the regular Supabase clients (respect Row Level Security)
- `src/lib/supabase/admin.ts` - the admin client (secret key, bypasses security rules) - only ever used server-side, only for inviting users
- `src/lib/supabase/dal.ts` - the "Data Access Layer" that checks who's logged in and what they're allowed to see
- `src/proxy.ts` - runs before every page request to keep sessions fresh and enforce redirects (Next.js 16 renamed "middleware" to "proxy")
- `src/components/` - shared, reusable pieces of UI
- `supabase/schema.sql` - the database setup script from step 2 above
- `supabase/seed.sql` - the exercise library and starter workout programmes from step 2 above

## Branding

The colour palette (a calm sage green) and the app icons in `public/` are
placeholders. Swap `public/icon-192.png`, `public/icon-512.png`,
`public/apple-icon.png`, and the colours in `src/app/globals.css` and
`src/app/manifest.ts` for your own whenever you're ready.

## Tech stack

- [Next.js](https://nextjs.org) (App Router) - React framework
- [Tailwind CSS](https://tailwindcss.com) - styling
- [Supabase](https://supabase.com) - database, authentication, file storage
