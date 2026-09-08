# Camp Board — Outdoor Ed shared planning board

A Pinterest-style shared board for planning Outdoor Ed camp: pin routes, gear lists, activity ideas, and photos so the whole crew is looking at the same board. Runs on Google Sheets + Apps Script, no database to manage.

It uses this Apps Script deployment:

```
https://script.google.com/macros/s/AKfycbzz9GSNzR_KJvljoZMS6ezE05V5uevue7XLxRh5eImapZt2ze0jTQTOBTEcCo_fN0ux/exec
```

**New:** if that URL ever changes, there is now exactly **one** place to update it — the config block at the top of **`config.js`**:

```js
const API_URL = "https://script.google.com/macros/s/.../exec";
```

Both `index.html` and `share-handler.html` load `config.js` before anything else, so a redeploy is a one-line edit instead of hunting through multiple files.

👉 **New here? Start with [`SETUP_SUPER_SIMPLE.md`](./SETUP_SUPER_SIMPLE.md)** — a plain-language, step-by-step walkthrough of the whole setup (Sheet connection, Home Screen install, iPhone Shortcut). Everything below is the fuller reference version.

## Bugs fixed in this pass
- **"Add to Home Screen" popup never went away, even after installing.** `styles.css` had rules like `.install-gate{display:flex}` and `.install-sheet{display:flex}` with no matching `[hidden]{display:none}` rule — in CSS, an author stylesheet's `display` always beats the browser's built-in `hidden`-attribute style, so those panels showed up regardless of what the `hidden` attribute said. Added `[hidden]{display:none!important}` globally, which is the actual fix. Also added a live check (`visibilitychange`/`focus`/`display-mode` listeners) so on Android/desktop the gate now drops the instant install finishes, without needing a manual reload.
- **"Illegal spreadsheet key or URL."** `Code.gs` shipped with `SPREADSHEET_ID = "PUT_YOUR_GOOGLE_SHEET_ID_HERE"` — a placeholder, not a real ID, so `SpreadsheetApp.openById()` threw exactly that error. Rewrote it so, by default, the script just uses whichever Sheet it's attached to (`SpreadsheetApp.getActiveSpreadsheet()`) — no ID needed at all — and auto-creates the `Pins` tab with the correct headers the first time it runs. `SPREADSHEET_ID` is now optional, for people who specifically want a standalone script. See `SETUP_SUPER_SIMPLE.md` for the from-scratch steps.
- Bumped the service worker's cache name so installed copies actually pick up these fixes on next open, instead of serving the old cached files forever.

## What changed in this pass (earlier redesign)
- Renamed everything from "Pinboard" to **Camp Board**, with copy aimed at Outdoor Ed camp planning instead of a generic board.
- Restyled to look and behave more like Pinterest: masonry grid, a filled "Expand" pill and a link chip that appear on hover, a red/pine/khaki palette instead of plain black-and-white, and Fraunces/Inter type. This pass adds real motion throughout — the composer, lightbox, install banners and the install gate all slide/fade in instead of snapping into place.
- Added a profile avatar button (top right) so people can set the name that appears on their pins without opening the composer.
- Added an **install gate** (see below) that only lets the board be used once it's installed to the Home Screen on a phone.
- LocalStorage keys were renamed (`campboard-*` instead of `pinboard-*`), so anyone who used the old version will start with a fresh device ID — existing pins in the Sheet are untouched, but "delete your own pins" permission resets per device.

## The install gate
On iPhone or Android, opening the site in a normal browser tab now shows a full-screen "Add Camp Board to your Home Screen to continue" panel with step-by-step instructions (Safari's Share → Add to Home Screen for iPhone, Chrome's ⋮ menu → Install app for Android) and blocks interaction with the board underneath it. On Android, if the browser supports it, there's also a one-tap **Install now** button.

This only triggers on phones. Desktop/laptop browsers use the board normally, since "add to Home Screen" isn't a meaningful step there.

The gate can't force a browser to "know" it's been installed without a reload from the Home Screen icon — that's an OS limitation, not something a website can bypass. So the panel explicitly tells people to close the browser tab and reopen the app from the icon, not to just refresh.

