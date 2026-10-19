# Anatomy review — 2026-10-18

The review reconciles all **310 named textbook features** and **422 atlas/course entries**. All **177 original lab IDs** are preserved. Of the textbook features, **52 have applied corrections**, **247 retain supported source/morphology references**, and **11 remain study references excluded from scored locating**. These counts describe review dispositions, not clinical certification.

The previous statement that all features had accurate primary 3D views was too broad. Automated loading, finite coordinates and parent bounds do not establish anatomical accuracy. The current release separates supported native anatomy, explanatory geometry and unresolved features.

## Review method

Each named feature was reconciled against the supplied textbook inventory and course list, then inspected for name/parent/side, anatomical extent, source morphology, locator position, visibility and grading eligibility. Skull, axial, appendicular and chapter 6 ledgers were combined without discarding initial failures. All 97 active source-pin terms (98 points) were checked against evaluated original leader geometry; a coordinate being on a mesh was not accepted by itself as anatomical validation.

The [public report](accuracy.html) contains every entry, current disposition and available inspection images. Images can show the initial problem before correction; each record links to the current atlas. Offline morphology renders and source checks are distinct from selected interactive browser checks. This is educational review, not clinical or faculty certification.

## Material corrections

- Restored native sacral canal and hiatus; removed the incorrectly drilled reconstruction.
- Replaced unsupported skull tubes with verified native openings where both mouths and the lumen were demonstrated. Original higher-resolution geometry is retained rather than drilling a guessed passage.
- Restored contributors for sutures, orbit, hard palate, cranial floors and nasal boundaries. Corrected supraorbital-margin and anterior-cranial-fossa locators.
- Corrected humeral trochlea/radial-sulcus and inferior scapular-angle markers; retained evaluated provenance.
- Rechecked the right labyrinth, oval-window rim and semicircular-canal identities; clarified the space-cast display and improved ossicle close-ups.
- Connected floating trabeculae to cortex, connected canaliculi to lacunae/central canal, and fitted the growth plate inside its elliptical cortex. These remain explanatory models.
- Withdrew the crude fontanelle and round-window models. Unverified ridges, routes and composite extents cannot enter scored locating.
- Added covered-reference styling, improved camera fitting and Top/Base views, and retained labels, color toggles and desktop pagination.

## Verification

54 automated checks pass. They cover data/ID integrity, source provenance, parent/side constraints, withdrawn-model grading exclusion, contributor retention, binary equality of restored sacral geometry, removal of unsupported tubes, camera/navigation rules, source reading, progress and local tutor behavior. Passing these checks does not certify fine anatomical morphology.

Selected desktop and phone browser views were checked separately for target visibility, source/3D transitions, label/color/cutaway controls and overflow. Detailed browser results are in QA.md; this does not claim every feature was inspected interactively on physical devices.

13 pre-edit backup snapshots contain 51 checksum-verified files. The original Startup.blend, skeleton.glb and course-tissues.glb match the initial snapshot. Editable model revisions and backups are retained locally for the owner.

## Work remaining

Precise native fontanelle targets on a complete suitable skull and a resolved round-window opening remain unfinished. Other unresolved entries are explicitly listed in the [review report](accuracy.html). The UCSF scan can be viewed, but its licensed native download and individual target verification remain pending. This release improves accuracy without claiming those gaps are finished.
