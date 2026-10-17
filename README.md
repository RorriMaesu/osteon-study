# Osteon

Interactive 3D bone atlas and BI 231 study suite. Built for OpenStax Anatomy and Physiology 2e chapters 6 and 7, with the supplied lab list's appendicular and joint extensions.

Live site: https://rorrimaesu.github.io/osteon-study/

Read [the implementation and learning plan](PLAN.md) and [release notes](CHANGELOG.md).

Read [the responsive workspace plan](RESPONSIVE-PLAN.md) for the desktop and mobile layout review. Desktop widths from 1000 pixels use a viewport-sized application with Previous / Next content pages, including the atlas lists, lessons, reading text and tutor history. Phones and narrower tablets use Specimen / Browse / Details atlas controls and natural vertical reading. Search, answer drafts and progress are preserved when the layout changes.

This is a static GitHub Pages site. No server account is required. Study progress stays in the browser. The original course documents and personal file paths are not published.

## Development

Serve this folder with any static HTTP server. Direct file opening is unsupported because the 3D asset must be fetched over HTTP. Runtime libraries and the model are bundled with the site. Source modules live in `src/`; `app.js` is the bundled browser entry point. For changes, use Node.js 22+ and run `npm ci`, `npm test`, `npm run audit`, then `npm run build`. Commit the rebuilt app.js before pushing to main; GitHub Pages publishes the repository root.

Model and content credits are maintained in CREDITS.md. See PLAN.md for the educational coverage and representation policy.

## Complete course release

- All 177 distinct BI 231 lab concepts have graded exercises: 82 named 3D structures/groups, 47 source landmark pins, 46 textbook diagram targets and two knee movement concepts. COVERAGE.csv lists every item and its source.
- Adult skeleton plus 81 course tissue objects: 352 scene objects, including bones, cartilage, teeth, ligaments, discs, sinus volumes and vertebral arteries. Scene objects are not a biological bone count.
- Full source reader: every page of chapters 6 and 7, plus appendicular and selected joint readings; 124 page images with searchable extracted text. Source pages load on demand.
- Twelve teaching sections, 104 authored concept questions, 237 textbook glossary definitions and seven guided activities.
- Locate and name practice, a systematic unpracticed-first course pass, region/session controls, missed-item retries, local review scheduling, score separation and progress backup/restore.

**My progress** now maps all 177 lab targets by their latest scored attempt and starts a focused ten-target identification session or ten-question chapter session. Missed or assisted items come first, followed by untried items. Full-course identification clears atlas filters. Lesson cards show their question evidence separately from reading status. Self-rated recall updates card scheduling but does not clear a scored retrieval gap; neither a correct latest answer nor a repeated answer after 24 hours is a guarantee of mastery.

Due-card counts match the decks they open. The Practice menu scopes lab recall to its division and region; chapter recall keeps both chapters. Progress offers course-wide lab and chapter review decks regardless of the current atlas filters.

Landmark pins identify reference locations; they do not segment complete ridges, surfaces or boundaries. Only the anatomical endpoints of reliable source annotation leaders are used. Other features use source textbook figures. Fontanelles use a newborn illustration. Drawer tests assess movement and ligament restraint. A parent-bone highlight never grades as locating a landmark.

The course list and chapter readings are covered in full. The finite question bank supplements those readings; it cannot guarantee every possible examination question. The anatomy is a single reference specimen and has not undergone independent instructor/anatomist validation. See QA.md for evidence and practical limits.

The site bundles its model and reading assets. Google Fonts is an optional external typography request with system fallbacks. No study progress is sent to a server. The original course document, full textbook PDF and personal paths are not published; licensed chapter page images and extracted text are included with attribution.


## Skull colors, skeleton divisions and local tutoring

The atlas includes a cranial/facial color key and All / Axial / Appendicular filters, also applied to anatomy practice. Color coding appears only in the Skull region; its visible On / Off button sits above the color key and remembers your choice while changing regions. Full-skeleton and axial overviews stay neutral. Sacrum and coccyx remain axial; hip bones are appendicular. Mixed pelvis targets appear under All. Skull colors turn off for scored practice.

Use the **Socratic tutor** button for a local Ollama chat, installed-model selection, guided connection, optional model downloads and hardware/fit checks. See [the tutor guide](TUTOR.md) for first setup and honest browser limits. Tutor assistance is tracked separately from independent quiz accuracy.
