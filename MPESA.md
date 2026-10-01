# M-Pesa payments (Lipa na M-Pesa)

The app takes real M-Pesa payments through Safaricom's **Daraja** service ("STK Push"):

1. On a sale (or when settling credit), choose **M-Pesa** and tap **Request M-Pesa payment**.
2. Check the customer's number and the amount, then **Send request**.
3. The customer's phone shows an M-Pesa prompt; they enter their PIN.
4. Within a few seconds the app shows **✓ M-Pesa received** with the real M-Pesa code (e.g. `SJK4ABC123`),
   fills in the amount paid, and the code is saved on the sale, the receipt and the accounts.

If there is no internet, or the customer paid to the till by themselves, type the M-Pesa code from the
customer's confirmation SMS into **M-Pesa code** instead. Codes are checked for the right format.

Only **Loise and Sales** can take payments. The M-Pesa keys are stored on the server and never reach
the phones.

## Setting it up

You need a Safaricom **Paybill** or **Till (Buy Goods)** number in the company's name, and a free
account on the Daraja portal.

### 1. Test first (free, no real money)

1. Go to https://developer.safaricom.co.ke, create an account and log in.
2. **My Apps → Create new app**, tick **Lipa Na M-Pesa Sandbox** (and **M-Pesa Sandbox**), save.
3. Open the app and copy its **Consumer Key** and **Consumer Secret**.
4. In the Mkulima app, sign in as **Loise → Settings → M-Pesa (Lipa na M-Pesa)**:
   - Mode: **Test (Daraja sandbox)**, Account type: **Paybill**
   - Paste the Consumer key and Consumer secret; leave Paybill number and Passkey blank
     (test mode uses Safaricom's public test Paybill 174379).
   - **Save**, then **Send KES 1 test request** to your own Safaricom number.
5. In test mode Safaricom may not show a prompt on a real phone; the request should still be
   accepted ("Waiting for the customer…"). That proves the keys and the connection work.

### 2. Go live (real payments)

1. On the Daraja portal choose **Go Live**. You'll verify the business with the Paybill/Till
   administrator's details (Safaricom sends an OTP to the admin's phone).
2. Choose **Lipa Na M-Pesa Online** for your Paybill or Till. When approval comes through,
   Safaricom gives you a **production app** (new Consumer Key/Secret) and emails the **Passkey**.
3. In **Settings → M-Pesa** set:
   - Mode: **Live payments**
   - Account type: **Paybill** → Paybill number; or **Till (Buy Goods)** → the **store / head-office
     number** (from the go-live email) *and* the **Till number**
   - Consumer key, Consumer secret, Passkey from Safaricom
4. **Save** and do a KES 1 test with a real phone. It should arrive in the Paybill/Till statement.

Safaricom charges its normal Paybill/Till transaction fees; Daraja itself is free.

## How it works (for whoever maintains the code)

| Piece | Where |
|------|------|
| Payment request / status check | Supabase Edge Function `mpesa-stk` (`supabase/functions/mpesa-stk`), requires a signed-in Loise or Sales user |
| Safaricom confirmation | Edge Function `mpesa-callback` — public URL, accepts only requests with the secret token from `mpesa_config` and only updates a pending payment whose amount matches |
| Keys and settings | Table `mpesa_config` (no app user can read it); saved through `set_mpesa_config()` (Loise only); `mpesa_status()` shows the app whether it is set up, never the keys |
| Payment records | Table `mpesa_payments` (readable by Loise and Sales) |
| App screens | `assets/js/31-mpesa.js`; sale form and credit payment in `assets/js/15-sales.js` |
| Database setup | `supabase/migrations/20261002080000_mpesa.sql` |
| Tests | `tests/mpesa.e2e.js` |

If Safaricom's confirmation is late, the app asks Safaricom directly after 30 seconds (STK Push
Query). That answer has no receipt code, so staff are asked to type it from the SMS; if the
confirmation arrives later it still adds the code to the payment record.
