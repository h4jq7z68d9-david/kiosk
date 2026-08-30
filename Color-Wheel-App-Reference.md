# Color Wheel App — Architecture & Design Reference

## Where this lives

- **`color-wheel-app.html`** — the tool itself. Single-file HTML, no build
  pipeline, no framework. Everything in this document is about this file.
- **`color-theory.html`** — site-chrome wrapper (nav/header/footer matching
  the rest of the public site). Has two tabs: "Wheel" embeds
  `color-wheel-app.html` in an iframe; "Cards" lazily loads
  `color-theory-app.html` (a separate flashcard study deck) on first switch.
- **`color-theory-app.html`** — the flashcard deck. Not covered here; it's a
  sibling tool, not part of the wheel's own code.

If you're starting a session to work on the wheel, read this document before
diving into `color-wheel-app.html`'s source — a lot of what looks like an
odd choice in the code (a non-neutral "black," saturation normalized to an
oddly specific 74%, naming that reads a color's actual pixels instead of its
recipe) is the result of real back-and-forth, not a guess. The reasoning
matters as much as the code, because several early instincts here turned
out to be wrong in instructive ways.

-----

## The one thing to understand before anything else

**This is a teaching tool for painters, not a physics simulation.**

Partway through this project, real pigment mixing (Kubelka-Munk theory, via
a library called spectral.js) was integrated to fix a specific complaint:
mixing yellow with black just made a duller yellow, when in reality it
drifts toward olive/green. The library fixed that — and simultaneously
broke something far more important: it turned out spectral.js's reflectance
reconstruction thinks Yellow's "true" opposite is close to Blue, not
Violet. That silently broke the classic Yellow-Violet complementary
relationship, and Red+Blue stopped making a recognizable Violet at all —
both are foundational lessons this tool exists to teach.

**The lesson that came out of that: physical accuracy and teaching accuracy
are not the same goal, and for a tool like this, teaching accuracy wins
every time.** The wheel's own intended relationships (Yellow+Blue=Green,
Red+Blue=Violet, and so on) are *guaranteed* by the wheel-position math
below — not simulated, not hoped for. Any future temptation to reach for "a
more realistic model" should be weighed against this history first. If a
specific realistic behavior is worth having (see the black-tinting model
below), it should be hand-tuned and scoped narrowly, not imported wholesale
from a library that doesn't know or care about the wheel's own geometry.

-----

## The palette — `HUES12` / `HUES24`

Twelve named hues, hand-picked hex values, **saturation normalized to a
uniform 74% across all twelve**. It wasn't always this even — the original
values ranged from 36% (Violet) to 92% (Yellow-Orange), with the whole
cool/violet half of the wheel noticeably duller than the warm half. That
meant anything mixed from Blue, Violet, or Blue-Violet inherited a lower
chroma ceiling than anything mixed from Red or Orange, independent of the
actual color theory being taught. 74% was chosen empirically by comparing a
plain floor (raise only the low ones) against a uniform target (raise low
ones, gently lower the couple that were already above it) — the uniform
version read as more consistent on the physical wheel without tipping into
neon/synthetic-looking colors at 85%+.

**`HUES24`** isn't a separate palette — it's the same twelve hues plus one
new tertiary hue interpolated exactly halfway between each adjacent pair
(named e.g. `"Red/Red-Orange"`), generated once at load via real HSL
interpolation. Every 12-hue position is pixel-identical at 24-hue
resolution; toggling 12→24 is lossless, toggling 24→12 will visibly
re-snap a needle sitting on a tertiary position to its nearest 12-hue
neighbor (expected, not a bug).

Resolution-aware helpers: `activeHues()` returns whichever array is
current, `stepDeg()` returns `360/wheelSize`. Nearly every geometry
function in the file (`angleToIndex`, `hueAtRotation`, `wheelHslAt`,
tick/wedge rendering, drag snap tolerance) reads through these two rather
than hardcoding 12 or 30°.

-----

## The wheel & needles

Up to **4 needles total** (Base + 3 more) — capped there deliberately,
matching the Tetradic relationship already taught elsewhere in the tool.
Each needle has a distinct visual style (arm length, hub size, fill color)
so overlapping needles stay individually grabbable; hit-testing measures
actual screen-space distance to each needle's rendered tip, not just angle,
since a shorter needle's tip can be angle-closer to a touch than its own
physical position would suggest.

**A subtle but important fix:** a needle's *visual* rotation can rest
anywhere while dragging, but the *color it represents* is always snapped to
its wedge's exact center (`snappedAngle`) before entering any color math.
Without this, a needle resting 17° into a flat, visually-unchanging "Red"
wedge would already compute as partially blended toward Red-Orange — a
gradient hiding under a wheel that looks like solid blocks. Blending only
ever happens *between* distinct chosen hues, never *within* one.

-----

## The mixing engine — wheel-position math

