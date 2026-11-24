# Setlist Engine Implementation Plan (Plan 1 of 4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the pure TypeScript "musical brain" of the setlist app: chord parsing, transition scoring, set timing with changeover gaps, energy arcs, proportional singer rotation, and the automatic set builder.

**Architecture:** A dependency-free package, `packages/engine`, with one module per concern and a single `index.ts` export surface. It does no I/O and keeps no global state. All randomness comes from a seeded RNG, so builds are reproducible in tests. The Expo app (Plan 2) imports it as a workspace package. The same code runs on the phone, offline.

**Tech Stack:** TypeScript 5 (strict), Node 20+, npm workspaces, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-24-setlist-app-design.md`

**Plan series:** The spec has four independent subsystems, so each gets its own plan. This first plan needs no accounts and can be built and tested immediately.
1. Setlist engine (this plan).
2. App foundation: Expo app, Supabase schema and auth, bands and invites, catalog entry, CSV import, manual builder, offline sync. Needs Kirk's Expo and Supabase (free) accounts.
3. Gig-ready: stage mode, live follow, print/PDF.
4. Beta and launch: RevenueCat, onboarding, store listings, TestFlight and Play internal testing.

**Repository:** A new repository, `setlist-app`, with `packages/engine` inside it. If Kirk hasn't created that repo yet, build in a `setlist-app/` folder on the current branch and move it once the repo exists. Every path below is relative to `setlist-app/`.

## Global Constraints

- The engine has zero runtime dependencies and uses no Node-only APIs, so it runs unchanged in React Native.
- TypeScript `strict: true`. Every public type is exported from `src/index.ts`.
- Deterministic: every function that uses randomness takes a `seed: number`, and the same inputs produce the same output.
- Every song field except `title` is optional. Every function must accept songs with any field missing.
- Default changeover gap is 60 seconds after each **stop**. A **segue** adds 0. There is no gap after the last item.
- Default length tolerance is ±180 seconds.
- Missing energy defaults to 3. Missing length defaults to the average of the known lengths in the catalog, or 240 seconds if no song has a length.
- Energy runs 1–5. Tempo is `'slow' | 'medium' | 'up'`, ordered in that sequence.
- Transition tiers: 1 = same chord, 2 = a fifth up or down, 3 = relative major/minor, 4 = parallel major/minor or a whole step, 5 = anything else, `null` = unknown.
- A segue join requires tier 1–3.
- Singer rotation applies only when the band has two or more distinct solo lead singers. A singer's maximum run before a penalty is `ceil(s / (1 - s))`, where `s` is their share. A share of 1 means no limit.
- No artist, band or song names appear in the source, except as test data.

## Review Focus

1. **Chord spellings people actually type**, such as `Bb`, `A#`, `bb`, `F#m7`, `Asus4`, `E5`, `C/G`, `Cmaj7`, or stray spaces. Root and major/minor should be read correctly, and `maj7` must not be read as minor. (Task 1)
2. **A catalog too small or too short for the target length.** The builder should return its best partial set with a `'short'` warning, never hang or throw. (Task 7)
3. **One very long song,** like a 20-minute jam in a 45-minute set, or songs with a length of 0. The timing stays correct, and the builder doesn't crash or loop. (Tasks 3 and 7)
4. **Must-include songs that together run past the target length.** The builder includes them all and sets an `'over'` warning instead of silently dropping one. (Task 7)
5. **Degenerate catalogs,** such as all songs by one singer, no song with energy set, or no song with chords set. The builder still produces a sensible set: rotation is inactive, energy defaults are used, and transitions are neutral. (Tasks 5 and 7)

---

### Task 1: Package scaffold, core types, chord parsing

**Files:**
- Create: `package.json` (workspaces `["packages/*"]`), `packages/engine/package.json`, `packages/engine/tsconfig.json`, `packages/engine/vitest.config.ts`
- Create: `packages/engine/src/types.ts`, `packages/engine/src/chords.ts`, `packages/engine/src/index.ts`
- Test: `packages/engine/tests/chords.test.ts`

