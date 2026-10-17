# Release verification

## Verified behavior

Eight automated checks cover exact course-to-model mappings, overlapping rib categories, numbered bone distinctions, all twelve instructional sections, answer/distractor integrity, all 237 glossary entries, synonym recognition, assisted/self-rated score separation, review scheduling and import validation.

Browser checks completed against the built static application:

- Real model load and visual inspection of the adult skeleton.
- Whole-bone selection, focused framing, surface peeling and restoration.
- A complete 3D identification session with 1/1 independent correctness.
- A correct canvas click in a location question, verified against the actual hip-bone mesh.
- An incorrect typed response, locked submissions and a corrective explanation.
- A four-question chapter session with four revealed answers reported as assisted and 0/4 unassisted correct.
- Searchable textbook glossary, one-card recall, rating and scheduled review.
- Reloaded progress retaining scored attempts, assisted counts and card reviews separately.
- Mobile atlas at 390 by 844 CSS pixels, with no horizontal page overflow; all six viewer controls measured 48 by 46 pixels after the touch-size adjustment.
- Conceptual calcium activity, lesson-to-quiz navigation and full-session result navigation.

Reduced-motion preferences disable CSS transitions/animations and the viewer's smooth camera movement/damping. This preference is implemented in source; a separate device-level reduced-motion emulation was not available in this review. Slow automatic specimen rotation starts only when explicitly enabled.

## Coverage and limits

The course audit has 177 concepts: 64 exact mesh groups, 96 parent-context entries and 17 recall-only entries. These are concept/group counts, not unique biological bone counts. Paired structures and some nested categories share geometry. Parent-context entries never enter exact 3D location grading. Adult geometry cannot represent infant fontanelles. Ligaments and several other listed tissues are not included in the skeleton layer.

This release provides a working full-skeleton bone practice suite and section-wide textbook support. Precision click targets for all surface landmarks, separate fused hip-bone component geometry, developmental specimens and a larger instructor-reviewed question bank remain future work. Chapter notes and a finite question bank supplement the full source rather than guaranteeing examination coverage. Every lesson links to the textbook's full text and figures.

No individual specimen or every landmark was independently reviewed by an anatomist. Source and question checks verify consistency and application behavior; they do not constitute external anatomical validation. The specimen is one adult reference anatomy and does not depict all normal variation.

GitHub Pages deployment is verified separately through the Pages build result and the public site's loaded model. The repository retains each published stage as an individual commit.
