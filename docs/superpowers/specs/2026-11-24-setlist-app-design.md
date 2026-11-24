# Band Setlist App: Design

Date: 2026-11-24
Owner: Kirk (product decisions)
Working name: TBD (see Constraints: no "Grateful Dead" or "Dead" trademarks in the name)

## Intent and why

Kirk runs Bring Out Yer Dead (BOYD), a Grateful Dead tribute band, and already uses a custom web app for the band's songbook, setlists and stage mode (live at boyd.kirk-48e.workers.dev; its source lives in a separate Cloudflare Worker, not in this repo). That app is built around BOYD: its setlist builder generates sets from what the Grateful Dead actually played in a chosen year.

The idea is to turn the concept into a commercial product for any cover band. Each band enters its own songs, and the app builds setlists from rules any musician recognizes: set length, the energy arc of the set, the feel of each song, and key relationships that make songs flow (or segue) naturally. Kirk wants to sell it on the App Store and Google Play as a subscription. He sees it as a real working tool for gigging musicians, not a gadget.

Kirk has no app development experience. He makes the product and business decisions, sets up the developer and business accounts, and tests on real gigs. The builder writes the code.

BOYD becomes the first customer. "Does everything the BOYD app does" means: songbook with singers, key, notes, search and archive; multi-set setlists with show date, venue, segue markers and non-song blocks like Drums and Space; stage mode with text sizing, fit-to-screen and screen wake; print; and CSV export. The BOYD app's "build from a Grateful Dead year" feature depends on Dead show data and is not carried over (see the open question below). Once the new app does all that, BOYD moves its catalog over and the old app is retired. Until then the BOYD app keeps running unchanged.

## Goals

1. A shared band songbook: one catalog per band, synced to every member's device.
2. Manual setlist building that is fast on a phone.
3. An automatic setlist builder driven by target length, an energy arc, feel variety, and key-friendly transitions.
4. A stage mode that works with no signal at all and follows the leader live when there is signal.
5. A subscription business: the band pays as a unit, priced by band size.

## Non-goals (v1)

- Chord charts, lyrics, or sheet music. That's OnSong's territory, and lyrics carry licensing problems.
- Gig calendar, contracts, finances, contact management. That's BandHelper's territory.
- Any built-in song database. Bands enter their own songs. No Dead-specific data ships with the app.
- Audio playback, backing tracks, metronome, MIDI control.
- A web version. The stack allows one later.

## Anti-goals (failure even if it technically works)

- Stage mode that shows a blank or stale set because the venue has no signal.
- An auto-builder whose sets the band laughs at: three ballads in a row, a high-energy closer buried in the middle, or a jarring key jump where a segue was asked for.
- Turning into a bloated band-management suite. The app stays focused on songs and sets.
- Paperwork the band has to fight: adding a song should take seconds, with every field except the title optional.

## Constraints

- Platforms: iPhone, iPad, Android phones and tablets, and Mac. The Mac version is the iPad app running on Apple Silicon Macs, not a separate build.
- Must be fully usable offline after the first sync. Venues have bad Wi-Fi and bad cell coverage.
- Store requirements: Apple Developer Program ($99/yr) and Google Play ($25 one-time), both under Kirk's name or his business. Each store needs a privacy policy URL, screenshots and a listing. Digital subscriptions sold inside the app go through each store's billing system. Apple's Small Business Program brings its commission to 15%.
- If the app offers Google sign-in, Apple requires Sign in with Apple too.
- Trademarks: no "Grateful Dead," "Dead," Steal Your Face, dancing bears or similar in the app name, icon or marketing. It's marketed to cover bands generally.
- Kirk listens to most output instead of reading it, so the builder's progress reports to him should be plain-spoken.

## Approaches considered

1. **Expo (React Native) + Supabase + RevenueCat** (CHOSEN). One TypeScript codebase produces the iOS, iPadOS, Android and Mac (via iPad) apps, and Expo's cloud build service (EAS) handles builds and store submission, so Kirk doesn't have to run Xcode builds himself. Supabase provides accounts, a Postgres database with row-level security per band, and Realtime for live updates. RevenueCat wraps App Store and Google Play subscriptions behind one API and webhook. Trade-off: offline-first sync takes real engineering.
2. **Native SwiftUI + CloudKit.** It's the most polished on Apple devices and sync is close to free. Rejected because it has no Android version: one Android-using member keeps the whole band off the app, which breaks the band-wide subscription model.
3. **Wrap the existing BOYD web app (Capacitor or similar).** It's the fastest route. Rejected because Apple sometimes rejects thin web wrappers, the existing app is a single large file built around BOYD, and its offline support is minimal (it polls every 15 seconds while open).

