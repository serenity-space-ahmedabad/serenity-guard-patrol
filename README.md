# Serenity Space — Guard Patrol System

Checks that guards actually walk their rounds and that they don't skip any.

- **Guard app** (`index.html`): this is a phone web app the guard can install like an app. The guard logs in with a guard code and PIN. The app shows the round that is due now. The guard taps **Scan next checkpoint** and the camera opens. Once the QR is read, the app takes a photo or records a 10-second video right away.
- **Admin dashboard** (`admin.html`): the committee uses this to:
  - set up checkpoints and print their QR codes
  - set routes and round times
  - manage guards
  - see today's rounds (completed / partly done / missed)
  - review flagged scans with the photo or video
  - see reports and download them as CSV
- **Server time only.** The server stamps every scan with its own clock (`now()`). The phone's clock is never used, so changing the time on the phone has no effect.

## How copying the QR is stopped

The weak point of QR patrolling is that a guard can photograph the QR once and later scan that photo from the guard room. Seven checks work together against this:

| # | Check | What it stops |
|---|---|---|
| 1 | **Live camera only.** No gallery or file upload. The scan must happen inside the app. | Uploading an old photo |
| 2 | **One-time code + server time burned into the photo/video.** When the camera opens, the server issues a random 4-digit code that is valid for 3 minutes. The code, the server time and the guard ID are printed onto every frame. The upload must belong to that one session. | Reusing an old photo/video. Faking the time |
| 3 | **GPS geofence.** Each checkpoint has its location saved by a committee member standing at the spot. A scan more than ~30 m away is flagged *Not at the checkpoint*. | Scanning from the guard room |
| 4 | **Replace QR (re-key).** One click makes the printed QR stop working and prints a new one. Anyone who scans an old, photographed copy is rejected and shown in red as a *fraud attempt*. | Collections of QR photos |
| 5 | **Random video spot-checks.** The server decides for each scan whether it must be a 10-second video (default 30%). The guard cannot know in advance. The video shows the QR on the wall and then the area around it. | Holding a phone screen up to the camera |
| 6 | **Walking-speed check.** Two checkpoints scanned too close together in time, or faster than walking speed, are flagged *Too quick*. | Running through scans |
| 7 | **Phone lock.** Each guard account is locked to one phone. A login from another phone is flagged. | Lending the login to someone else |

Rejected (not counted): old/fake QR, a checkpoint not on this route, an already-scanned checkpoint, a missing photo/video, or a session that ran out of time.
Marked **Check** (counted, but the committee should look): GPS too far away, GPS off, too quick, a different phone, or after the round time.

**Recommended practice:** use *Replace QR* on 2–3 random checkpoints every month, and also straight away whenever you suspect a guard. Each week, open a few photos in the Review tab and check that the code shown matches.

## Setup (≈1 hour; same pattern as Meal Pass)

| What | Where | Cost |
|---|---|---|
| Website hosting | GitHub Pages | Free |
| Database, logins, photo storage | Supabase Free plan (1 GB storage) | Free |

1. **GitHub:** create the repository `serenity-guard-patrol` and upload this folder.
2. **Supabase:** create a new project (`serenity-guard-patrol`, region Mumbai). Note the project ref, URL, anon key and DB password, and create an access token.
3. **GitHub → Settings → Secrets and variables → Actions**
   - Secrets: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `SUPABASE_PROJECT_REF`
   - Variables: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, optional `GUARD_EMAIL_DOMAIN`
   - Settings → Pages → Source: **GitHub Actions**
4. **Actions:** run **Deploy Supabase**, then **Deploy website**.
5. **Your admin login:** in Supabase, go to **Authentication → Users → Add user**, enter your email and a password, and tick *Auto confirm*. Then open **SQL Editor** and run:
   ```sql
   update app_settings set value = 'YOUR-EMAIL' where key = 'super_admin_email';
   insert into admins (user_id, name)
     select id, 'Chairman' from auth.users where lower(email) = lower('YOUR-EMAIL')
   on conflict do nothing;
   ```
6. Open `https://<github-user>.github.io/serenity-guard-patrol/admin.html` and log in.

## First week

1. **Checkpoints & QR:** add every checkpoint (gates, each block lobby, basement, clubhouse, pump room, terrace door, and so on).
2. Walk to each one with your phone and press **📍 Set location here**. For basements, turn off *Check GPS* with **Edit**, because GPS is weak there.
3. **🖨 Print all QR codes.** Laminate them and fix each one firmly at its spot at chest height, somewhere it shows the surroundings (a wall or pillar).
4. **Routes & times:** create a route, add the checkpoints in walking order, then add the times. For example, *every 120 min from 22:00 to 06:00, 45-minute window*.
5. **Guards:** add each guard with a code (G01, G02…) and a 6-digit PIN.
6. On each guard's phone, open `https://<github-user>.github.io/serenity-guard-patrol/`. Choose **Add to Home screen** and allow **Camera** and **Location**.

## Notes

- **Storage:** photos are about 30–80 KB and 10-second videos about 0.5–0.8 MB. Use **Settings → Delete old media now** once a month (it keeps 30 days by default). Scan records are never deleted.
- **Free plan pause:** Supabase pauses a free project after 7 days without any use. Guards scanning every night keeps it awake.
- **Changing rules:** the Settings tab has the video %, time limits, walking speed, GPS accuracy and how long media is kept.
- **Database changes:** add a *new* file under `supabase/migrations/`. Never edit a migration that has already been applied.
