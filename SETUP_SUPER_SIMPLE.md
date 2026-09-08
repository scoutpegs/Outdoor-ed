# Camp Board — the easy setup 🏕️

Three jobs, in order. Don't skip ahead.

1. Connect it to your Google Sheet (fixes the error you saw)
2. Put the app icon on your phone's Home Screen
3. (Optional, iPhone only) Add the "share straight to the board" button

---

## 🧩 Job 1 — Connect the Google Sheet

This is the one that was broken. Here's the fix, from scratch, no ID-copying required.

1. Go to **sheets.google.com** and make a **new blank spreadsheet**. Name it anything, like "Camp Board Pins."
2. Click **Extensions** in the menu bar → **Apps Script**. A new tab opens.
3. You'll see a box of sample code in the middle of the screen. Click inside it, press **Ctrl+A** (or **Cmd+A** on a Mac) to select it all, and press **Delete**.
4. Open the file called **Code.gs** from this project (it's in the folder I gave you). Select all the text in it, copy it.
5. Paste it into that empty box from step 3.
6. Click the blue **Deploy** button (top right) → **New deployment**.
7. Click the little **gear ⚙️** icon next to "Select type" → choose **Web app**.
8. Two dropdowns appear:
   - **Execute as:** leave it on **Me**
   - **Who has access:** change it to **Anyone**
9. Click **Deploy**. It will ask you to authorize — click **Authorize access**, pick your Google account, click **Advanced** → **Go to (unsafe)** → **Allow**. (It says "unsafe" only because Google doesn't know this script personally — it's yours, it's fine.)
10. A box pops up with a **Web app URL** ending in `/exec`. Click **Copy**.
11. Open the file **config.js** from this project in any text editor. You'll see a line that looks like:
    ```
    const API_URL = "https://script.google.com/macros/s/.../exec";
    ```
    Delete everything between the quotes and paste your new URL in instead. Save the file.
12. Done. Open the app — it should now say **"Connected"** at the top instead of "Setup needed."

**That's it — no Sheet ID to find or paste anywhere.** The script automatically uses the Sheet you created it inside, and it builds the "Pins" tab with the right columns by itself the first time someone adds a pin.

> Made a mistake? In the Apps Script tab, click the function dropdown near the top (it may say "doGet") and choose **setup**, then click ▶ **Run**. Then **View → Logs**. It will tell you in plain English whether the connection worked.

---

## 📱 Job 2 — Put it on your Home Screen

**iPhone**
1. Open the app's link in **Safari** (has to be Safari, not Chrome or another app).
2. Tap the **Share** button — the square with the arrow pointing up, at the bottom of the screen.
3. Scroll down, tap **Add to Home Screen**.
4. Tap **Add** in the top right.
5. Close this browser tab. Find the new icon on your Home Screen and tap it to open the real app.

**Android**
1. Open the app's link in **Chrome**.
2. Tap the **⋮** (three dots) in the top right.
3. Tap **Install app** (or **Add to Home screen**).
4. Tap **Install**.
5. Open it from your Home Screen or app drawer.

The app will actually walk you through this itself the first time you open it in a browser — this is just the plain-English version.

---

## 🔗 Job 3 — (Optional) iPhone "Add to Camp Board" Shortcut

This lets you tap **Share** on any link, anywhere, and send it straight to the board without opening the app. It's a few more steps, so only do this if you want that shortcut — the app works fine without it (just tap **Add a pin** inside the app instead).

1. Open the **Shortcuts** app on your iPhone (it's a built-in Apple app, silver icon with colored squares — search Spotlight for "Shortcuts" if you don't see it).
2. Tap the **+** in the top right to start a new shortcut.
3. Tap **Add Action**. Type **Text** in the search box, tap the **Text** action.
4. Tap inside the text box that appears and paste this exactly:
   ```
   {"action":"addPin","created_at":"CURRENTDATE","url":"SHORTCUTINPUT","title":"","author":"YOUR NAME","author_id":"iphone-shortcut","category":"idea"}
   ```
5. Now fix the three placeholder words inside what you just pasted:
   - Double-tap **CURRENTDATE** to select it, delete it. Tap **Add Action** again, search **Current Date**, add it — then go back and tap where you deleted CURRENTDATE, and above the keyboard tap the **Current Date** chip to insert it there. Tap that chip once more → **Format** → **ISO 8601**.
   - Double-tap **SHORTCUTINPUT**, delete it. Tap in that same spot — above the keyboard, Shortcuts will show a **Shortcut Input** chip. Tap it to insert it.
   - Double-tap **YOUR NAME**, delete it, type your actual first name instead, like `Alex`.
6. Tap **Add Action** again. Search **Get Contents of URL**, add it.
7. Tap the blue **URL** field, paste the web address ending in `/exec` from Job 1 (same one you put in config.js).
8. Tap **Show More** under that action. Set:
   - **Method:** POST
   - **Headers:** tap **Add new field**, key = `Content-Type`, value = `text/plain;charset=UTF-8`
   - **Request Body:** choose **Text**, then tap that field and pick the **Text** action from step 4 (it'll be a chip near the top of the list).
9. (Nice touch, optional) Tap **Add Action** once more, search **Show Notification**, add it, type "Added to Camp Board" as the text.
10. Tap the shortcut's name at the very top of the screen (it'll say something like "New Shortcut") and rename it **Add to Camp Board**.
11. Tap the **ⓘ** settings icon for the shortcut. Turn on **Show in Share Sheet**. Under "Share Sheet Types," make sure **URLs** is turned on (and **Text** too, if you want).
12. Test it: open Safari, go to any webpage, tap **Share**, scroll the row of app icons — if you don't see it yet, tap **Edit Actions** at the end of that row, add **Add to Camp Board**, tap **Done** — then tap **Add to Camp Board**. You should get the "Added" notification.

All the actions used above (Text, Current Date, Get Contents of URL, Show Notification) are built into every iPhone's Shortcuts app already — nothing extra to download.

Once it works, get a link for it so your whole group can install their own copy in one tap:
- In Shortcuts, open **Add to Camp Board** → tap **⋯** → **Share** → **Copy iCloud Link**.
- Paste that link into `config.js`'s `SHORTCUT_URL` line.
- The app will then show a **Get iPhone Shortcut** button for everyone automatically.

**Heads up:** pins added through the Shortcut all share one "author," so anyone using the Shortcut can delete each other's Shortcut-added pins, but not pins added from inside the app itself (that's a phone-by-phone thing, not something to fix — just know it's there).
