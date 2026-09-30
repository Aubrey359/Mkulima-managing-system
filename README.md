# Shamba-Sokoni-System

Management system for **Mkulima Mdogo Seedlings** (Nakuru) — a single-file web app (`index.html`) covering sales, bookings, inventory, seedling catalogue, sowing records, propagation, manure, customers (CRM), accounting, employees, attendance, purchases, reports and settings.

## Running

Open `index.html` in a browser. No build step or server is required. Chart.js, SheetJS and Mammoth load from CDNs, so the first load needs internet access.

## Data

All data is stored in the browser's `localStorage` (key `mkulimaDB_v3`), so each browser/device keeps its own copy. Use **Settings → Backup** regularly to download a copy of the data.

## Roles

| Role | Access |
|------|--------|
| Loise | Everything |
| Sales — Managers | Sales, bookings, stock, customers, attendance, reports |
| Sowing Team | Sowing records only (no password) |

## Passwords

Passwords are stored only as salted hashes (never in plain text), both in the code and in saved data/backups. Plain-text passwords saved by older versions are converted automatically the next time the app opens. The first time Loise or Sales signs in with the starter password, they must choose a new one before continuing. Loise can change passwords later under **Settings**.

Note: this is a browser-only app, so these passwords keep casual users out but are not a substitute for server-side security.
