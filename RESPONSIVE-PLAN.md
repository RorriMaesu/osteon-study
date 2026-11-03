# Responsive workspace plan

## Viewer review — 2026-11-02

At a 1366 × 650 laptop viewport, the old atlas stage was 439 pixels tall but the actual canvas was only 218 pixels tall. The introduction and separate control rows consumed the rest. A wider canvas alone would leave the skeleton just as short, so this revision reclaims vertical space first.

| Screen | Default atlas | Larger study view |
| --- | --- | --- |
| Laptop / narrow desktop, 1000–1599 px | Search column plus large specimen; Details opens on demand. Short screens use a compact title and navigation. | Expand viewer fills the browser window. |
| Large desktop, 1600 px and above | Search, specimen and selected-structure panels remain together. | The same expansion is available for detailed inspection. |
| Phone / narrow tablet | Specimen, Browse and Details controls; natural reading flow. | Expansion fills the dynamic viewport, including portrait and landscape layouts. |

Camera/action controls share one bottom row when there is enough room; narrower stages retain two accessible rows. Camera framing adapts to the new space while retaining the viewing direction, region and selected target. Full screen is an optional browser capability invoked only by its visible button; window-filling expansion remains available if that request is unavailable or refused. The implementation follows the [Fullscreen API guide](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API/Guide).

Discovery has three layers: a readable “double-click / double-tap → region → one bone” cue, an explicit Zoom to region / View bone alone action after selection, and a Controls guide with rotate/zoom/pan instructions. A short cue animation respects reduced-motion preferences. Practice suppresses exploration instructions and target names, and expanding/returning retains the current question and draft. Escape closes the guide first, then expanded view; the Back arrow restores the previous anatomical view. Background controls are inert during expansion and keyboard focus stays in the viewer.

The earlier plan below describes the content workspace that remains in place.

The previous design stacked a large introduction, a fixed 780-pixel specimen and long study panels. This pushed controls below a laptop screen. On phones, filters and details appeared far below the specimen, and the floating tutor could cover controls.

## Desktop

- Treat the application as one viewport-sized workspace. Keep navigation, the active workspace and a compact source footer visible.
- Allocate the atlas's remaining height to the specimen and its two side panels. Use pages for the structure list and selected-structure content. Keep the focus trail, Back and color toggle in a compact specimen bar; open the optional regional color key separately.
- Use visible Previous / Next / page selection for long study content, glossary entries, practice options and progress information. Preserve all original content and event handlers; do not obtain a fit by shrinking the text or clipping the rest of a page.
- Keep lesson navigation outside its paged reading panel. Fit original textbook page images to their reading space; accessible text has its own pages. Search results use pages too.
- Fit course targets and camera controls beside the question. Keep answer feedback reachable through the same visible content-page controls.
- Put the tutor launcher in navigation so it cannot cover a specimen or answer button.
- Page longer tutor setup screens and conversation history on desktop, with the composer outside the history pages. Follow the latest response only while the learner is already on its last page.

## Mobile and narrower tablets

- Use explicit Specimen / Browse / Details controls in the atlas. Selecting a structure from Browse returns to the specimen, and Details remains one tap away.
- Size the specimen to the available screen; maintain touch-sized camera and study controls, safe-area spacing and readable input text.
- Keep natural vertical reading for long lessons and textbook pages. Keep quiz context above the specimen and make the tutor a full-screen modal.
- Avoid horizontal page overflow and preserve input drafts when the layout changes.

## Critique and acceptance checks

A fixed application frame alone would merely hide content. The release must expose measured pagination for overflowing content, including text added by quiz feedback. Long lists must remain searchable, and keyboard focus must move to its content page. Original source images can become small when fitted to a laptop; accessible text and the existing Enlarge link remain available.

Check desktop widths/heights of 1024 × 768, 1280 × 720, 1440 × 900 and 1920 × 1080; phones at 390 × 844 and 360 × 740. Review full skeleton, skull key/toggle, selected landmarks, study path, lesson text/activity, glossary, practice setup, scored feedback, reader image/text, progress and the local tutor. Verify that the document has no desktop page overflow and that no content disappears behind its navigation.
