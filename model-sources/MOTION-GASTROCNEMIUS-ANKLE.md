# Ankle-driven lateral gastrocnemius in Motion Lab

This revision adds signed ankle shape corrections to Osteon’s original bilateral lateral gastrocnemius and calcaneal tendon meshes. They apply in leg posing and walking. The knee and hip skin bindings are preserved. The ankle moves the calcaneal insertion through the original foot weights. A shared displacement field moves the gastrocnemius and Achilles surfaces around their join and fades to zero near the femoral origin and calcaneal insertion. The straight-knee heel raise keeps its separate calf model.

The correction follows joint angle. The authored aponeurosis displacement is a visual approximation. Surface EMG still uses the original recorded channels. The correction does not infer activation, fascicle length, tendon strain, or force from the angle or EMG. In vivo studies show that fascicle, tendon, and whole muscle–tendon unit length can change differently. [Fukunaga et al.](https://pubmed.ncbi.nlm.nih.gov/11217891/) · [Mian et al.](https://pubmed.ncbi.nlm.nih.gov/17280557/) · [Hug et al.](https://pubmed.ncbi.nlm.nih.gov/25457482/)

## Verification and reproducibility

- These corrections derive from the existing Z-Anatomy and BodyParts3D meshes. [Model licenses and attribution](../assets/MODEL-LICENSE.md)
- The [asset record](motion-gastrocnemius-ankle.json) preserves both asset hashes and the original walking rig compatibility signature. It includes named nodes and rest transforms, skin joint order and inverse bind matrices, and the 72 unrelated Draco primitive payloads.
- Blender 4.5.1 re-import checked both sides, two leg poses, and five ankle positions from 35° plantarflexion to 23° dorsiflexion. The sampled femoral and calcaneal attachment regions stayed fixed relative to their original skinning. Across 67 adjacent vertices per side, the largest increase in nearest-vertex join separation was 0.022 mm.
- A separate decoded-geometry comparison found identical neutral positions for all four corrected mesh buffers. The same eight measured surface IDs remain linked to the same activity channels.
- The original walking muscle packs were authored against the earlier neutral lower rig. Their pinned historical source hash remains in the [walking pack manifest](../assets/motion-walk-muscles.json). Tests verify structural compatibility with the revised lower rig.

```text
blender -b --factory-startup --disable-autoexec --python-exit-code 1 --python scripts/blender/build_motion_gastrocnemius_ankle.py -- --repo REPO --editable ORIGINAL_MOTION_LEGS_BLEND --stage VERIFICATION_DIRECTORY
```

Use the original editable lower-leg project from `scripts/blender/export_motion_legs.py`. The command writes a candidate and an editable copy under the verification directory, re-imports the candidate, and saves its geometric checks. It records checksummed backups before editing, saving, and exporting.
