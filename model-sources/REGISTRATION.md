# Muscle recovery evidence

The editable derivative is `outputs/osteon-models/muscles.blend` in the owner's workspace. `scripts/blender/repair_muscle_groups.py` appends the source surfaces described in `muscle-repairs.json`. Run it in Blender 4.5 with `--background --disable-autoexec --python SCRIPT -- WORKSPACE`. Repeated runs skip existing identities. The original-only exporter refuses to overwrite an atlas that contains these repairs.

Every existing project/model destination receives a hash-verified backup immediately before saving or exporting. Backup manifests and editable projects stay outside the public repository. The original Z-Anatomy source hash remains `9f08a17ea0115fed80b2a73ecdf0a1bc2ab2f6956f37c593ce23d513ea35afcd`.

## Hand and foot group surfaces

- Original BodyParts3D / Anatomography 4.3 OBJ surfaces are supplied with their exact hashes and attribution in the recipe. The `.obj` files are preserved byte for byte in Git.
- The palmar source set contains three major members after seam welding. Each member is identified from its digit-2/4/5 skeletal relationship. Small disconnected source fragments are assigned to the nearest major member; the furthest such fragment is about 2.06 mm from its member. Source faces are retained rather than replacing anatomy with generic geometry. Left palmar members are explicitly mirrored derivatives.
- Foot lumbricals are four individually named original source files per side. They are not inferred by copying one existing lumbrical.
- A separate similarity transform is fitted for each side and region against corresponding second/fifth metacarpals or metatarsals. The foot pose requires a rotation; a single whole-body translation was rejected.
- Third/fourth metacarpals or metatarsals and right proximal phalanges are held out of the fit. Their errors are recorded in every relevant registration record. Hand/foot held-out median nearest-vertex distances are below 0.3 mm; the largest 95th-percentile distance is about 3.1 mm, partly reflecting coarse reference vertex spacing. These are coordinate-registration checks, not clinical measurement tolerances or attachment certification.

## Palmaris brevis

The original university GLB and extracted geometry hashes are recorded. Only named palmaris brevis geometry is used; source textures are omitted. The right-hand source is registered against the existing metacarpals and mirrored explicitly for the left. Held-out skeletal median nearest-vertex differences are about 1.2–1.4 mm, with 95th-percentile differences up to about 4.3 mm. The university source has revised bone shapes, so this fit is less exact than the BodyParts3D group registration. Its tendon/skin relationships are not certified surface footprints. Teaching notes distinguish its skin/fascial insertion from bony insertion.

## Vocalis

The left and right vocalis come from individually named BodyParts3D 4.3 originals FJ2788 and FJ2806. [Source mesh hashes, registration and endpoint checks](muscle-vocalis.json) are recorded with the teaching notes. [Dataset license and attribution](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html).

The two surfaces share one local similarity transform fitted against the thyroid, cricoid and both arytenoid cartilages. Fitting only thyroid and cricoid gave held-out arytenoid 95th-percentile nearest-surface distances of 0.80 mm on the left and 0.77 mm on the right. In the final export, the corresponding anterior endpoint distances to the inner thyroid cartilage were 0.44 and 0.51 mm. Posterior endpoint distances to the arytenoid vocal processes were 0.36 and 0.40 mm. Both vocalis meshes lie medial to the existing external thyroarytenoid and were visually checked alongside their respective donor vocal ligaments. [Human vocalis dissection](https://pubmed.ncbi.nlm.nih.gov/39595985/) and [vocal-process histology](https://pubmed.ncbi.nlm.nih.gov/9438114/).

The Blender 4.5.1 reimport retained all 1,152 left and 1,148 right source faces and preserved their transformed vertices within 0.01 mm. The original 149 atlas nodes and their mesh data were preserved in the combined asset. These checks support static identification. The atlas does not simulate vocal-fold motion or score precise attachment footprints.

For a reproducible build, use a pre-vocalis repository checkout and run Blender with `--background --disable-autoexec --python-exit-code 1 --python scripts/blender/build_muscle_vocalis.py -- REPOSITORY RECIPE NEW_OUTPUT_DIR`. Point `RECIPE` to this folder's `muscle-vocalis.json`. The builder verifies the original model hashes and saves verified backups, the editable Blender project, the two-mesh export, the combined GLB and the corresponding manifest in the new output directory.

## Further sources under review

Additional original soft-palate, oblique arytenoid, pelvic and spinal muscle sources were located. Initial regional bone registration gave differences as large as 8.3 mm around the palatine reference, and the existing spinalis/semispinalis and puboanalis/puborectalis identities remain unresolved. These candidates require local registration and verification of attachments and overlap before inclusion. The open entries remain visible in the audit until their source relationships and fit are resolved. The recovered groups do not make the atlas complete.

## Semispinalis capitis

Blender 4.5.1 compared both existing surfaces titled **Spinalis capitis muscle** in Z-Anatomy to BodyParts3D 4.3 meshes named **Semispinalis capitis**. An independent fit on bones only put 94.7% of left donor vertices and 91.1% of right donor vertices within 2 mm of the existing muscle surfaces. With the occipital bone held out, the median surface distances were 0.593 mm and 1.079 mm. The inherited surfaces are visible as a **Semispinalis capitis region** reference. The original mesh names and files are preserved. The modeled shape stops in the upper thoracic region and does not establish the full distal footprint described in dissections. An individual spinalis capitis surface remains unresolved. Both named muscles remain open in the audit.

[Registration parameters, donor SHA-256 checksums and holdouts](muscle-semispinalis-review.json) identify the inputs and measurements. Obtain the original donor OBJs with the IDs from [BodyParts3D](https://lifesciencedb.jp/bp3d/), attributed to The Database Center for Life Science under [CC BY 4.0](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html). See the [semispinalis capitis cadaveric study](https://doi.org/10.1111/joa.13853) and the [dissection report of a possible independent spinalis capitis](https://pmc.ncbi.nlm.nih.gov/articles/PMC1166828/).
