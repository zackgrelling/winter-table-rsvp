# La Table d'Hiver — RSVP Site

A standalone, $0-cost RSVP website for "La Table d'Hiver" (Sunday, November 15, 2026),
built independently from the original Google Sites page. Plain HTML/CSS/JS — no
build step, no framework, no paid services.

## What's here

```
index.html        The whole site (hero, story, details, RSVP form)
styles.css         Styling (dark, candlelit wine-dinner theme)
script.js          Form validation, submission, spam guards, local persistence
config.js          Event details + the one URL you need to fill in
apps-script/Code.gs  Google Apps Script backend (copy-paste into Google Sheets)
images/            Optional — see images/README.md to add a real photo
```

## 1. Connect RSVP storage (Google Sheets) — ~5 minutes, one time

1. Go to [sheets.google.com](https://sheets.google.com) and create a new blank spreadsheet.
   Name it anything, e.g. "La Table d'Hiver RSVPs".
2. In the sheet, open **Extensions → Apps Script**.
3. Delete the placeholder code in the editor and paste in the full contents of
   [`apps-script/Code.gs`](apps-script/Code.gs) from this project.
4. Click **Deploy → New deployment**.
   - Click the gear icon next to "Select type" and choose **Web app**.
   - Description: anything (e.g. "RSVP endpoint").
   - Execute as: **Me**.
   - Who has access: **Anyone**.
   - Click **Deploy**.
5. Google will ask you to authorize the script (it's your own script, acting only on
   your own sheet) — click through the consent screen (Advanced → Go to project (unsafe)
   is expected for unverified personal scripts; this is normal for scripts you wrote yourself).
6. Copy the **Web app URL** it gives you (ends in `/exec`).
7. Open `config.js` in this project and paste it in:
   ```js
   APPS_SCRIPT_URL: "https://script.google.com/macros/s/XXXXXXXX/exec",
   ```
8. Save, commit, and redeploy the site (see below). RSVPs will now appear as rows in
   your Google Sheet in real time, with a "RSVPs" tab created automatically on first
   submission.

**Viewing/managing RSVPs:** just open the Google Sheet. Each row is one guest's
response (Name, Email, Attending, Guests, Dietary, Note). Submitting the same email
twice updates that guest's existing row instead of creating a duplicate.

## 2. Run it locally

No build tools needed — any static file server works:

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080.

## 3. Deploy for free (GitHub Pages)

1. Create a new **empty** repository on GitHub (no README/license) — easiest via this
   pre-filled link: https://github.com/new?name=winter-table-rsvp&visibility=public
2. From this folder, push it:
   ```bash
   git remote add origin git@github.com:<your-username>/winter-table-rsvp.git
   git branch -M main
   git push -u origin main
   ```
3. On GitHub, go to the repo's **Settings → Pages**. Under "Build and deployment",
   set Source to **Deploy from a branch**, Branch to **main** / **root**, and Save.
4. After a minute, your site is live at:
   `https://<your-username>.github.io/winter-table-rsvp/`

Any future edit: change the files, then `git add -A && git commit -m "..." && git push`.
GitHub Pages redeploys automatically within a minute or two.

## Spam / abuse protection

- A hidden honeypot field catches basic bots (anything that fills every input).
- A minimum-time-on-page check rejects submissions faster than a human could type.
- The Apps Script endpoint validates required fields and email format server-side,
  and uses a lock so two near-simultaneous submissions can't corrupt the sheet.
- No API keys or secrets live in the client code — the Apps Script URL is safe to
  expose publicly; it can only append/update rows in this one sheet.

## Known limitations (free-tier tradeoffs)

- **Hosting URL**: GitHub Pages gives you `username.github.io/winter-table-rsvp`,
  not a custom domain — a custom domain costs money. You can still share this link
  directly or shorten it.
- **Duplicate prevention** relies on the guest's browser (localStorage) remembering
  they RSVP'd, plus a server-side upsert by email. Someone RSVPing from two different
  devices/browsers with the same email will cleanly update one row (not create a
  duplicate) — but if they use two different email addresses, that's treated as two
  guests, same as any RSVP system.
- **Google Apps Script** free tier has generous daily quotas (far beyond what a home
  dinner party needs) but is not designed for high-traffic production apps.
- No photo is bundled (see `images/README.md`) — the hero uses a designed gradient
  + twinkle-light effect instead, so the site looks complete with zero images.