**Interfaces:**
- Produces, in `types.ts`:
```ts
export type Tempo = 'slow' | 'medium' | 'up';
export interface Song {
  id: string; title: string;
  key?: string; firstChord?: string; lastChord?: string;
  lengthSec?: number; energy?: 1|2|3|4|5; tempo?: Tempo; bpm?: number;
  feel?: string; singers?: string[]; archived?: boolean;
}
export interface Block { id: string; label: string; lengthSec: number }
export type SetItem = { kind: 'song'; song: Song } | { kind: 'block'; block: Block };
export interface Transition { type: 'stop' | 'segue'; gapSec?: number } // gapSec overrides the default for a stop
export interface PlacedSet { items: SetItem[]; transitions: Transition[] } // transitions.length === items.length - 1
export interface Chord { root: number; minor: boolean } // root 0–11, C = 0
```
- Produces, in `chords.ts`: `parseChord(input: string | undefined): Chord | null`

- [ ] **Step 1: Write the failing tests** in `tests/chords.test.ts`:
```ts
expect(parseChord('A')).toEqual({ root: 9, minor: false });
expect(parseChord('F#m')).toEqual({ root: 6, minor: true });
expect(parseChord('Bb')).toEqual(parseChord('A#'));          // root 10
expect(parseChord('bb')).toEqual({ root: 10, minor: false });
expect(parseChord(' F#m7 ')).toEqual({ root: 6, minor: true });
expect(parseChord('Cmaj7')).toEqual({ root: 0, minor: false });
expect(parseChord('Amin')).toEqual({ root: 9, minor: true });
expect(parseChord('Asus4')).toEqual({ root: 9, minor: false });
expect(parseChord('E5')).toEqual({ root: 4, minor: false });
expect(parseChord('C/G')).toEqual({ root: 0, minor: false }); // the slash bass is ignored
expect(parseChord('Cb')).toEqual({ root: 11, minor: false });
expect(parseChord('')).toBeNull();
expect(parseChord(undefined)).toBeNull();
expect(parseChord('H')).toBeNull();
```
- [ ] **Step 2: Run** `npm test -w packages/engine`. Expected: FAIL (module not found).
- [ ] **Step 3: Implement `parseChord`.** Trim the input. Read the first character as the root letter, case-insensitive. Read an optional `#` or `b` accidental. The chord is minor if the remainder starts with `m` or `min` but not `maj`. Ignore everything after a `/`.
- [ ] **Step 4: Run** `npm test -w packages/engine`. Expected: PASS.
- [ ] **Step 5: Commit** with `feat(engine): scaffold package, core types, chord parsing`.

---

### Task 2: Transition tiers, badges, next-song ranking

**Files:**
- Create: `packages/engine/src/transitions.ts`
- Test: `packages/engine/tests/transitions.test.ts`

**Interfaces:**
- Consumes: `parseChord`, `Song`, `Chord`
- Produces:
  - `export type Tier = 1|2|3|4|5`
  - `transitionTier(from: Song, to: Song): Tier | null`: compares `from.lastChord ?? from.key` with `to.firstChord ?? to.key`. Returns `null` if either side doesn't parse.
  - `chordTier(a: Chord, b: Chord): Tier`
  - `badge(tier: Tier | null): 'good' | 'okay' | 'rough' | 'unknown'`: tiers 1–3 are `good`, 4 is `okay`, 5 is `rough`, `null` is `unknown`.
  - `rankNextSongs(prev: Song, pool: Song[]): Song[]`: sorted by tier ascending, with `null` after tier 4 and before tier 5. Stable within a tier. Archived songs are excluded.

`chordTier` rules, with `iv = (b.root - a.root + 12) % 12`:
  - Tier 1: same root and same quality.
  - Tier 2: `iv` is 5 or 7 (any quality).
  - Tier 3: `a` major, `b` minor, `iv === 9`; or `a` minor, `b` major, `iv === 3`.
  - Tier 4: same root with a different quality, or `iv` is 2 or 10.
  - Tier 5: everything else.

