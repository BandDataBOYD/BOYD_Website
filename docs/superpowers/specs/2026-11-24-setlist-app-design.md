# Band Setlist App: Design

Date: 2026-11-24
Owner: Kirk (product and business decisions)
Working name: TBD. The name, icon and marketing are generic to cover bands and carry no artist trademarks.

## Intent and why

This is a commercial setlist app for any band playing any kind of music. A band enters the songs it plays, each with a few musical attributes. The app then helps the band build setlists by hand, or builds them automatically: it hits a target set length, follows a chosen energy arc, and orders songs so that each one flows into the next. "Flows" means the outgoing song's last chord sits in a natural relationship to the incoming song's first chord, which is what makes clean segues possible.

Kirk is a working musician and band leader. He sees this as a real gigging tool, not a gadget, and wants to sell it on the App Store and Google Play as a subscription. He has no app development experience. He makes the product and business decisions, sets up the store and service accounts, and tests on real gigs. The builder writes the code.

Kirk's existing band app (built for his own band) served only as an example of the general idea. Nothing from it carries over: no data, no artist-specific rules, no statistics drawn from any real band's history. The new app starts empty for every band.

## Goals

1. A shared band catalog: one song list per band, synced to every member's device.
2. Fast manual setlist building on a phone.
3. An automatic setlist builder that works from set length, an energy arc, tempo and feel, and key-friendly transitions, including runs of songs that segue into each other.
4. A stage mode that works with no signal and follows the leader live when there is signal.
5. A subscription business in which the band pays as a unit, priced by band size.

## Non-goals (v1)

- Chord charts, lyrics or sheet music.
- Gig calendar, contracts, finances or contact management.
- A built-in song database or any preloaded songs.
- Audio playback, backing tracks, metronome or MIDI.
- A web version. The stack allows one later.

## Anti-goals (failure even if it technically works)

- Stage mode showing a blank or stale set because the venue has no signal.
- Auto-built sets that a band would laugh at: three ballads in a row, the big closer buried in the middle, or a jarring key jump where a segue was asked for.
- Set lengths that come out wrong because changeover time between songs was ignored.
- Adding a song feels like paperwork. Most bands will enter their catalog by hand, so adding one song must take seconds, with every field except the title optional.
- Growing into a bloated band-management suite.

## Constraints

- Platforms: iPhone, iPad, Android phones and tablets, and Mac. The Mac version is the iPad app running on Apple Silicon Macs.
- The app must be fully usable offline after the first sync.
- Store requirements: Apple Developer Program ($99/yr) and Google Play ($25 one-time). Each store needs a privacy policy URL, screenshots and a listing. Subscriptions bought in the app go through each store's billing. Apple's Small Business Program brings its cut to 15%.
- If Google sign-in is offered, Apple requires Sign in with Apple too.
- Budget: stay on free tiers through development and the closed beta, which goes to only a few bands. Kirk is fine paying for a database plan (Supabase Pro, roughly $25/month, price to be confirmed) when it's needed, at the latest before the public paid launch.
- No target date has been set.
- Kirk mostly listens to output rather than reading it, so progress reports to him should be plain-spoken.

## Approaches considered

1. **Expo (React Native) + Supabase + RevenueCat** (CHOSEN). One TypeScript codebase produces the iPhone, iPad, Android and Mac (via iPad) apps, and Expo's cloud build service (EAS) handles builds and store submission. Supabase provides accounts, a Postgres database with per-band access rules, and Realtime for live updates. RevenueCat wraps both stores' subscriptions behind one API. The trade-off is that offline-first sync takes real engineering.
2. **Native SwiftUI + iCloud sync.** It's the most polished on Apple devices, with nearly free sync. Rejected because there's no Android version: one Android-using member keeps the whole band off it, which breaks the band subscription.
3. **Wrap a web app in a native shell.** It's the fastest route. Rejected because Apple sometimes rejects thin web wrappers, and offline behavior is weaker.

Kirk approved approach 1.

## Song attributes