## Getting shares into the board on iPhone
True "Share to Camp Board" from the iOS Share Sheet (the way Android's Chrome supports Web Share Target) isn't available to installed web apps on iOS — Apple doesn't expose that hook to Safari-based PWAs. Two ways to get a link in from your phone instead:

**1. Open the app and tap "Add a pin."** Fastest if you're already in Camp Board.

**2. Build an iPhone Shortcut that posts straight to the board.** This gives you a genuine Share Sheet entry — tap Share on any link, tap the shortcut, done, no need to open the app at all. Once it exists, the app itself can prompt everyone else to install it too (see "Wiring the Shortcut into the app" below).

### Setting up the "Add to Camp Board" Shortcut
1. Open the **Shortcuts** app → tap **+** (top right) to create a new shortcut.
2. Tap **Add Action**, search for **Text**, and add a Text action. Paste this into it, exactly as written:
   ```
   {"action":"addPin","created_at":"CURRENTDATE","url":"SHORTCUTINPUT","title":"","author":"YOUR NAME","author_id":"iphone-shortcut","category":"idea"}
   ```
3. Now replace the two placeholders inside that text with real Shortcuts variables:
   - Delete `CURRENTDATE` and insert the **Current Date** action's output, formatted as **ISO 8601** (tap the Current Date variable → Format → ISO 8601).
   - Delete `SHORTCUTINPUT` and insert the magic variable **Shortcut Input** (tap inside the text field where you deleted it — Shortcuts will offer it above the keyboard).
   - Replace `YOUR NAME` with your actual name, e.g. `Alex`, so pins you share show who added them.
4. Add a second action: search for **Get Contents of URL**. Configure it:
   - URL: paste the Apps Script URL from the top of this README.
   - Method: **POST**
   - Headers: add one — Key `Content-Type`, Value `text/plain;charset=UTF-8`
   - Request Body: **Text**, then tap the field and insert the Text action from step 2 as the value.
5. Optional but nice: add a **Show Notification** action at the end with the text "Added to Camp Board" so you get confirmation it worked.
6. Tap the shortcut's name at the top and rename it **Add to Camp Board**.
7. Tap the settings icon (ⓘ) for the shortcut → turn on **Show in Share Sheet** → under "Share Sheet Types," make sure **URLs** (and **Text**, if you also want to share plain text) is enabled.
8. Test it: from Safari, tap **Share** on any page → scroll the app icons row → tap **Add to Camp Board** (tap **Edit Actions** first if it isn't listed yet, add it, tap Done). It should post straight to the Sheet in the background.

**Limitation to know about:** pins added through the Shortcut use a fixed `author_id` of `iphone-shortcut`, separate from your phone's copy of the installed web app. That means they'll all show a delete button to anyone using this same Shortcut, but the delete button won't show up for pins you add from inside the installed app itself (different device ID), and vice versa. If that's not fine-grained enough for your group, the simplest fix is deleting stray pins directly from the Google Sheet.

### Wiring the Shortcut into the app
Once the Shortcut above works, get a link for it that anyone can tap to install their own copy:

1. In the Shortcuts app, open **Add to Camp Board** → tap **⋯** → **Share** → **Copy iCloud Link**.
2. Open **app.js** and find the config block right at the top:
   ```js
   /* ============================================================
      CONFIG — the only two lines you should ever need to touch
      ============================================================ */
   const API_URL = "https://script.google.com/macros/s/.../exec";
   const SHORTCUT_URL = "";
   /* ============================================================ */
   ```
3. Paste the link between the quotes on `SHORTCUT_URL`, e.g. `const SHORTCUT_URL = "https://www.icloud.com/shortcuts/xxxxxxxxxxxxxxxxxxxxxxxxxxxx";`
4. Re-deploy/upload the file. That's it — nothing else in the app needs editing.

With `SHORTCUT_URL` set, on any iPhone the app now:
- Shows a **Get iPhone Shortcut** link in the hero, next to "Share board", at any time.
- Shows a one-time banner offering the Shortcut the first time someone opens the installed app on their Home Screen (dismissible, won't nag again).

Tapping either opens Apple's standard "Get Shortcut" preview page for the link you pasted, where the person taps **Add Shortcut** to install their own copy — no code or setup on their end. Leave `SHORTCUT_URL` as `""` and both of those stay hidden.

## Apps Script API contract (unchanged)
The frontend expects:
- GET `?action=listPins` → JSON containing `pins`
- POST `{"action":"addPin", ...}` → JSON
- POST `{"action":"deletePin", "id":"...", "author_id":"..."}` → JSON

`Code.gs` is the backend. Easiest path: create it from **inside your Google Sheet** (Extensions > Apps Script) and leave `SPREADSHEET_ID` blank — it uses that Sheet automatically and builds the `Pins` tab itself:

`id | created_at | url | title | author | author_id | category`

Then Deploy > New deployment > Web app (Execute as: Me, Who has access: Anyone). You can also run the included `setup()` function once from the Apps Script editor to sanity-check the connection before deploying — see `SETUP_SUPER_SIMPLE.md`.

## Files
- `index.html` / `styles.css` / `app.js` — the board itself
- `config.js` — the one place that holds `API_URL` and `SHORTCUT_URL`
- `manifest.json` — PWA name, icons, share target
- `share-handler.html` — receives Android Web Share Target shares
- `sw.js` — offline app-shell caching
- `Code.gs` — Apps Script backend
- `icon.svg` — fallback vector icon
- `SETUP_SUPER_SIMPLE.md` — plain-language setup walkthrough
