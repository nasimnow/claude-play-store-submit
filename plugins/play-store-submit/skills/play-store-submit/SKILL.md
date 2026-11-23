---
name: play-store-submit
description: Submit an Expo / React Native Android app to Google Play for the first time (create the app in Play Console, fill every App content declaration, store listing, countries, upload the .aab, send for review) by driving Play Console in a browser-automation tool, then set up eas submit for later releases. Use when asked to publish, submit or release an app on the Play Store / Play Console / Google Play.
---

# Submitting an Android app to Google Play

Google has **no API to create an app or upload its first bundle**, and the content-rating, target-audience and app-access forms exist only in the console. So the first release is done in the browser, and later releases go through `eas submit` (or any Play Developer API client).

This skill assumes an Expo / EAS project. The console part applies to any Android app.

## 0. Before touching the console

1. **Account type.** Personal developer accounts created after Nov 2023 must run a closed test with 12+ testers for 14 days before production access. Organisation accounts skip this. The console home page shows "Organisation account" when it is one. Tell the user before planning a production release on a personal account.
2. **Build the .aab** (start it first, it takes ~20 min):
   `eas build -p android --profile production --non-interactive --no-wait --json`
   Poll with `eas build:list -p android --limit 1 --json --non-interactive` and read `artifacts.applicationArchiveUrl`. Download it to a temp folder.
3. **Collect listing facts from the repo:** app name, description and review notes (an iOS `store.config.json` is a good source), privacy policy / terms / support URLs (check each returns 200), the support email, and the app's SDKs (grep `package.json` for ads, analytics, firebase or tracking) so Advertising ID and data safety are answered honestly.
4. **Make the store images** (Pillow works well):
   - Icon 512×512 PNG, ≤1 MB.
   - Feature graphic 1024×500 PNG/JPEG.
   - Phone screenshots: 2–8, **exactly 16:9 or 9:16**, each side 320–3840 px. iPhone 6.7"/6.9" shots (e.g. 1320×2868) are not 9:16. Pad them onto a 9:16 canvas (e.g. 1620×2880) in the background colour instead of cropping.

## 1. Drive the browser

Use whatever browser automation is available that can run JavaScript in the page, click with trusted events and set files on an `<input type=file>` (a built-in preview browser, Claude in Chrome, a Playwright MCP…). Open `https://accounts.google.com/ServiceLogin?continue=https://play.google.com/console` and **ask the user to sign in in that browser**; 2FA is theirs. Use a desktop-sized viewport (~1400×1000).

Play Console is an Angular Dart app. What works:
- `el.click()` from page JavaScript works for buttons, radios and checkboxes.
- Text: `el.focus(); el.select(); document.execCommand('selectAll'); document.execCommand('insertText', false, value)`. Setting `.value` directly does NOT stick.
- Prefer reading `document.body.innerText` slices over full accessibility snapshots, which are huge.
- Helpers are lost on full navigation; re-define them after a page load. In-app links (`a.click()`, `history.back()`) keep them.
- Keep each evaluate call to one form step; long scripts hit tool timeouts.
- Success check: the toast text `Change saved` and the Save button becoming disabled. Don't regex for "saved|error": help text on the page matches.

Paste `helpers.js` (next to this file) into the page after each full load.

### Gotchas
- **Data safety per-type dialogs**: several hidden dialogs stay in the DOM, so global radio/checkbox indices shift. Always scope to the visible dialog containing "Is this data collected" and match inputs by label text (`__fix` in helpers.js). Re-open each data type afterwards to verify.
- **"Leave and discard" prompt** after editing Store settings can silently drop the contact details even though a toast said saved. Re-check the app dashboard's "Set up your app" list: every item must be ticked, or the release review step says "Your app cannot be published yet. Complete the steps listed on the dashboard."
- **File uploads**: "Add assets" / "Upload" must get a *trusted* click (the automation tool's click on a selector you tagged from JS, e.g. `data-addasset="2"`), then set files on `input[type=file]`. Icon and feature graphic go one at a time; screenshots accept several files in one upload.
- **Large .aab**: some automation bridges cap file transfer (e.g. "Cannot transfer files larger than 50Mb"). Serve the bundle from localhost with `serve.py` (CORS + `Access-Control-Allow-Private-Network`), then call `__aabInject('app.aab')` from helpers.js: it fetches the file and sets it on the `.aab` input through a `DataTransfer`. Stop the server afterwards.
- **Quick checks** flag `android.hardware.screen.portrait` for portrait-only Expo apps. It is harmless for phones: "Proceed anyway" → "Publishing these changes is more critical than fixing this issue" → Ignore issue. Tell the user.

## 2. Order of work in the console

1. **Create app** (`/console/u/0/developers/<devId>/create-new-app`): name (≤30), package name + Check availability, App, Free, tick the 3 declarations. The new app id appears in the URL.
2. **App content** (`/app/<appId>/app-content/overview`). Open each via its "Start declaration" button (`__sec('<heading>')`):
   - **Privacy policy** URL.
   - **Ads**: yes/no.
   - **Sign-in details**: if login is needed, Yes → Add details (name, username, password, instructions, tick "full access") → Add → Save. Give reviewers a working demo account.
   - **Content ratings**: email, category ("All other app types" for most tools), agree to IARC → answer each section (downloaded content, user interaction, online content, age-restricted goods, location sharing, digital purchases, rewards/NFTs, browser, news) → Next → Save.
   - **Target audience**: pick age groups → Next … → Save. 18+ suits business and productivity tools; any under-18 group pulls in the Families policy.
   - **Data safety**: collects data? encrypted in transit? account creation methods → delete-account URL (a public page with the in-app deletion steps and what gets deleted) → data types (one accordion category open at a time) → per type: collected, shared or not, ephemeral or not, required or optional, purposes → Preview → Save.
   - **Advertising ID**, **Government apps**, **Financial features** (payment deep links alone are usually "none"), **Health**, **Trader status** (+ Terms of Service URL) where shown.
   - Done when the overview says "You've caught up with everything".
3. **Store settings** (`/store-settings`): category; contact email + website. Phone is optional and public.
4. **Store listings** → Create default store listing: name, short description (≤80), full description (≤4000), icon, feature graphic, phone screenshots → Next → Save.
5. **Production** (`/tracks/production`):
   - Countries/regions tab → Add countries/regions → search → tick → Save.
   - Create new release → upload the .aab (Play app signing: Google holds the app signing key, your EAS keystore becomes the upload key) → release notes `<en-US>…</en-US>`, using the default listing's language tag → Next → must say "Ready to release" → Save → Go to overview.
6. **Publishing overview** → resolve quick-check issues → "Submit N changes for review" → Send. The status becomes "Changes in review". With managed publishing off, the app goes live on approval; reviews usually take up to 7 days.

Before step 6, confirm with the user that they want it sent; it is the outward-facing step.

## 3. After the first release: automate

Create a Google Cloud service account with a JSON key, invite its email in Play Console → Users and permissions with release rights for the app, and set `submit.production.android.serviceAccountKeyPath` in `eas.json` (gitignore the key). Then `eas build -p android --auto-submit` or `eas submit -p android`. `eas update` still covers JS-only changes.

Record the app id and what was declared somewhere durable (project notes or memory) so later updates stay consistent.
