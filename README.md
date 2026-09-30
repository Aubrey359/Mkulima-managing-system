# Shamba-Sokoni-System

Management system for **Mkulima Mdogo Seedlings** (Nakuru) — a single-file web app (`index.html`) covering sales, bookings, inventory, seedling catalogue, sowing records, propagation, manure, customers (CRM), accounting, employees, attendance, purchases, reports and settings.

## Live app

https://shamba-sokoni.onrender.com — a Render static site that redeploys automatically whenever the `claude/trusting-thompson-kmpdzd` branch changes. It publishes only `index.html` and `assets/`.

## Running

Open `index.html` in a browser. No build step or server is required. Keep the `assets/` folder (logos, app icons and the install manifest) next to `index.html` — copy both together when moving the app to another computer or a web host. Chart.js, SheetJS, Mammoth and the Supabase client load from CDNs, so the first load on a device needs internet access.

## Data and syncing

All data is shared online through Supabase (project **shamba-sokoni**, table `records`), so every phone and computer sees the same records. Each device also keeps a full copy in the browser, so the app keeps working without internet: changes made offline are uploaded automatically when the connection returns. The status next to the user name in the top bar shows **Synced**, **Syncing…**, or **Offline — N changes waiting**; click it to sync immediately.

- Changes are uploaded a moment after each save and other devices' changes are downloaded every 20 seconds.
- If two devices edit *different* records they both keep their changes. If they edit the *same* record at the same time, the last one to upload wins.
- Receipt/document counters never go backwards, but two devices working **offline** at the same time could hand out the same receipt number.
- **Restore** (Settings) replaces the shared data on every device, so use it with care. Keep downloading backups monthly.

The database setup lives in `supabase/migrations/`.

## Sign-in and roles

Each role has its own online account; the server checks the password and only returns the data that role may see. Signing in needs internet the first time on each device; after that the device stays signed in, even offline.

| Role | Access |
|------|--------|
| Loise | Everything; can change every role's password in **Settings** |
| Sales — Managers | Sales, bookings, stock, customers, attendance, reports |
| Sowing Team | Sowing records only (server blocks money, staff and other data) |

The first sign-in with a starter password asks for a new password (at least 6 characters). When a different role signs in on the same device, the previous role's copy of the data is cleared from that device.

## Tests

`npm install && npm test` runs an end-to-end test of sign-in and syncing (several simulated devices against an in-memory stand-in for Supabase). Set `CHROMIUM_PATH` to use a specific Chromium.