- [ ] **Step 1: Write the failing tests.**
```ts
const s = (o: Partial<Song>) => ({ id: o.title ?? 'x', title: 'x', ...o }) as Song;
expect(transitionTier(s({ lastChord: 'A' }), s({ firstChord: 'A' }))).toBe(1);
expect(transitionTier(s({ lastChord: 'A' }), s({ firstChord: 'E' }))).toBe(2);
expect(transitionTier(s({ lastChord: 'A' }), s({ firstChord: 'D' }))).toBe(2);
expect(transitionTier(s({ lastChord: 'A' }), s({ firstChord: 'F#m' }))).toBe(3);
expect(transitionTier(s({ lastChord: 'Am' }), s({ firstChord: 'C' }))).toBe(3);
expect(transitionTier(s({ lastChord: 'A' }), s({ firstChord: 'Am' }))).toBe(4);
expect(transitionTier(s({ lastChord: 'B' }), s({ firstChord: 'A' }))).toBe(4);
expect(transitionTier(s({ lastChord: 'A' }), s({ firstChord: 'Eb' }))).toBe(5);
// fall back to the key when chords are missing
expect(transitionTier(s({ key: 'B' }), s({ key: 'E' }))).toBe(2);
// the outgoing last chord wins over its key: a song in E that vamps out on B, into a song starting on B
expect(transitionTier(s({ key: 'E', lastChord: 'B' }), s({ key: 'E', firstChord: 'B' }))).toBe(1);
expect(transitionTier(s({}), s({ key: 'E' }))).toBeNull();
expect(badge(3)).toBe('good'); expect(badge(4)).toBe('okay');
expect(badge(5)).toBe('rough'); expect(badge(null)).toBe('unknown');
// rankNextSongs puts tier 1 first, unknown before tier 5, and drops archived songs
```
- [ ] **Step 2: Run** the tests. Expected: FAIL.
- [ ] **Step 3: Implement** the functions above in `transitions.ts` and export them from `index.ts`.
- [ ] **Step 4: Run** the tests. Expected: PASS.
- [ ] **Step 5: Commit** with `feat(engine): transition tiers, badges, next-song ranking`.

---

### Task 3: Set timing with changeover gaps

**Files:**
- Create: `packages/engine/src/timing.ts`
- Test: `packages/engine/tests/timing.test.ts`

**Interfaces:**
- Consumes: `PlacedSet`, `Song`, `SetItem`
- Produces:
  - `export interface TimingOptions { defaultGapSec?: number /* 60 */; fallbackLengthSec: number }`
  - `fallbackLength(catalog: Song[]): number`: the rounded mean of the positive `lengthSec` values, or 240 if there are none.
  - `itemLength(item: SetItem, fallbackLengthSec: number): number`: a missing length uses the fallback. An explicit 0 counts as 0.
  - `gapAfter(t: Transition, defaultGapSec: number): number`: a segue gives 0, a stop gives `t.gapSec ?? defaultGapSec`.
  - `setDuration(set: PlacedSet, opts: TimingOptions): number` (seconds)

- [ ] **Step 1: Write the failing tests.** Three 300-second songs with two stops total 960. With a segue and a stop they total 960 − 60 = 900. A stop with `gapSec: 120` adds 120. A song with no length in a catalog averaging 250 seconds counts as 250. An empty set is 0, and a one-item set has no gap. A 1200-second song is counted as-is. `fallbackLength([])` returns 240.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement** the functions above.
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** with `feat(engine): set timing with changeover gaps`.

---

### Task 4: Energy arcs

**Files:**
- Create: `packages/engine/src/arcs.ts`
- Test: `packages/engine/tests/arcs.test.ts`

