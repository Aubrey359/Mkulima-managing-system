# Shamba-Sokoni-System

Management system for **Mkulima Mdogo Seedlings** (Nakuru) — a single-file web app (`index.html`) covering sales, bookings, inventory, seedling catalogue, sowing records, propagation, manure, customers (CRM), accounting, employees, attendance, purchases, reports and settings.

## Live app

https://shamba-sokoni.onrender.com — a Render static site that redeploys automatically whenever the `main` branch changes. Render settings: **Build Command** `npm run build`, **Publish Directory** `public` (only `index.html`, `privacy.html`, `guide.html`, `sw.js`, `assets/` and, once added, `.well-known/` are published).

After the first visit, the app opens even without internet: `sw.js` (a service worker) keeps a copy of the app on the device and refreshes it whenever the device is online.

## Running

Open `index.html` in a browser. No build step or server is required. Keep the `assets/` folder (logos, app icons and the install manifest) next to `index.html` — copy both together when moving the app to another computer or a web host. Chart.js, SheetJS, Mammoth and the Supabase client load from CDNs, so the first load on a device needs internet access.

## Project structure

```
index.html                  page layout (sign-in screen, sidebar, icons) — loads everything below
assets/css/styles.css       all styles and colour themes
assets/js/01-core.js        data storage, roles, company details, helpers (loaded first)
assets/js/02-…28-*.js       one file per part of the app: page hints, search, catalogue,
                            propagation, reminders, manure, login, dashboard, sales, receipts,
                            bookings, inventory, sowing, customers, accounting, employees,
                            loans & salary, attendance, purchasing, reports, settings, tutorial
assets/js/29-cloud-sync.js  Supabase sign-in and syncing
assets/js/30-init.js        starts the app
assets/js/31-mpesa.js       M-Pesa payment requests and settings
supabase/functions/         server functions for M-Pesa (mpesa-stk, mpesa-callback)
assets/*.png, manifest      logos, app icons, install manifest
sw.js                       service worker: lets the app open without internet
supabase/migrations/        database setup
tests/                      end-to-end tests (sync, numbering, offline, forms, buttons)
privacy.html                privacy policy (linked from the sign-in screen; needed for the Play Store)
guide.html                  staff guide, English + Kiswahili, printable (https://shamba-sokoni.onrender.com/guide.html)
playstore/                  Play Store listing: icon, feature graphic, screenshots, guide (PLAYSTORE.md)
```

The scripts are plain browser scripts that share global functions and variables, and they run in the numbered order listed in `index.html`. A new file must be added there with its own `<script>` tag.

## Working in Visual Studio Code

1. Clone the repository and open the folder in VS Code (**File → Open Folder…**).
2. Accept the recommended extensions: **Prettier** (formats code on save) and **Live Server**.
3. Click **Go Live** in the status bar (or right-click `index.html` → *Open with Live Server*) to run the app at `http://127.0.0.1:5500` — it reloads when you save.
4. **Ctrl+Click** (or F12) on a function name jumps to where it is defined, even in another file; **Ctrl+P** opens a file by name; **Ctrl+Shift+F** searches the whole project.

Anything pushed to `main` goes live on Render automatically, so test with Live Server first.

## Data and syncing

All data is shared online through Supabase (project **shamba-sokoni**, table `records`), so every phone and computer sees the same records. Each device also keeps a full copy in the browser, so the app keeps working without internet: changes made offline are uploaded automatically when the connection returns. The status next to the user name in the top bar shows **Synced**, **Syncing…**, or **Offline — N changes waiting**; click it to sync immediately.

- Changes are uploaded a moment after each save and other devices' changes are downloaded every 20 seconds.
- If two devices edit *different* records they both keep their changes. If they edit the *same* record at the same time, the last one to upload wins.
- Receipt and document numbers (RCP-0012, PRP-0003, …) come from a shared counter on the server: each device keeps its next number reserved in advance, so two devices never issue the same number. A device that is offline and has used its reserved number adds its own code instead (e.g. `RCP-0012-K7`), which is still unique. Numbers can therefore be slightly out of order between devices, with an occasional gap.
- **Restore** (Settings) replaces the shared data on every device, so use it with care. Keep downloading backups monthly.

The database setup lives in `supabase/migrations/`.

## Sign-in and roles

Each role has its own online account; the server checks the password and only returns the data that role may see. Signing in needs internet the first time on each device; after that the device stays signed in, even offline.

| Role | Access |
|------|--------|
| Loise | Everything; can change the Loise and Sales passwords in **Settings** |
| Sales — Managers | Sales, bookings, stock, customers, attendance, reports |
| Sowing Team | **No password** — tap *Sowing Team* to open. Sowing records only; the server gives this account sowing, stock, catalogue, bookings and propagation data, never customers, sales, money or staff data |

Loise and Sales: the first sign-in with a starter password asks for a new password (at least 6 characters). When a different role signs in on the same device, the previous role's copy of the data is cleared from that device.

## Tests

`npm install && npx playwright install chromium && npm test` runs the end-to-end tests: sign-in and syncing across several simulated devices (against an in-memory stand-in for Supabase) including document numbering; opening the app offline; filling in and saving every main form (sales, credit, bookings, stock, sowing, customers, accounts, staff, payroll, attendance, purchasing, documents, propagation, catalogue, reports, Excel export, backup and restore); and clicking every button as each role. They run automatically on GitHub for every push (`.github/workflows/test.yml`). Set `CHROMIUM_PATH` to use a specific Chromium.

A second workflow (`.github/workflows/keepalive.yml`) pings the database every two days so the free Supabase project is never paused for inactivity.

## Go-live checklist

1. **Render** → Settings → Build & Deploy: Branch `main`, Build Command `npm run build`, Publish Directory `public`.
2. **Move the existing data in** (once, on the device that has it): open the old file → **Settings → Backup** (downloads `Mkulima_Backup_<date>.xlsx` and `Mkulima_Full_<date>.json`) → open https://shamba-sokoni.onrender.com → sign in as **Loise** → **Settings → Restore** → choose the **`Mkulima_Full_<date>.json`** file.
3. **Loise and Sales sign in once** with their starter password and set their own. Sowing workers just tap *Sowing Team* — no password.
4. **Each phone/computer** opens the link once while online (then it also works offline) and can be added to the home screen.

## Play Store

Everything needed to publish the app on Google Play (listing text, graphics, screenshots, form answers and step-by-step build instructions) is in [`playstore/PLAYSTORE.md`](playstore/PLAYSTORE.md).

## M-Pesa

Sales and credit payments can be taken by M-Pesa (Safaricom Daraja STK Push): the customer gets a prompt on their phone, and the real M-Pesa code is saved on the sale. Setup (Daraja keys, test mode, going live) is in [`MPESA.md`](MPESA.md).
