# Putting Mkulima Seedlings on the Google Play Store

The Play Store app is a thin Android wrapper (a *Trusted Web Activity*) around the live web app at
https://mkulima-seedlings-system.onrender.com. It opens full-screen with no browser bar and uses the same data,
logins, syncing and offline support. **Every update published to the website appears in the Play
Store app automatically**, with no new Store release needed.

Everything in this folder is ready to upload:

| File | Used for |
|------|----------|
| `icon-512.png` | Store listing icon (512 × 512) |
| `feature-graphic-1024x500.png` | Feature graphic (1024 × 500) |
| `screenshots/01…08-*.png` | Phone screenshots (1080 × 1920), in listing order |
| `assetlinks.template.json` | Links the Android app to the website (step 4) |
| This file | Listing text, form answers, step-by-step instructions |

The privacy policy is live at **https://mkulima-seedlings-system.onrender.com/privacy.html** and linked from
the sign-in screen. Please have the company read it and correct anything that doesn't match how you
work (it is written from how the app works, but it is not legal advice).

---

## 0. Decide first

1. **Developer account type** (one-time US$25 at https://play.google.com/console/signup)
   - *Organisation* (Mkulima Seedlings Limited): needs a free **D-U-N-S number** (about 1–2 weeks to
     get, apply at https://www.dnb.com/duns/get-a-duns.html). No testing-period rule. **Recommended.**
   - *Personal*: no D-U-N-S, but new personal accounts must run a **closed test with at least 12
     testers for 14 days** before publishing to everyone.
2. **Web address.** The Android app is tied to one web address. If you plan to use your own
   (e.g. `app.mkulimaseedlings.co.ke`), set it up **before** step 1 below; otherwise the app is tied to
   `mkulima-seedlings-system.onrender.com`.
3. **Package name** (permanent, can never change): suggested `com.mkulimaseedlings.app`.

---

## 1. Build the Android package (about 30 minutes, on a computer)

1. Open **https://www.pwabuilder.com**, enter `https://mkulima-seedlings-system.onrender.com` and click **Start**.
   It should show the app's name, icons, offline support (service worker) and manifest as passing.
2. Click **Package for stores → Android → Generate Package**. Use these options:

   | Option | Value |
   |--------|-------|
   | Package ID | `com.mkulimaseedlings.app` |
   | App name | `Mkulima Seedlings` |
   | Launcher name | `Mkulima` |
   | App version / version code | `1.0.0` / `1` |
   | Host | `mkulima-seedlings-system.onrender.com` |
   | Start URL | `/index.html` |
   | Theme colour / nav colour | `#264B22` |
   | Background (splash) colour | `#EAF5EC` |
   | Icon | `https://mkulima-seedlings-system.onrender.com/assets/icon-512.png` |
   | Maskable icon | `https://mkulima-seedlings-system.onrender.com/assets/icon-maskable-512.png` |
   | Display mode | Standalone |
   | Notifications / location delegation | Off |
   | Fallback behaviour | Custom Tabs |
   | Signing key | **Create new** |

3. Download the zip. It contains the **`.aab`** file (what you upload), an `assetlinks.json`, and the
   **signing key** (`signing.keystore`) with its passwords in `signing-key-info.txt`.

> **Keep the signing key and its passwords safe** (e.g. in the company Google Drive and on a USB
> stick). Every future app update must be signed with this same key.

---

## 2. Create the app in Play Console

1. **Create app** → name `Mkulima Seedlings`, language English (United Kingdom), *App*, *Free*.
2. **Release → Testing → Internal testing → Create release** → upload the `.aab`. Accept
   *Play App Signing* (Google keeps the final signing key; yours becomes the "upload key").
3. Personal accounts: also set up **Closed testing** with 12+ testers' Gmail addresses and keep it
   running for 14 days before applying for production.

## 3. Get the two key fingerprints

Play Console → **Setup → App integrity → App signing**. Copy the **SHA-256 certificate fingerprint**
of both the *App signing key* and the *Upload key*.

## 4. Link the app to the website

Send the two fingerprints to whoever maintains the code (or paste them yourself): put them in
`assetlinks.template.json`, save it in the repository as `.well-known/assetlinks.json`, and push. The
build already publishes that folder. Check it at
https://mkulima-seedlings-system.onrender.com/.well-known/assetlinks.json. Without this file the app still
works, but shows a browser address bar at the top.

## 5. Store listing (Grow → Store presence → Main store listing)

**App name** (max 30): `Mkulima Seedlings`

**Short description** (max 80):
`Sales, sowing, stock & customers for Mkulima Seedlings staff — works offline.`

**Full description** (max 4000):

```
Mkulima Seedlings is the management app for the Mkulima Seedlings nursery team in Nakuru. It brings sales, sowing, stock, customers, staff and accounts into one place, shared live between every phone and computer in the company.

SALES & RECEIPTS
• Record walk-in and credit sales, with discounts and VAT
• Print receipts, quotations, invoices, delivery notes and purchase orders
• Track customers who owe and record payments
• Order book with search and delivery dates

SOWING & STOCK
• Sowing Book with a calendar of what is ready and when
• Move ready seedlings into stock in one step
• Stock levels with stock-in / stock-out
• Seedling catalogue and price list
• Propagation jobs for customers who bring their own seed
• Bookings for customers who order now and collect later

CUSTOMERS
• Customer directory with purchase history and statements
• Follow-up reminders and duplicate detection

STAFF & ACCOUNTS
• Employees, attendance, staff loans, payroll and payslips
• Income, expenses and monthly profit & loss
• Daily summary (Z report) and one-tap printable reports
• Export to Excel and full backups

BUILT FOR THE FIELD
• Works without internet — changes upload automatically when the connection returns
• Every device sees the same records within seconds
• English and Swahili
• Separate access for managers, sales and the sowing team; the Sowing Team opens with one tap

This app is for Mkulima Seedlings staff. Manager and sales accounts are issued by the company.
```

**Swahili translation (optional — Store listing → Manage translations → Swahili):**
- Short: `Mauzo, upandaji, stoka na wateja kwa wafanyakazi wa Mkulima Seedlings.`
- Full: translate the text above, or leave English only.

**Graphics:** app icon `icon-512.png`, feature graphic `feature-graphic-1024x500.png`, phone
screenshots `screenshots/01…08` (upload in that order). The screenshots use demo data, not real
customers.

**Category:** Business. **Contact:** mkulimaseedlings@gmail.com, 0711 844 850,
website https://mkulima-seedlings-system.onrender.com.

## 6. App content (Policy → App content) — suggested answers

| Form | Answer |
|------|--------|
| Privacy policy | `https://mkulima-seedlings-system.onrender.com/privacy.html` |
| Ads | No, the app has no ads |
| App access | *All or some functionality is restricted* → add instructions (below) |
| Content rating | Category *Utility, Productivity, Communication or Other*; answer **No** to all violence, sexual, language, drugs, gambling, user-interaction questions → rated *Everyone / 3+* |
| Target audience | 18 and over; not appealing to children |
| News app | No |
| Government app | No |
| Financial features | None (the app records sales but does not process payments) |
| Health | No |

**App access instructions for Google's reviewers:**

```
This is an internal business app for Mkulima Seedlings staff.
• Tap "Sowing Team" on the sign-in screen — it opens without a password (sowing records, stock, calendar).
• Manager features: tap "Sales — Managers" and use password: <give a temporary password>
```

Tip: before submitting, set a temporary Sales password in **Settings → Passwords**, put it here,
and change it back after Google approves the app.

**Data safety** (what the app stores; users here are staff entering business records):

| Question | Answer |
|----------|--------|
| Does the app collect or share user data? | Yes, collects |
| Is all data encrypted in transit? | Yes |
| Can users request deletion? | Yes — by contacting mkulimaseedlings@gmail.com |
| Data shared with third parties? | No (Supabase and Render are service providers, which Google does not count as sharing) |
| Personal info | **Name, Email address, Phone number, Address** (customer/staff records) — collected, required, purpose *App functionality* |
| Financial info | **Purchase history, Other financial info** (sales, debts, salaries) — collected, required, *App functionality* |
| App activity | **Other actions** (audit trail of changes) — collected, required, *App functionality, Security* |
| Location, contacts, photos, messages, health, device IDs | **Not collected** |

## 7. Release

When internal testing looks good (install it from the test link on a phone, sign in, record a sale),
go to **Release → Production → Create release**, reuse the same `.aab`, and **Send for review**.
Review usually takes a few days. After approval the app appears on the Play Store; staff search
"Mkulima Seedlings" or use the link from Play Console.

## Later updates

- **Changes to the app** (screens, features, fixes): just publish the website as usual — the
  Play Store app shows them immediately.
- **New Android package** (only needed to change the icon, app name, package settings or Android
  version requirements): rebuild in PWABuilder **with the same signing key**, raise the version code
  (2, 3, …) and upload a new release.

## Timeline and cost

| | Organisation account | Personal account |
|---|---|---|
| Fee | US$25 once | US$25 once |
| Waiting | D-U-N-S ~1–2 weeks + Google review ~2–7 days | 14-day closed test + review |
| Total | about 1–2 weeks | about 3–4 weeks |
