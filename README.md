# play-store-submit

A [Claude Code](https://claude.com/claude-code) skill for getting an Expo / React Native Android app onto Google Play for the first time.

Google gives no API for creating an app or uploading its first bundle, and several required forms (content rating, target audience, app access) exist only in Play Console. This skill walks Claude through the whole first submission in a browser:

- building the `.aab` with EAS and preparing store images (including Play's exact 9:16 screenshot rule)
- creating the app and filling every App content declaration: privacy policy, ads, sign-in details, content rating, target audience, data safety, advertising ID, government, financial, health and trader status
- store settings, store listing, countries, production release
- sending for review
- then setting up a service account so later releases go through `eas submit`

It also records the Play Console quirks that otherwise cost an afternoon: which input methods the Angular Dart UI accepts, data safety dialogs that shift indices, the "Leave and discard" trap, trusted clicks for file pickers, and uploading bundles over 50 MB.

## Install

As a plugin:

```
/plugin marketplace add nasimnow/claude-play-store-submit
/plugin install play-store-submit@play-store-submit
```

Or copy the skill folder by hand:

```
git clone https://github.com/nasimnow/claude-play-store-submit
cp -r claude-play-store-submit/plugins/play-store-submit/skills/play-store-submit ~/.claude/skills/
```

## Use

In your app's repo, ask Claude something like "submit this app to the Play Store". You need:

- a Google Play developer account (personal accounts created after Nov 2023 must run a 12-tester, 14-day closed test before production)
- a browser-automation tool Claude can drive (a built-in preview browser, Claude in Chrome, or a Playwright MCP). You sign in to Play Console yourself.
- an EAS project for the build (the console steps work for any Android app)

Claude asks before the final "send for review" step.

## Files

- `SKILL.md`: the procedure and gotchas
- `helpers.js`: page helpers for Play Console (clicking by label, reliable text entry, data safety dialogs, `.aab` injection)
- `serve.py`: a tiny localhost server for injecting large `.aab` files

## License

MIT
