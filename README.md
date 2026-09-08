# Camp Board — Outdoor Ed shared planning board

A Pinterest-style shared board for planning Outdoor Ed camp: pin routes, gear lists, activity ideas, and photos so the whole crew is looking at the same board. Runs on Google Sheets + Apps Script, no database to manage.

It still uses your existing Apps Script deployment:

```
https://script.google.com/macros/s/AKfycbywKJ9E_dCTmjl0PWn-g3DcQKGHhdfPG0AyW_paAlztkfSzLbIVMtIhLuVseFKAYdpc/exec
```

If that URL ever changes (e.g. you redeploy the Apps Script), update `API_URL` at the top of **app.js** and **share-handler.html**.

## What changed in this pass
- Renamed everything from "Pinboard" to **Camp Board**, with copy aimed at Outdoor Ed camp planning instead of a generic board.
- Restyled to look and behave more like Pinterest: masonry grid, a filled "Expand" pill and a link chip that appear on hover, a red/pine/khaki palette instead of plain black-and-white, and Fraunces/Inter type.
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

**2. Build an iPhone Shortcut that posts straight to the board.** This gives you a genuine Share Sheet entry — tap Share on any link, tap the shortcut, done, no need to open the app at all. Steps below.

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
   - URL: paste the same Apps Script URL used above.
   - Method: **POST**
   - Headers: add one — Key `Content-Type`, Value `text/plain;charset=UTF-8`
   - Request Body: **Text**, then tap the field and insert the Text action from step 2 as the value.
5. Optional but nice: add a **Show Notification** action at the end with the text "Added to Camp Board" so you get confirmation it worked.
6. Tap the shortcut's name at the top and rename it **Add to Camp Board**.
7. Tap the settings icon (ⓘ) for the shortcut → turn on **Show in Share Sheet** → under "Share Sheet Types," make sure **URLs** (and **Text**, if you also want to share plain text) is enabled.
8. Done. Now from Safari, Instagram, Photos, or anywhere else with a Share button: tap **Share** → scroll the app icons row → tap **Add to Camp Board** (tap **Edit Actions** at the end of the row first if it isn't listed, then add it and tap Done). It posts straight to the Sheet in the background.

**Limitation to know about:** pins added through the Shortcut use a fixed `author_id` of `iphone-shortcut`, separate from your phone's copy of the installed web app. That means they'll all show a delete button to anyone using this same Shortcut, but the delete button won't show up for pins you add from inside the installed app itself (different device ID), and vice versa. If that's not fine-grained enough for your group, the simplest fix is deleting stray pins directly from the Google Sheet.

## Apps Script API contract (unchanged)
The frontend expects:
- GET `?action=listPins` → JSON containing `pins`
- POST `{"action":"addPin", ...}` → JSON
- POST `{"action":"deletePin", "id":"...", "author_id":"..."}` → JSON

`Code.gs` is included as a compatible backend if you ever need to redeploy it. Put your Google Sheet ID into `SPREADSHEET_ID`, create a `Pins` sheet with headers:

`id | created_at | url | title | author | author_id | category`

Then deploy that Apps Script as a Web App (Execute as: Me, Who has access: Anyone with the link).

## Files
- `index.html` / `styles.css` / `app.js` — the board itself
- `manifest.json` — PWA name, icons, share target
- `share-handler.html` — receives Android Web Share Target shares
- `sw.js` — offline app-shell caching
- `Code.gs` — Apps Script backend (reference/redeploy copy)
- `icon.svg` — fallback vector icon
