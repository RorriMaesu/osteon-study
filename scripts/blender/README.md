# Editable anatomy annotations

Use Blender 4.5. Both model-writing scripts create and verify a unique backup
before every model save/export, including outputs that do not yet exist. Keep
backups outside the public website repository. Do not overwrite a source model
manually without taking the same precaution.

`prepare-atlas-labels.mjs` writes a manifest from the app's source-backed term
definitions and shipped model inventory. Run `annotate_atlas.py` with arguments:

1. Input manifest path
2. Website repository directory
3. New editable `.blend` path
4. Backup directory

The result assembles the adult anatomy, separates teaching specimens, adds
editable reference empties, and exports `course-landmark-labels.glb` plus the
runtime JSON. It preserves the three existing anatomy GLBs and all source
opening/surface coordinates. Whole-structure labels use actual surface vertices.

`prepare_fetal_skull.py` takes:

1. Original licensed UCSF/Sketchfab GLB
2. `fetal-sites.json`
3. Website repository directory
4. Editable fetal-skull `.blend` path
5. Backup directory

Use Blender's background mode with `--python-exit-code 1`. Arguments after `--`
are passed to the script. The original authorized download's SHA-256 is recorded
in `src/fetal-skull-specimen.json`. The scan retains CC BY-NC 4.0; source creator,
license and change attribution must remain with derivatives.

The fetal sites are qualified developmental regions, with recorded visual
uncertainty. A ray intersection establishes a surface coordinate, not an open
fontanelle or an anatomically certified point. Do not remove spatial-scoring
holds without appropriate anatomical evidence. No new holes are cut by this
script. Rebuild the app and run the coverage/model tests after changing assets.