**Interfaces:**
- Produces:
  - `export type ArcPoint = [t: number, energy: number]` (`t` runs 0–1)
  - `export type ArcId = 'slowBuild' | 'mountain' | 'strongOpenClose' | 'breather' | 'party'`
  - `export const ARC_PRESETS: Record<ArcId, { label: string; points: ArcPoint[] }>`, with these exact points:
    - `slowBuild`: `[[0,2],[1,5]]`, label "Slow build"
    - `mountain`: `[[0,2],[0.5,5],[1,2]]`, label "Mountain"
    - `strongOpenClose`: `[[0,4.5],[0.5,2.5],[1,5]]`, label "Strong open, strong close"
    - `breather`: `[[0,4.5],[0.4,2],[1,5]]`, label "Breather"
    - `party`: `[[0,4.5],[1,4.5]]`, label "Party"
  - `arcTarget(points: ArcPoint[], t: number): number`: linear interpolation, with `t` clamped to [0, 1].
  - `arcDirection(points: ArcPoint[], t: number): 'rising' | 'falling' | 'flat'`: uses the slope of the segment containing `t`. Rising if the slope is above 0.5 energy per unit of `t`, falling if below −0.5, flat otherwise.
  - `normalizeArc(points: ArcPoint[]): ArcPoint[]` (for custom curves): sorts by `t`, clamps energy to [1, 5], and adds endpoints at `t = 0` and `t = 1` from the nearest point if they're missing. An empty input becomes a flat line at 3.

- [ ] **Step 1: Write the failing tests.** For `mountain`: target at 0.25 is 3.5, at 0.5 is 5, at 0.75 is 3.5. Direction is `rising` at 0.2, `falling` at 0.8, and `flat` everywhere on `party`. `arcTarget` at t = −1 equals t = 0. `normalizeArc([[0.5,9]])` becomes `[[0,5],[0.5,5],[1,5]]`.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement** the functions above.
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** with `feat(engine): energy arc presets and interpolation`.

---

### Task 5: Proportional singer rotation

**Files:**
- Create: `packages/engine/src/singers.ts`
- Test: `packages/engine/tests/singers.test.ts`

**Interfaces:**
- Consumes: `Song`
- Produces:
  - `leadOf(song: Song): string | null`: returns the single singer when `singers.length === 1`, otherwise `null`. A song with several singers, or none, is neutral.
  - `export interface SingerProfile { active: boolean; share: Record<string, number>; maxRun: Record<string, number>; minGap: Record<string, number> }`
  - `singerProfile(pool: Song[]): SingerProfile`: shares are computed over songs whose `leadOf` isn't `null`. The profile is active only if there are two or more distinct leads. `maxRun = s >= 1 ? Infinity : Math.ceil(s / (1 - s))`. `minGap = Math.floor(1 / s / 2)` (only meaningful when it's 2 or more).
  - `rotationPenalty(sequence: Song[], profile: SingerProfile): number`: returns 0 when the profile is inactive. Otherwise it's +1 for each song that extends a lead's run past `maxRun` (a neutral song breaks a run), plus +1 for each pair of the same lead whose positions are closer than `minGap`, counted only for leads with `minGap >= 2`.

- [ ] **Step 1: Write the failing tests.**
  - One singer, every song theirs: the profile is inactive and the penalty is 0.
  - Two equal singers: `maxRun` is 1 for both. `A,B,A,B` scores 0 and `A,A,B,B` scores 2.
  - 20 songs to 4: `maxRun.A` is 5, `maxRun.B` is 1, `minGap.B` is 3. `A×5,B,A×5,B` scores 0. `A×5,B,B` scores at least 1 (run), and `B,A,B` scores 1 (gap).
  - Three equal singers: `maxRun` is 1 for each.
  - A neutral song between two `A` runs of 5 resets the run.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement** the functions above.
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** with `feat(engine): proportional singer rotation`.

---

### Task 6: Step cost (scoring one placement)

**Files:**
- Create: `packages/engine/src/score.ts`
- Test: `packages/engine/tests/score.test.ts`