`blendAngles(entries)` treats each active color as a unit vector at its
wheel angle, scaled by its weight, and sums them. The resulting vector's
**angle** is where the blend sits on the wheel — by construction, this
matches the wheel's own designed relationships (Yellow+Blue always lands
exactly on Green's position, Red+Blue always lands exactly on Violet's,
because those are their real positions). The vector's **magnitude** says
how much the colors agree: 1 = fully reinforcing (a pure color, or several
clustered analogous hues), 0 = fully canceling (two exact complements at
50/50, or a full primary triad at equal thirds — both genuinely read as
muddy gray, which is correct).

`hexFromBlend(angle, magnitude)` turns that into an actual color:
saturation and lightness are pulled toward neutral only as magnitude
approaches 0, via a curve (`Math.pow(1-magnitude, 3.5)`) that stays
essentially untouched until magnitude is genuinely low — so an analogous
or triadic mix stays vivid, and only real cancellation goes muddy.

This is the same math for 2, 3, or 4 active colors — nothing is
special-cased per count, and it doesn't touch spectral.js or any other
external library. **All six complementary pairs neutralize symmetrically**
under this model, which was not true under the spectral.js version (it only
got 5 of 6 right, and inconsistently).

-----

## Tint & Shade — the adaptive black model

This is the part that took the most iteration, and the reasoning is worth
preserving in full, because it's easy to accidentally regress.

**White (`tint`)** is a plain linear RGB blend toward `(255,255,255)`.
Real titanium white is close to neutral, which is why it's the standard
studio white — no special handling needed.

**Black (`shade`) is not neutral, and not a plain linear blend.** Two
separate real phenomena are modeled here, both researched rather than
guessed at:

1. **Black pigments carry a cool undertone.** Most real blacks (Mars
   Black and similar) aren't perfectly neutral. `BLACK = {r:2, g:10, b:18}`
   — deliberately not `(0,0,0)`.

2. **Yellow has almost no resistance to black, and Red/Blue have a lot.**
   Painters and pigment suppliers consistently describe Yellow as the
   *weakest* of the primaries against black — "a single brush tip changes
   everything" — while red and blue hold their own hue identity much
   longer before giving way. The geometric reason: Yellow's red and green
   channels start out very close together (in the current palette, R=224
   G=193, a gap of only 14% of the max channel), so it takes very little
   push for green to overtake red and reveal an olive cast. Red's own R-G
   gap is 73%; Blue's is 40%. Much more room before anything "crosses
   over."

   This is implemented as `vulnerability = max(0, 1 - rgGap/0.3)`,
   translated into a curve exponent (`k = 1 + vulnerability*5`) applied
   **only to the red channel's** decay toward black. Green and blue decay
   at the plain linear rate. This split was itself a fix for a real bug:
   an earlier version applied the aggressive curve to all three channels
   at once, which meant Yellow's hue-shift and its overall darkening
   happened together — by the time it crossed into green, it was already
   too dark to read as anything but near-black. Decoupling red's decay
   from green/blue's is what makes the olive stage genuinely visible at a
   moderate, legible darkness (starting around 10% black) rather than a
   blink-and-you-miss-it sliver right before black.

   A single global curve (not scaled per-color) was tried and rejected:
   any curve strong enough to move Yellow quickly also rushed Red and Blue
   to near-black far too fast, which contradicts the same research (red
   and blue are supposed to resist).

**If this ever looks wrong again:** check whether a change accidentally
re-coupled the R channel's curve to G/B, or whether the `0.3` threshold /
`5` multiplier need recalibrating — don't reach for a general-purpose
"realistic" library to fix it. That's the mistake that started this whole
detour.

-----

## Naming system

`colorNameCore(hueName, s, l)` is the shared logic once a hue identity is
resolved: White/Black at the lightness extremes, Gray/Charcoal/Light Gray
below 10% saturation, Pink and Brown as special cases (red-family +
light+saturated, orange-family + dark), Light/Dark/Muted prefixes
otherwise (Muted threshold is 0.45, recalibrated after the 74% saturation
normalization — it was 0.35 against the old, unevenly-saturated palette).

Two different ways to resolve *which* hue name feeds into that:

- **`colorName(wheelAngle, s, l)`** — for a pure reference position on the
  wheel (relationship partners via `wheelColorAtOffset`). These are always
  anchored to a real wheel angle by construction, so a simple angle-to-index
  lookup is correct and sufficient.
- **`nearestHueNameForRawHue(h01)`** — for an actual mixed/toned result.
  Compares the color's own real hue against each swatch's own real hue,
  not wheel-index position. This matters because `shade()`'s cool-black
  bias can genuinely shift a color's hue (that's the whole point) — a
  wheel-angle-based name would keep saying "Yellow" long after the pixel
  values have visibly gone olive. This is deliberately simpler than an
  earlier, abandoned version built to compensate for spectral.js's
  reflectance drift (which needed a whole bias-direction lookup table and
  still had an oscillation bug); the current black model is simple and
  predictable enough that a plain nearest-match works fine.

