# Landmark coverage and accuracy

The review reconciles all **310 named textbook features** and **422 atlas/course entries**. All **177 original lab IDs** are preserved. Of the textbook features, **55 have applied corrections**, **247 retain supported source/morphology references**, and **8 remain study references excluded from scored locating**. These counts describe review dispositions, not clinical certification.

Use the [searchable landmark review](accuracy.html) for every entry, its findings, current disposition and inspection images. The [CSV](ACCURACY-REVIEW.csv) provides the full record. Twenty marking-vocabulary definitions remain separate from the 310 anatomical features.

## How the viewer represents anatomy

Native source geometry and original annotation endpoints are distinguished from manually curated rim/surface references and explanatory teaching models. A pin marks a reference location; it does not trace an entire ridge, boundary or canal. Composite features retain their contributing bones. Covered references use dashed leaders and hollow dots so they are not mistaken for an exposed surface.

Search a feature, inspect its label, rotate the specimen and compare the source figure. Top and Base views supplement Front, Back and side cameras. Regional colors have an On/Off control. Whole-skeleton overviews remain neutral. Double-click explores a region, then isolates the bone.

## Current limits

The crude newborn calvarial and straightened round-window models remain withdrawn. Fontanelles now open the licensed native UCSF fetal-skull scan within this viewer. Superior, posterior and left/right views show clearly qualified developmental junction regions, with a labeled OpenStax newborn comparison one click away. Some sites are narrowed or closed; the markers do not claim six open fontanelles or provide scored locating. A fetal specimen is not assumed to have identical morphology to a newborn textbook illustration.

Unresolved passage schematics and regional ridge references carry visible qualifications and are excluded from scored locating. Composite sinus and air-cell guides do not imply that every drainage opening has been resolved. Consult the current [review dispositions](accuracy.html) rather than treating a loading model as proof of anatomical completeness.

## Verification and preservation

All 97 active source-pin terms (98 points) were compared with evaluated original annotation leaders and parent bones. Inferior scapular-angle, humeral and skull reference corrections are recorded separately from source-pin provenance. Native sacral canal/hiatus geometry was restored; verified native skull openings replace unsupported added tubes where available. Microarchitecture corrections connect trabeculae and canaliculi and fit the growth plate inside the cortex. Those specimens remain generalized teaching geometry.

There are 22 pre-revision snapshots with 87 checksum-verified files. Original Startup.blend, skeleton.glb and course-tissues.glb remain unchanged. Selected higher-resolution original bones and teaching geometry load from a separately versioned asset.

See [review methods and browser checks](REVIEW.md), [3D provenance](LANDMARK-3D-AUDIT.csv), [credits and licenses](CREDITS.md), and the [frozen source inventory](LANDMARK-EXPANSION-AUDIT.csv).

## Direct Blender bone refinement

Blender 4.5.1 now edits the source bone surfaces for three previously unresolved openings. The supraorbital enclosed-foramen variant is cut into existing frontal cortex above the orbital margin; no protruding ring is added. The stylomastoid exit and terminal facial canal are cut into the temporal bone while retaining its three original surface components. The nasolacrimal canal is integrated with the maxilla, trimmed against lacrimal/conchal contributors and hollowed along the source duct route, continuing into the lacrimal-fossa region.

The meshes contain real passages, with named rim anchors and unobstructed default views. Geometry tests check the shipped GLB, continuous centerline clearance, preserved carotid passage, generated rim positions and topology. These are documented teaching reconstructions; their caliber and local contours are explanatory rather than patient measurements. Before/after renders appear in the per-feature review records. The editable Blender project includes named landmark empties.

Current interactive browser review of these three new edits is pending: the browser approval service could not complete its review because its selected model was at capacity. Offline model inspection and geometry tests are complete. Prior browser checks apply to the earlier viewer layout, not to exhaustive testing of these new meshes.

## Integrated controls and teacher coverage — 2026-11-02

1. Switch **Landmarks: On** above the model. Full-skeleton overviews remain sparse; double-click a bone or use **Find landmarks**.
2. A region or isolated bone shows small batches of source-backed labels. Arrows move between batches. R/L always refer to the specimen's anatomical side; unsupported counterparts are not created by mirroring a point. Dashed labels indicate a reference behind a surface. Rotate, peel, or select the label to examine it.
3. **Find landmarks** searches the teacher list without leaving the viewer. Choose **All anatomy** for the wider textbook features, histology and growth specimens. Type and region filters keep the collection manageable. Ligament selection exposes the relevant anatomical neighborhood with X-ray context.
4. Switch Landmarks off to hide both regional and selected labels. During an identification task, this switch is disabled and only masked target markers remain.

The [coverage checklist](ATLAS-LANDMARK-COVERAGE.csv) accounts for all 177 original IDs: 59 direct bone entries and 118 feature/tissue/reference entries. There are 173 existing spatial-practice entries, two source-recall entries (fontanelles and the grouped ethmoidal air-cell/drainage item), and two drawer movement tests. Fontanelles now have a local native scan for orientation; that does not turn unverified developmental gaps into scored targets. All 310 textbook features retain their prior provenance and accuracy dispositions.

Blender 4.5 generated 495 editable annotation nodes across the full 422-entry atlas. These include whole-structure labels and multiple points for some terms; they are not a count of unique bones or landmarks. Source opening/surface references retain their coordinates. Whole-structure labels use actual surface vertices. `assets/atlas-label-evidence.json` records the backup and unchanged original anatomy asset hashes. The native fetal model is separately backed up, licensed, scaled for display, and annotated without cutting new holes.