**Interfaces:**
- Consumes: `arcTarget`, `arcDirection`, `transitionTier`, `rotationPenalty`, `SingerProfile`
- Produces:
  - `export const WEIGHTS = { energy: 1.0, direction: 1.5, tempoDirection: 0.5, feelRepeat: 0.8, feelTriple: 3.0, singer: 1.0, segueBonus: 0.5 } as const`
  - `export const TIER_COST: Record<Tier | 'null', number> = { 1: 0, 2: 0.3, 3: 0.6, 4: 1.2, 5: 2.0, null: 0.8 }`
  - `export interface ScoreContext { arc: ArcPoint[]; singer: SingerProfile; smoothWeight: number /* 1.0 when "favor smooth transitions" is on, otherwise 0.2 */ }`
  - `stepCost(prefix: Song[], next: Song, t: number, ctx: ScoreContext): number`. Here `t` is the time position (0–1) of `next`'s midpoint. The cost is the sum of:
    - `energy`: `(e - arcTarget)^2`, where `e = next.energy ?? 3`.
    - `direction`: when rising and `e` is less than the previous song's energy, or when falling and `e` is greater. When the previous song is 2 or more above or below the target, the move toward the target isn't penalized.
    - `tempoDirection`: the same rule applied to tempo order. Skipped if either tempo is missing.
    - `smoothWeight * TIER_COST[tier]`: skipped for the first song.
    - `feelRepeat` if `next.feel` matches the previous song's feel, plus `feelTriple` if it matches the previous two (case-insensitive, skipped if missing).
    - `singer * (rotationPenalty(prefix + next) - rotationPenalty(prefix))`.

- [ ] **Step 1: Write the failing tests.** Use a mountain arc at t = 0.2 (rising, target ≈ 3.2) with a previous song at energy 3. A next song at energy 3 costs less than one at energy 2. At t = 0.8 (falling), energy 2 is cheaper than energy 4. A tier-1 chord move costs less than tier 5, and the gap shrinks when `smoothWeight` is 0.2. A third ballad in a row costs at least 3.8 more than a non-ballad. The first song in a set has no tier cost.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement** `stepCost` as specified.
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** with `feat(engine): placement scoring`.

---

### Task 7: Auto-builder, single set

**Files:**
- Create: `packages/engine/src/rng.ts`, `packages/engine/src/builder.ts`
- Test: `packages/engine/tests/builder.test.ts`, `packages/engine/tests/fixtures.ts` (a fictional 40-song catalog with mixed keys, energies, feels and two singers at 30:10, plus a few songs missing fields)

**Interfaces:**
- Consumes: everything above.
- Produces:
  - `rng(seed: number): () => number` (mulberry32)
  - `export type SegueStrength = 'off' | 'light' | 'medium' | 'heavy'`
  - `export interface BuildOptions { targetSec: number; toleranceSec?: number /* 180 */; arc: ArcPoint[]; segues?: SegueStrength /* 'off' */; favorSmooth?: boolean /* true */; mustInclude?: string[]; exclude?: string[]; opener?: string; locked?: Record<number, string> /* position to song id */; defaultGapSec?: number /* 60 */; seed: number }`
  - `export type BuildWarning = 'short' | 'over' | 'guessed'`
  - `export interface Candidate { set: PlacedSet; durationSec: number; cost: number; warnings: BuildWarning[] }`
  - `buildSet(catalog: Song[], opts: BuildOptions): Candidate[]`: returns up to 3 candidates, best first.

