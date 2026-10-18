# Textbook landmark expansion

The completed inventory contains **310 named anatomical features**, with **20 marking definitions and source terminology notes**. It covers the named markings and structural spaces in the supplied OpenStax chapters 6–8, confirmed figure labels, and the additional bony attachment and inner-ear terms found by the whole-book audit. It is a finite inventory of this supplied source, not a claim to name every structure in human anatomy.

The atlas adds **229 entries** to the previous 193 entries. The original **177 lab targets and their stable progress IDs are preserved**. Canonical textbook names and aliases connect the lab list to the expanded bank without merging different anatomical extents.

## Learning and practice

- **287 spatial targets:** 93 source reference pins, 189 textbook diagram targets, and 5 separately modeled structures within the canonical feature bank.
- **23 source guides:** source illustrations, precise relationship descriptions and recall cards. These are excluded from point-location scoring.
- **52 added 3D reference anchors**, representing 51 previously unused original anchors. The arcuate-line anchor also supplies the existing pelvic-brim constituent point; the two extents remain distinct.
- **67 added source views**, including context views. The atlas shows one active feature. Locate exercises compare at most five separated targets on desktop and three on phones.
- The reader includes 144 source pages, including the additional appendicular, muscle-attachment and inner-ear references used here.

The landmark bank has region, feature-type, parent-bone and alias search. Its progress is separate from the original lab checklist. Next practice prioritizes missed or assisted targets, then untried targets, then the least recently retrieved. Due-card counts open the same filtered deck, including new textbook entries. Existing assessment assistance and self-rating rules remain in effect. A parent bone name does not pass recall of its landmark.

## Spatial evidence

New 3D pins use vertex 1 of original Z-Anatomy anatomical annotation leaders, transformed into the exported model's frame. Each was compared with the stated original and exported parent-bone surfaces and visually inspected in multiple views. All 52 accepted points lie within 0.75 mm of the corresponding exported parent surface. They are **right-side reference points**, not full surface segmentations, canal courses, or verified mirrored left-side anchors. Seventeen inspected leaders were rejected.

Textbook targets use source leader endpoints or clearly depicted morphology. Crops and masks hide answer text during assessment. Extended regions are described as reference points rather than falsely outlined boundaries. A source guide has no graded dot.

The source guides are: sigmoid sulcus of temporal bone; temporal lines of parietal bone; alveolus; calvaria; cranial base; cranial cavity; infratemporal fossa; nasolacrimal canal; olfactory foramina; paranasal sinuses; temporal fossa; costal groove; inferior tendon groove of cuboid; medial and lateral longitudinal foot arches; transverse foot arch; greater pelvis; lesser pelvis; pelvic outlet; anterior, posterior and lateral semicircular canals; and bony labyrinth. Their source views explain what is visible, obscured or conceptual. They require better exposed source anatomy before becoming precise spatial tests.

## Anatomical distinctions retained

Hypophyseal fossa differs from the entire sella turcica. A condylar process differs from its articular head. Vertebral foramen differs from continuous vertebral canal. Articular processes differ from facets. Superior/middle nasal conchae, anterior/posterior sacral foramina, and the four infant fontanelles have separate entries. The fibular notch belongs to the tibia; adductor tubercle to the femur; articular tubercle to the temporal bone. Sciatic foramina include ligament boundaries.

Foramen lacerum is described as cartilage-filled in life; the internal carotid crosses its superior aspect. The source's older “auricular fissure” example is a terminology note, not an invented spatial point. The source's ambiguous orbital artery wording is not repeated as a teaching claim. Tooth sockets, auditory bony spaces and microscopic canals retain their anatomical scales and context.

See [LANDMARKS.csv](LANDMARKS.csv) for every entry, alias, parent, representation and source page. See [CREDITS.md](CREDITS.md) for licenses. Run `npm test`, `npm run audit`, and `node scripts/audit-landmarks.mjs` to reproduce the content and geometry checks.

Adapted from OpenStax Anatomy and Physiology 2e, © 2026 Rice University, **CC BY-NC-SA 4.0**. Access for free at https://openstax.org. Original model annotations: Z-Anatomy, **CC BY-SA 4.0**. Derived textbook crops, masks and overlays retain the textbook license; model-derived annotation data retain their model-source license.
