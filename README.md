# Osteon

Interactive 3D bone atlas and BI 231 study suite. Built for OpenStax Anatomy and Physiology 2e chapters 6 and 7, with the supplied lab list's appendicular and joint extensions.

Live site: https://rorrimaesu.github.io/osteon-study/

Read [the implementation and learning plan](PLAN.md) and [release notes](CHANGELOG.md).

This is a static GitHub Pages site. No server account is required. Study progress stays in the browser. The original course documents and personal file paths are not published.

## Development

Serve this folder with any static HTTP server. Direct file opening is unsupported because the 3D asset must be fetched over HTTP. Runtime libraries and the model are bundled with the site. Source modules live in `src/`; `app.js` is the bundled browser entry point.

Model and content credits are maintained in CREDITS.md. See PLAN.md for the educational coverage and representation policy.