Everything except the title is optional, but the auto-builder can only use what's filled in.

- **Title.**
- **Key:** a root note plus major or minor (e.g. A, F#m). An optional free-text mode label (e.g. "mixolydian") is shown in the UI but ignored by scoring in v1.
- **First chord:** the chord the song starts on.
- **Last chord:** the chord the song ends or vamps on. Together with the next song's first chord, it drives segue scoring. A song can vamp out on a chord that isn't its home key, and that vamp is what the next song has to connect to.
- **Length:** approximate minutes, with optional seconds.
- **Energy:** 1 (very mellow) to 5 (peak). This is the main input for arcs.
- **Tempo:** slow, medium or up. An optional BPM can be entered, and when present it's used for finer ordering.
- **Type/feel:** one tag from a default list (ballad, rocker, shuffle, groove/funk, country, blues, jam, latin), plus tags the band adds.
- **Who sings:** one or more band members.
- **Notes:** free text.
- **Archived:** hides the song from building without deleting it.

Entry: a fast add-song form with big tap targets (energy as five buttons, tempo as three, chord pickers instead of typing). A "fill in the gaps" view lists songs missing the fields the builder needs. CSV import uses a column-mapping step, and CSV export is also available.

## Setlists

- A setlist has a name, show date, venue, and one or more sets.
- Each set is an ordered list of items. An item is either a song or a non-song block with a label and length (e.g. "Band intros," "Drum solo," "Break").
- Each transition between items is a **stop** or a **segue** (shown as ">").
- **Changeover time:** each stop adds a gap between songs, 1 minute by default. The gap can be changed per band and overridden per transition. Segues add no gap, because the band plays straight through (my call). Set and show totals always include gaps, and the auto-builder counts them toward the target length.
- Every transition shows a compatibility badge (good, okay, rough) based on the chord rules below, so manual building gets the same guidance as the auto-builder.

## Manual builder

Add songs from the catalog with search and filters (key, energy, tempo, type, singer). Drag to reorder, toggle stop or segue, insert blocks, and split into sets. Running totals per set and per show, including gaps. When you're picking the next song, the picker can sort catalog songs by how well they follow the current last song.

## Auto-builder

The user checks off the parameters they want:

- **Set length** (e.g. 45 minutes), with a tolerance (default ±3 minutes). Gaps count toward the length.
- **Number of sets** (one, or a full night of 2–3 sets with no repeats across sets).
- **Arc:** a preset or a custom curve.
- **Opener:** let the builder choose from the arc, or pin a specific song.
- **Group into segues:** on or off, with a strength (light, medium, heavy). When it's on, the builder forms runs of 2–4 songs joined by segues, where each join is a strong chord relationship, and it marks those joins as segues.
- **Favor smooth transitions between all songs:** on or off. Even with stops in between, it prefers key-friendly neighbors.
- **Must include / exclude** specific songs.
- **Avoid songs played in the last N shows,** based on the band's own saved setlists with past dates.

The builder offers a few candidate sets. The user can regenerate, lock songs they like and regenerate the rest, or open a candidate in the manual builder to edit it.

### Arc presets (energy over the length of the set)

- **Slow build:** starts mellow and climbs to the peak at the end.
- **Mountain:** mellow start, peak in the middle, mellow close.
- **Strong open, strong close:** starts high, dips in the middle, ends high.
- **Breather:** opens high, drops to a mellow stretch, then climbs to a big finish.
- **Party:** high the whole way, with brief one-song dips.
- **Custom:** the user drags a few points to draw the curve.

### How it picks the next song

The builder walks through the set, and at each slot it scores the candidates:

- **Arc direction:** if the arc is rising at that point, the next song should have equal or higher energy, and equal or faster tempo is preferred. If it's falling, the reverse. If it's flat, it should stay close.
- **Chord relationship,** from the previous song's last chord (or its key, if no last chord is set) to the next song's first chord (or its key). Best to worst:
  1. Same chord or root.
  2. A fifth above or below (equivalently, a fourth).
  3. Relative minor or relative major (e.g. A to F#m, or C to Am).
  4. Parallel major/minor, or a whole step apart.
  5. Anything else.
  Segue joins require tier 1–3. Stop transitions use the tiers only as a preference.
- **Variety:** penalize the same type/feel tag back to back, and penalize it heavily three in a row. Also avoid stacking the same lead singer more than three songs in a row.
- **Length fit:** the total, with gaps, has to land within tolerance.

These are scored together across the whole set, so one great pairing can't wreck the rest of the arc. The builder chooses the algorithm (beam search or similar) and the weights.

Missing data: songs missing energy default to 3, missing length defaults to the band's average, and a missing chord or key is neutral in scoring. Candidates that lean heavily on guessed values show a warning.

## Stage mode

Full-screen, high-contrast set view with adjustable text size and a "fit whole set on screen" option. Keeps the screen awake, shows segue arrows, and works fully offline. **Live follow:** a leader taps the song being played, and every member's screen highlights it and scrolls to it in real time when there's signal. Without signal, each device just shows the set, and members can tap along themselves.

## Print / PDF

A printable setlist titled with show date and venue, in large type for taping to the stage floor, one page per set.

## Bands, accounts and sync

- **Accounts:** email sign-in (magic link or code), Sign in with Apple, and Google.
- **Roles:** a band has an owner (the subscriber), editors (can change songs and setlists) and viewers (read-only, can follow stage mode). Members join by invite link or short band code.
- One account can belong to any number of bands and can own more than one (my call: cover musicians often play in several bands).
- Owners and editors count toward the band-size tier, and each band gets two free viewer seats for crew or subs (my call, adjustable when Kirk sets prices).
- **Sync:** every change syncs to every member. Offline edits queue up and sync on reconnect. Conflicts resolve last-write-wins per record (the builder may choose per field). Changes from others appear within a few seconds when online.
- **Ownership transfer:** store subscriptions belong to the buyer and can't be transferred. If the owner leaves, they hand ownership to another member, who starts their own subscription. The band's data stays with the band. If no one subscribes, the band goes read-only after a grace period and is never deleted (my call).

## Business model (decided by Kirk)

- One band subscription bought by the owner, priced in tiers by band size. Invited members don't pay.
- Monthly and annual options, with annual discounted.
- A free trial.
- A cheap solo tier for individual players (one member, no live follow).
- The reasoning: team subscriptions churn much less than individual ones, the main competitor (BandHelper) prices per band scaled by size, and offering both monthly and annual plans tends to bring in more long-term revenue.

Still open for Kirk: price points, tier boundaries and trial length.

## Phasing

1. **Foundation:** accounts, bands and invites, catalog with fast entry and CSV import, manual setlists with gaps and transition badges, offline sync. Runs on Supabase's free tier.
2. **Gig-ready:** stage mode, live follow, print/PDF. Kirk's band uses it at rehearsals and shows.
3. **Auto-builder:** arcs, scoring, segue grouping and candidate sets, tuned against a real catalog with Kirk's judgment.
4. **Beta and launch:** RevenueCat subscriptions, onboarding, privacy policy and store listings. Closed beta via TestFlight and Google Play internal testing with a few bands. Move to a paid database plan if needed, then public release.

A later idea, not in v1: an optional "learn from our history" mode that nudges the builder toward the band's own habitual openers, closers and pairings, drawn from its saved setlists.

## Kirk's to-do list (only he can do these)

Enroll in the Apple Developer Program and the Google Play Console, ideally under a business entity, and join Apple's Small Business Program. Create Expo, Supabase (free) and RevenueCat accounts, or approve the builder setting them up with him. Pick an app name and check that the name and domain are available. Set prices. Line up a few beta bands.

## Left to the builder

Project structure, state management, the local database and sync mechanism (e.g. SQLite with PowerSync on its free tier, or a custom queue), the exact auto-builder algorithm and weights, a UI design that works on a dark stage, testing, and CI/EAS setup. The source code goes in its own new repository.
