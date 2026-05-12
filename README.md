# Brian Sullivan's U.S. Open Pool — 2026

A self-hosted golf-pool leaderboard, entry form, and live tracker for the 2026 U.S. Open at Shinnecock Hills. Friends pick 21 golfers + a winner + an alternate; the team with the most U.S. Open prize money at the end of Sunday wins the pot.

Originally built for the 2026 Masters pool ([masters-pool-preview](https://github.com/tmcga/masters-pool-preview)) and transitioned in place — the GitHub repo name is now a misnomer.

## Stack at a glance

- **Hosting:** Vercel (static)
- **Data:** Firestore (entries, name claims, chat) — project `us-open-bs-pool`
- **Auth:** Firebase Email Link (passwordless) — no passwords, no PINs
- **Live odds:** Polymarket (with hardcoded DraftKings fallback)
- **Live scores:** ESPN public golf API
- **Build step:** none. HTML + CSS + JS served verbatim.

The whole frontend is three files: `index.html`, `styles.css`, `app.js`. The Firebase JS SDK loads from `gstatic.com` with SRI-pinned hashes.

## Repo layout

```
index.html              Page structure, meta, head, body, tab containers
styles.css              All CSS — USGA navy palette + mobile reflow
app.js                  All JS — Firestore, ESPN, Polymarket, Monte Carlo, renders
firestore.rules         Firestore security rules — deploy to Firebase Console
data/picks.json         Legacy/fallback picks source (Firestore is primary now)
favicon.svg             Navy "U.S. OPEN" monogram
og-banner.jpg           Shinnecock clubhouse photo (used for link previews)
1573241112656.avif      Shinnecock clubhouse photo (used as hero background)
scripts/sync-picks.mjs  DISABLED — legacy Google Sheet → picks.json sync
.github/workflows/      Sync workflow, kept for emergency rollback (manual trigger only)
```

## Run locally

```bash
python3 -m http.server 8765
open http://localhost:8765/
```

Firebase Auth's email-link redirects need `localhost` in the Firebase Console's authorized domains (added by default).

## Firebase project setup (do this once when forking for a new event)

1. **Create a new Firebase project** in the [Firebase Console](https://console.firebase.google.com). Don't reuse an old event's project — historical pools should stay frozen.
2. **Enable Firestore** in production mode. Pick a region (`nam5` for North American friend groups).
3. **Register a web app** under Project settings → General. Paste the resulting `firebaseConfig` block over the placeholder at the top of [app.js](app.js).
4. **Enable Email Link sign-in** under Authentication → Sign-in method: turn on `Email/Password` AND toggle `Email link (passwordless sign-in)` on. **Leave Anonymous OFF** — the rules require verified identity.
5. **Authorize your deployment domain** under Authentication → Settings → Authorized domains. Add the Vercel domain (e.g. `your-app.vercel.app`).
6. **Deploy the rules** under Firestore Database → Rules: paste the contents of [firestore.rules](firestore.rules) and Publish.

## Deploy to Vercel

Vercel detects no framework and serves the files as static. No `vercel.json` needed.

1. Connect the repo in the Vercel dashboard.
2. Vercel auto-deploys on every push to `main`.
3. Vercel Analytics + Speed Insights auto-activate (no setup required; the script tags 404 silently on non-Vercel hosts).

## Key constants worth knowing

All in [app.js](app.js):

| Constant | Purpose | Notes |
|---|---|---|
| `REVEAL_DATE` | First tee — entries lock after this point | UTC; update per event |
| `FORCE_REVEAL` / `FORCE_LIVE` | Preview-mode flags | Both `true` in this preview repo; flip false to test the lock screen |
| `USOPEN_PURSE` / `USOPEN_PAYOUTS` / `USOPEN_MC_PAYOUT` | Prize-money math | Placeholders; verify against the 2025 Oakmont breakdown before play. ESPN's `c.earnings` overrides at FINAL. |
| `POLYMARKET_SLUG` | Live odds market identifier | Verify on polymarket.com once their 2026 market opens (~6 weeks pre-event) |
| `FALLBACK_ODDS` | Static odds + golfer-list seed | Replaced by Polymarket once that's live; entry form sources its picker list from here pre-event |
| `PAST_USO_CHAMPS` | Returning past U.S. Open champions in the field | Powers the ★ badge; sourced from usopen.com/2026/players.html |

## Architecture decisions worth remembering

- **No build step, on purpose.** Edit a file → push → Vercel deploys in 30 seconds. The cost of npm/Next.js/etc. wasn't worth the marginal benefit for an audience of ~20.
- **Firestore is the primary data store**; `data/picks.json` is legacy/fallback. The live snapshot listener (`listenToEntries`) updates the leaderboard instantly as people submit.
- **Email-link auth, not PINs.** PINs were stored in plaintext and publicly readable — a real security hole. Email link gives a verified, durable identity that survives browser data clears and privacy modes (DuckDuckGo, Incognito, Brave). Trade-off: cross-device requires re-clicking an email link.
- **Entries are write-once.** Once submitted, the Firestore rule denies updates. Client UI also locks the form. Both layers are enforced.
- **SRI hashes on the Firebase SDK.** If gstatic.com ever served different bytes, the browser refuses to execute. Regenerate hashes if you bump the SDK version (instructions in index.html).
- **Past-event archive policy:** each event gets its own Firebase project so historical pools stay frozen as a snapshot. The 2026 Masters project (`brian-sullivan-s-masters-pool`) is preserved separately.

## Common gotchas

- **Cross-device friction:** if Brian submits picks on his phone and tries to chat from his laptop, he needs to do the email-link sign-in again on the laptop. His display name will auto-restore because the pins/{name}.uid mapping is durable in Firestore.
- **ESPN doesn't see the U.S. Open until tournament week.** Pre-event, `fetchESPN` logs `not found in feed yet` — expected.
- **Polymarket market may not exist yet.** Pre-event, fetches fail; the static fallback odds kick in.
- **Vercel script 404s on local dev.** The Analytics + Speed Insights scripts are served by Vercel only when actually deployed; locally they 404 harmlessly.

## Roadmap

- [ ] Wire a Vercel cron function to auto-sync the player field from `usopen.com/2026/players.html` (~2 weeks pre-event, once the field has mostly stabilized)
- [ ] Headshots in the entry picker (USGA hosts them at `/players/{id}.html`)
- [ ] "What-If?" simulator — recompute standings with hypothetical score adjustments
- [ ] Email notifications via Resend (free 100/day) for "your golfer made the cut" / "you got passed in standings"
- [ ] Archive link in the footer pointing at last year's frozen Masters pool

## Co-Auth

🤖 Built collaboratively with [Claude Code](https://claude.com/claude-code).
