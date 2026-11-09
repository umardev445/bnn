# KhataBanao — Digital Customer Khata

**A second app in the same green/cream design language as the uploaded BillBanao project.** Built with plain HTML, CSS, and JavaScript (no frameworks, npm install, paid APIs, cloud database, or sign-in). Works as a mobile-first website and installable PWA where supported.

## App idea

**KhataBanao – Udhaar & Payment Ledger**: shopkeepers can add customers, record *udhaar diya* (credit given) and *payment received*, and immediately see balances. Each person has a transaction history and printable statement. This is a distinct product from invoice maker BillBanao.

## Publish on GitHub Pages

1. Unzip the download and open the `khatabanao` folder.
2. Upload the **contents inside** that folder to the root of a NEW GitHub repository (for example `khatabanao`). `index.html` must be at repository root.
3. In `assets/config.js`, replace `publisherName` and `supportEmail` with your real public developer details. The live website needs those for your public/legal pages before a public launch.
4. GitHub repo → **Settings → Pages → Deploy from a branch → `main` → `/(root)` → Save**.
5. Open your new HTTPS URL (e.g. `https://username.github.io/khatabanao/`). Add customers and transactions, then take a backup under Settings.

For local testing, open this folder in a terminal and run:

```bash
python3 -m http.server 8000
```

Visit `http://localhost:8000/`. Do not open `index.html` directly as `file://` because JavaScript modules and PWA caching need HTTP(S).

## What works

- Responsive dashboard, side navigation on desktop and bottom tabs on mobile; matches the source BillBanao green/cream visual theme.
- Customer name, phone and notes; add/edit/remove (remove only after deleting all their entries).
- Record, edit, delete, filter and search credit given and payments received.
- Customer ledger, outstanding/advance balance, activity history; no artificial sample records by default.
- Sample demo data is **opt-in** from Settings (clearly marked as examples).
- Monetary calculations use **integer minor units** (no 0.1 + 0.2 rounding error).
- PKR/INR/AED/USD support; changing currency is restricted after entries exist because automatic FX conversion is not implemented.
- English and Urdu, including RTL; light and dark modes.
- Customer statement through browser Print / Save to PDF; CSV export, downloadable JSON backup and confirmed restore.
- Input validation, escaping, customer-record limits, destructive-action confirmation; localStorage only.
- PWA manifest, offline asset cache after one successful HTTPS online visit, and dedicated legal/help pages.
- No ad SDKs, trackers, remote fonts, third-party scripts, server APIs, accounts or payments.

## Important limitations

- **This ZIP is a web app source**, **not an Android Studio project**, compiled APK or AAB. Use your own separate Android wrapper when you are ready; see `ANDROID-NOTES.md`.
- All customer data remains in the **current browser/WebView localStorage**. There is no login, end-to-end encryption, online backup, device sync, automatic recovery or access control. Device loss, app uninstall, clearing storage or browser eviction can permanently erase data; use Download backup regularly. JSON/CSV backups and printed statements are **not encrypted**.
- A plain Android WebView does **not automatically support** generated Blob download/backup/export and `window.print()`. Integrate native download and printing or test and clearly disable the actions in the Android build. Upload/download/file-chooser support needs native review.
- This is a simple ledger, not an accounting, interest, tax or payments processor. Use external reconciliation when accuracy is critical. No WhatsApp automation, SMS, bank sync, or WhatsApp messaging.
- Online hosting requests may create hosting-provider access logs even though the web app doesn't send ledger entries to a server.
- For Google Play, set real publisher contact details, verify your Android wrapper's complete Data Safety disclosures (including any SDKs), ensure privacy links are public, test on real devices and check current Play policies. Approval not guaranteed.

## Data and file boundaries

Only **code and public developer identity/contact** should go into the GitHub repository. Do not commit personal customer records, real transaction data or exported backups. `localStorage` uses `khatabanao:v1` so it does not overwrite BillBanao's data.

- `index.html` — main dashboard
- `assets/app.mjs` — screen views and controls
- `assets/core.mjs` — amount, ledger and validation logic
- `assets/store.mjs` — local saved-data handling
- `assets/i18n.mjs` — English / Urdu translations
- `assets/base.css` — reference BillBanao design styles from your ZIP
- `assets/khata.css` — new KhataBanao styling
- `sw.js`, `manifest.webmanifest` — PWA/offline resources
- `privacy.html`, `terms.html`, `delete-data.html`, `help.html`, `contact.html`, `about.html` — public pages

## Checks

Run `npm test` and `npm run check` (Node 20+). Neither requires `npm install`.

For an Android WebView wrapper, see `ANDROID-NOTES.md`. A native application must use a **different applicationId**, for example `com.khatabanao.app` (check its availability), and load the new deployed HTTPS URL instead of your BillBanao URL.