The algorithm, which the tests don't fully pin down:
```
pool = catalog minus archived, minus exclude.
Beam search, width 40. Each state holds: songs[], transitions[], elapsedSec, cost.
Position 0 is opts.opener or locked[0] if set; locked positions are fixed.
Expand each state with every unused pool song:
  t = (elapsed + gapBefore + len/2) / targetSec
  cost += stepCost(...) + rng() * 0.15   // jitter, for variety between candidates
  if segues != 'off' and prev exists and tier(prev, next) <= 3 and the current segue run is under 4 songs:
      a segue is chosen with probability {light: .25, medium: .5, heavy: .8} (drawn from the rng)
      when chosen: transition = segue (gap 0), cost -= WEIGHTS.segueBonus
  otherwise transition = stop.
A state is complete when elapsed >= targetSec - tolerance.
  Completed states over targetSec + tolerance are dropped,
  unless mustInclude forced them over (then warning 'over').
Remaining mustInclude songs: add 2.0 * count to the cost of any state whose
  remaining time can't fit them, and only accept completed states that contain them all.
Prune to beam width each round. Stop when the pool is exhausted
  (keep the best partial set with warning 'short') or every state is complete.
Pick 3 candidates whose song sets differ from each other by at least 30%.
Warning 'guessed' when more than 30% of the chosen songs used a default energy or length.
```

- [ ] **Step 1: Write the failing tests:**
  - A 45-minute target with the mountain arc: duration is within 2700 ± 180, and changeover gaps are included in `durationSec`, which equals `setDuration(candidate.set)`.
  - Deterministic: the same seed gives a deep-equal result, and a different seed gives a different first candidate.
  - Mountain shape: the mean energy of the middle third is higher than the mean of the first third and the last third.
  - No archived or excluded song appears, and no song appears twice.
  - `opener` is at position 0, and `locked[3]` is at position 3.
  - `segues: 'heavy'`: at least one segue, every segue join has `transitionTier <= 3`, and no segue run is longer than 4 songs.
  - `segues: 'off'`: every transition is a stop.
  - Singer rotation (30:10 fixture): no run of the main singer longer than `maxRun`, except where the arc forces it. Assert that the run count is at most 1.
  - **Review Focus 2:** a 5-song catalog with a 45-minute target returns a candidate with warning `'short'` within 1 second.
  - **Review Focus 3:** a catalog containing one 1200-second song and songs of length 0 builds without throwing, with duration within tolerance.
  - **Review Focus 4:** must-include songs totaling 3000 seconds with a 2700-second target: all of them are present and the warning is `'over'`.
  - **Review Focus 5:** a catalog with no energy, no chords and one singer builds within tolerance with warning `'guessed'`.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement** `rng` and `buildSet` following the algorithm above.
- [ ] **Step 4: Run** `npm test -w packages/engine`. Expected: PASS, with the full builder suite finishing in under 5 seconds.
- [ ] **Step 5: Commit** with `feat(engine): single-set auto-builder`.

---

### Task 8: Full-night builder and public API

**Files:**
- Modify: `packages/engine/src/builder.ts`, `packages/engine/src/index.ts`
- Test: `packages/engine/tests/night.test.ts`, `packages/engine/tests/api.test.ts`

**Interfaces:**
- Consumes: `buildSet`
- Produces:
  - `export interface NightOptions extends Omit<BuildOptions, 'locked' | 'opener'> { sets: number /* 1–3 */; arcs?: ArcPoint[][] /* per set; defaults to opts.arc for every set */ }`
  - `buildNight(catalog: Song[], opts: NightOptions): { sets: Candidate[]; warnings: BuildWarning[] }`: builds the sets one after another, each excluding songs used in earlier sets. Seeds are `seed + index`. Must-include songs are placed in whichever set first fits them. The night's warnings are the union of each set's warnings.
  - `index.ts` exports every public type and function from Tasks 1–8.

- [ ] **Step 1: Write the failing tests.** Two 45-minute sets from the 40-song fixture have no song repeated across sets, and each set is within tolerance. Three sets from a 12-song catalog include the warning `'short'`. `api.test.ts` imports every name listed in the Interfaces blocks from `../src/index` and asserts each is defined.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement** `buildNight` and complete the exports.
- [ ] **Step 4: Run** the full suite and `npx tsc --noEmit -p packages/engine`. Expected: all tests PASS and 0 type errors.
- [ ] **Step 5: Commit** with `feat(engine): full-night builder and public API`.
