# Pinboard v2 — Google Sheets / Apps Script

This build uses the new Apps Script deployment URL:

https://script.google.com/macros/s/AKfycbywKJ9E_dCTmjl0PWn-g3DcQKGHhdfPG0AyW_paAlztkfSzLbIVMtIhLuVseFKAYdpc/exec

The exact supplied icon image is used for the favicon, Apple touch icon and manifest icon:

https://images.squarespace-cdn.com/content/v1/67296ef34462bc7a12043dfe/15d2a4db-7072-4f8b-a951-11aa1a6bc718/Outdoor-Education-Service-06.png

## Improvements
- Pinterest-style responsive masonry board
- Search
- Category filters
- YouTube, TikTok, Instagram and Pinterest embeds
- Direct image/video playback
- Generic rich link cards
- Full-screen pin viewer
- Zoom/pan
- Share buttons
- PWA installation
- Web Share Target receiver
- 8-second board polling for new pins
- Per-browser delete protection
- Google Sheets backend
- Exact supplied image URL used as app icon everywhere practical

## Share-sheet limitation
A web app can register as a Web Share Target on supported installed Chromium PWAs, but it cannot force the operating system to put itself first in every Share sheet. The OS/browser controls ranking.

iOS Safari does not currently expose Web Share Target receiving for installed web apps, so iPhone users can still install and use the PWA, but direct native Share-sheet receiving is not something site code can force.

## Apps Script API contract
The frontend expects:
- GET `?action=listPins` -> JSON containing `pins`
- POST `{"action":"addPin", ...}` -> JSON
- POST `{"action":"deletePin", "id":"...", "author_id":"..."}` -> JSON

If your supplied deployment already exposes those actions, no backend code change is needed.

If it does not, the included `Code.gs` is a compatible backend. Put your Google Sheet ID into it, create a `Pins` sheet with:

`id | created_at | url | title | author | author_id | category`

Then deploy that Apps Script as a Web App.