`stageResultName(count)` / `resultName()` build the actual displayed name
by applying White/Black to the chain's blended hex, then running the
result through `nearestHueNameForRawHue` + `colorNameCore`.

-----

## Relationships & flashcards

`getRelationships()` returns Complementary/Analogous/Triadic/Split-Comp/
Tetradic as **fixed absolute-degree offsets** (180°, ±120°, ±150°/210°,
90°/180°/270°) — geometrically true regardless of the current wheel
resolution. **Analogous is the one exception**, computed as `±stepDeg()`
since "the adjacent named hue" is inherently resolution-relative — tighter
neighbors at 24-hue than at 12-hue, which is correct.

The readout describes the **current Result**, not the raw Base needle —
with no mix built, Result equals Base exactly, so this changes nothing in
the simple case; it only diverges once something's actually been mixed.
Tapping a relationship's label expands a plain-language explanation
(`RELATIONSHIP_INFO`), filled in with whatever colors are actually showing
in that row right now, not a canned example.

Warm/Cool is `isWarmAngle(deg)` — a plain wheel-angle range check
(roughly 315°→135° through 0° = warm), not a name lookup. It used to be a
hardcoded `Set` of hue-name strings, which broke the moment 24-hue mode
introduced tertiary hues with names never in that list.

-----

## The mixer (multi-color chain)

Base plus up to 3 additional colors, added one at a time via "+ Mix."
Each additional color has a ratio slider representing "how much of this
new color goes into the running mix so far." `computeChainWeights(ratios)`
cascades those down from the most recently added backward — leaving every
ratio at its default (`1 / stage count`) reproduces an even N-way split
automatically (three colors at defaults → exactly 1/3 each).

Slider labels are dynamic and live: the first slider's left anchor is
always Base's own name; every slider after that shows what the running
mix *actually reads as* at that point (via `stageResultName`), including
current White/Black amounts — so it can say "Gray" or "Muted Yellow"
instead of a generic "Mix 2," and that label updates in real time as an
earlier slider moves.

Chain chips in the UI show the **raw picked hues**, not cumulative blends
— you always see exactly what you selected, even though the math
underneath is cascading. Removing the Base chip promotes the next color in
the chain to become the new Base.

-----

## The palette (saved colors)

Persisted to `localStorage`, capped at 6, FIFO on overflow. Each saved
entry stores a full recipe (`{colors, ratios, whiteAmt, blackAmt}`) —
tapping a saved swatch expands `describeRecipe()`, a plain-text breakdown
of exactly what was mixed and in what proportions. Entries saved before
this feature existed degrade gracefully (a fallback message, not a crash).

**Reordering:** a "Light→Dark" button that toggles to "Dark→Light" on each
press (and resets to the neutral "Light→Dark" label if you manually drag,
since neither sorted label is true anymore after that) — plus real
drag-to-reorder via pointer events. The drag implementation is worth
understanding if it ever needs touching: during the drag, only the actual
DOM node is moved (`insertBefore`), never re-rendered — rebuilding the
row's `innerHTML` mid-drag would tear out the exact element the finger is
on and kill the gesture. The palette array and `localStorage` only update
once, on release, by reading the final visual order back out of the DOM.

**Save Palette:** generates a PNG on canvas (swatch + name + recipe text,
row height auto-growing to fit wrapped text) and opens it in a new tab via
`window.open` on an object URL — deliberately *not* a forced download and
*not* an explicit `navigator.share()` branch. Letting the browser/OS handle
a plain standalone image is simpler and more universal than trying to
detect mobile vs. desktop ourselves: long-press to save on iOS/Android,
right-click or the browser's own image toolbar on desktop, no platform
detection required. Falls back to a direct download only if the popup
itself gets blocked.

-----

## Known open items / things discussed but not (yet) built

- The `Muted` threshold (0.45) is a reasonable compromise, not a perfect
  one — a couple of complementary pairs sit right at the boundary and
  could read either way depending on exact ratio. Not worth chasing
  further without a specific complaint.
- No per-pigment "tinting strength" model beyond the yellow-vs-black case
  above (e.g., real Phthalo Blue is a notoriously strong tinter too, real
  Cadmium colors are notoriously weak). Only implemented where a concrete
  complaint justified it.
- A literal vertical sidebar layout for the palette (as opposed to the
  current horizontal-strip-in-a-card approach) was discussed and
  deliberately not built — this app is phone/iPad-first, and a true
  side-by-side rail doesn't work well at that width.

-----

## If you're picking this up fresh

Read this document, then skim `color-wheel-app.html`'s inline comments —
almost every non-obvious constant or formula has a comment explaining why,
often referencing a specific rejected alternative. If something here looks
like it could be simplified, there's a real chance it already was simpler
once, and got more specific for a reason. Check before changing it back.
