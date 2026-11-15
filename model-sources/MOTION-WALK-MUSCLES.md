# Whole-body walking muscle models

The five region packs reuse the original Osteon atlas surface identities and world alignment. The lower-body rig supplies its eight original measured gait surfaces. The other 468 muscle surfaces come from the five region packs. Every surface keeps its name, anatomical side, atlas ID, and region. Where a shoulder muscle crosses from the trunk into the arm, the same surface appears in both inspection scopes.

Large walking surfaces are simplified for playback with a sampled surface-error limit. The original high-detail atlas remains available. Each pack has a flat armature. Its named drivers follow joint transforms from the existing Osteon walk rig with rest offsets preserved. Region-following surfaces move with one rigid segment. Joint-blended surfaces deform from atlas-specific envelopes spanning body segments. The upper-body motion remains illustrative. These assets add no muscle activation measurements or modeled force signals. Gait skinning does not independently pose the face, fingers, or toes. The lateral gastrocnemius retains its existing shank and thigh bindings and uses a signed ankle correction. The ankle correction changes the shape independently of the original activity trace. Heel-rise deformation belongs to the separate calf lesson. [Ankle deformation methods and validation](MOTION-GASTROCNEMIUS-ANKLE.md)

The pack manifest preserves the hash of the original lower-body rig used for authoring. Its neutral skeleton and mesh identities are compatible with the later ankle revision. Tests verify node names and transforms, joint order and inverse bind matrices, and unrelated mesh payloads.

## Provenance and checks

- Original anatomical geometry comes from the regional Z-Anatomy and BodyParts3D atlas models. This derivative uses the same model attribution and license. [Model licenses](../assets/MODEL-LICENSE.md)
- Each Blender run makes checksum-verified backups of its source model files and any prior output files. The build creates new staged assets and leaves the source atlas and walking rigs untouched.
- Reimport checks compare neutral surfaces against the source, validate named joint envelopes, sample five frames of the gait, and confirm the surfaces return to neutral. Attachment continuity, muscle paths, and material behavior remain approximate in this release.
- The [Moreira walking study](https://www.nature.com/articles/s41597-021-00881-3) provides the underlying lower-limb trial and the four measured surface EMG channels per leg. The new models preserve those channels as recorded.

```text
blender -b --factory-startup --disable-autoexec --python-exit-code 1 --python scripts/blender/build_motion_walk_muscles.py -- REPO OUTPUT_DIRECTORY
blender -b --factory-startup --disable-autoexec --python-exit-code 1 --python scripts/blender/verify_motion_walk_muscles.py -- REPO OUTPUT_DIRECTORY
```

Keep the output directory outside the repository. The export writes editable Blender files, GLB region packs, a source manifest, and a reimport report to that directory.