Kirk approved approach 1.

## Data model

All fields except the song title are optional.

**Song**
- Title
- Key: a root note plus major or minor (e.g. E, F#m). An optional free-text mode label (e.g. "mixolydian") is shown in the UI but ignored by the transition scoring in v1.
- First chord: the chord the song starts on.
- Ending chord or vamp: the chord the song ends or vamps on, when it's different from the key. This field drives segue scoring. Example: Scarlet Begonias ends vamping on B. Fire on the Mountain is in E and starts on B, so the B vamp into Fire's first chord is a perfect match, and the two keys are a fifth apart.
- Length: approximate minutes. Seconds are optional.
- Energy: 1 (very mellow) to 5 (peak).
- Feel: one tag from a default list (ballad, mid-tempo, up-tempo, shuffle, groove/funk, jam vehicle). The band can add its own tags.
- Who sings: one or more band members.
- Notes: free text.
- Segue-friendly flag: optional, marks songs that work well going into or out of a segue.
- Archived: hides the song from building without deleting it.

**Setlist**
- Name, show date, venue.
- One or more sets, each an ordered list of items.
- Each item is either a song or a non-song block with a label and length (e.g. "Drums," "Space," "Band intros," "Break").
- Each transition between two items is either a stop or a segue (shown as ">", the Deadhead convention).

**Band and membership**
- A band has one owner (the subscriber), editors (can change songs and setlists) and viewers (read-only, can follow stage mode). The roles are my call. Kirk can simplify them to just owner and members.
- Members join by invite link or short band code. This replaces the BOYD app's shared code with real per-person accounts.
- My call: one account can belong to any number of bands and can own more than one, because cover musicians often play in several. The band switcher sits in the app's top bar.
- My call: owners and editors count toward the band-size tier. Each band also gets two free viewer seats for crew or subs (sound tech, fill-in player). Kirk can change this when he sets prices.
- My call: a store subscription belongs to the person who bought it and can't be transferred. If the owner leaves, they hand ownership to another member, who then starts their own subscription. The band's data always stays with the band. If no one subscribes, the band goes read-only after a grace period and is never deleted.

## Features (v1)

**Songbook.** Add, edit, archive and search songs, and filter by key, feel, energy or singer. Import from CSV, with a column-mapping step. Export to CSV. BOYD's catalog moves over this way. The BOYD app's export has these columns: title, singers, one yes/no column per member (Kirk, Jonas, CJ, Clay) plus ALL, key, notes, archived, created_at and updated_at. It has no length, energy, feel, first chord or ending chord, so those have to be filled in after import. The songbook gets a fast "fill in the gaps" pass for this: a list of songs missing data, with tap-to-set energy and feel. My call: for BOYD's own migration, the builder may draft those missing values outside the app as a one-time job for Kirk to correct, so nobody types 150 songs from scratch. Nothing like this ships in the product.

**Manual setlist builder.** Add songs from the catalog, drag to reorder, toggle stop or segue between items, insert non-song blocks, and split into multiple sets. Running totals per set and per show. Every transition shows a small compatibility badge (good, okay, rough) based on the key rules below, so a manual set gets the same guidance the auto-builder uses.

**Auto-builder.** The user picks:
- Target length per set (e.g. 45 minutes), with a tolerance (default ±3 minutes).
- Number of sets (one set, or a full night of 2–3 sets with no song repeated across sets).
- An arc, from the presets below or a custom curve drawn by dragging a few points.
- Optional: songs that must be included, songs to exclude, "favor segues" (how hard to push key-friendly transitions), and "avoid songs played at the last N shows" (uses saved setlists with past dates).

Results: the builder offers a few candidate sets. The user can regenerate, lock songs they like and regenerate the rest, or open a candidate in the manual builder to tweak it.

Arc presets (energy over time through the set):
- **Slow build:** starts mellow, climbs steadily, ends at the peak.
- **Mountain:** mellow start, peak in the middle, mellow close. (Kirk's example.)
- **Strong open, strong close:** high, dips in the middle, high again.
- **Breather:** opens high, drops to a mellow stretch, climbs back to a big finish.
- **Party:** stays high throughout, with brief one-song dips.
- **Custom:** user-drawn.

Scoring intent (the builder picks the algorithm; beam search or similar is expected):
- **Energy fit:** each song's energy should track the arc's target at that point in the set.
- **Length fit:** total length lands within the tolerance.
- **Feel variety:** penalize the same feel tag back to back, and penalize it heavily three in a row.
- **Transitions:** compare the outgoing song's ending chord (or its key, if no ending chord is set) to the incoming song's first chord (or its key). Best to worst:
  1. Same root.
  2. A fourth or fifth apart.
  3. Relative major/minor (e.g. A and F#m).
  4. Parallel major/minor, or a whole step apart.
  5. Anything else.
  When "favor segues" is on, the builder should produce some segue pairs and score those transitions more strictly.
- **Missing data:** songs with no energy, key or length can still be placed by hand. The auto-builder treats missing energy as 3 and missing length as the band's average, and ignores missing keys in transition scoring. It warns when a candidate set depends heavily on guessed values.

**Stage mode.** Large, high-contrast, full-screen set view, with adjustable text size and a "fit whole set on screen" option. Keeps the screen awake. Shows segue arrows. Works fully offline. **Live follow:** a leader (owner or editor) taps the song being played, and every member's stage view highlights it and scrolls to it in real time when they have signal. Without signal, each device just shows the set, and members can tap along themselves. This feature is new. The BOYD app highlights the current song only on the device doing the tapping.

**Print / PDF.** Printable setlist titled with show date and venue, in large type suitable for taping to the stage floor, one page per set.

**Sync.** Every change syncs to every member. Edits made offline queue up and sync when the device reconnects. Conflicts resolve last-write-wins per record (the builder may choose per field). Changes from other members appear within a few seconds when online.

**Accounts.** Email sign-in (magic link or code), Sign in with Apple, and Google sign-in.

## Business model

Decided by Kirk:
- One band subscription bought by the band owner, priced in tiers by band size (e.g. up to 4 members, up to 7, up to 12). Invited members don't pay.
- Monthly and annual options, with annual discounted.
- A free trial.
- A cheap solo tier for individual players (one member, no live follow).
- The evidence behind this choice: team subscriptions churn far less than individual ones, the main competitor (BandHelper) uses band pricing scaled by size, and offering both monthly and annual plans tends to bring in more long-term revenue than annual alone.

Left open for Kirk: the actual price points and tier boundaries, the trial length, and what a lapsed band sees. My suggestion is read-only access to its data, never deletion.

## Phasing

1. **Foundation:** accounts, bands and invites, songbook, manual setlists, offline sync, CSV import. BOYD imports its catalog and uses the app at rehearsal.
2. **Gig-ready:** stage mode, live follow, print/PDF. BOYD uses it at real shows alongside the old app.
3. **Auto-builder:** arcs, scoring and candidate sets, tuned against BOYD's real catalog and Kirk's judgment.
4. **Store launch:** RevenueCat subscriptions, onboarding, privacy policy, store listings, TestFlight and Play internal testing with BOYD and two or three friendly bands, then public release.

## Kirk's to-do list (things only he can do)

Enroll in the Apple Developer Program and the Google Play Console, ideally under a business entity. Sign up for Apple's Small Business Program. Create Expo, Supabase and RevenueCat accounts, or approve the builder doing so on his behalf. Choose an app name and check that the name and domain are available. Decide on prices. Recruit two or three test bands.

## Left to the builder

Project structure, state management, the local database and sync mechanism (e.g. SQLite with a sync layer such as PowerSync, or a custom queue), the exact auto-builder algorithm and weights, the UI design system (it should feel at home on a dark stage; the BOYD app's dark, warm palette is a good reference), the testing approach, and the CI/EAS configuration. The source for the new app goes in its own new repository, not in the BOYD website repo.
