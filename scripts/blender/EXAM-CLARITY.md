# Exam clarity authoring record

`exam_clarity_build.py` and `exam_clarity_install.py` are the Blender 4.5 authoring/installation scripts from the November 4 review. `exam_model_backup.py` creates unique, hash-verified snapshots before saves/exports.

These are authoring records for the preserved local workspace, not a self-contained rebuild from the repository alone. They require the evaluated source geometry/routes and pre-edit runtime manifest in `work/landmark-clarity-2026-11-04`, the earlier verified temporal refinement in `work/blender-landmarks`, and the preserved native Z-Anatomy source. Geometry inputs are not silently downloaded or replaced. See `EXAM-LANDMARK-CLARITY.md` and `src/exam-clarity-evidence.json` for provenance and limitations.

Pass the workspace root after `--` when invoking either script with Blender's background Python mode. Author a candidate first, inspect it, then install it. Installation creates another snapshot, preserves unrelated anatomy, saves the editable project, and snapshots immediately before replacing the detail GLB. Regenerate inventory, annotation manifest/model and the application build afterward. Backups are not committed to GitHub.
