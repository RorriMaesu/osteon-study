# Osteon

Interactive 3D bone atlas and BI 231 study suite. Built for OpenStax Anatomy and Physiology 2e chapters 6 and 7, with the supplied lab list's appendicular and joint extensions.

Live site: https://rorrimaesu.github.io/osteon-study/

Read [the implementation and learning plan](PLAN.md) and [release notes](CHANGELOG.md).

This is a static GitHub Pages site. No server account is required. Study progress stays in the browser. The original course documents and personal file paths are not published.

## Development

Serve this folder with any static HTTP server. Direct file opening is unsupported because the 3D asset must be fetched over HTTP. Runtime libraries and the model are bundled with the site. Source modules live in `src/`; `app.js` is the bundled browser entry point. For changes, use Node.js 22+ and run `npm ci`, `npm test`, `npm run audit`, then `npm run build`. Commit the rebuilt app.js before pushing to main; GitHub Pages publishes the repository root.

Model and content credits are maintained in CREDITS.md. See PLAN.md for the educational coverage and representation policy.

## Current coverage

- 177 course concepts: 64 exact selectable mesh groups, 96 entries with parent-bone context and 17 recall-only entries. See COVERAGE.csv for every mapping.
- Real full-body anatomical skeleton; 271 named objects include teeth, cartilage and sinus meshes.
- Twelve textbook sections, 56 authored questions, 237 textbook glossary definitions and seven guided interactive activities.
- 3D locate/identify, lab and glossary cards, mixed quizzes, local progress, review scheduling and backup/restore.

Whole-bone or group meshes are scored directly. Small landmarks, fused hip-bone regions and unmodeled soft tissues are not falsely graded as exact clicks. Precise landmark targets and developmental specimens remain future geometry work. Source reading links provide the textbook's full figures and detail.

The site bundles rendering/model assets. Google Fonts is an optional external typography request; system fallbacks remain available. No progress is sent to a server. Original source PDFs and course documents are not included.
