# Forearm rotation teaching model

The forearm lesson uses registered bilateral skeleton and muscle surfaces from the Osteon atlas. The model holds the humeri, scapulae, and ulnae still. The radius and hand on each side rotate through 60 degrees from the atlas starting pose, pause, then return. This is a bounded range for the lesson. The atlas remains the source for detailed anatomy and its existing attribution and licenses apply. [Model licenses](../assets/MODEL-LICENSE.md)

The main axis runs from the proximal radial head to the distal ulnar head. A small modeled slide at the distal joint keeps the bony surfaces clear during rotation. Both pronator teres heads, pronator quadratus, supinator, and the long biceps head use source-guided shape changes. The separate short biceps head shows its belly proximal to the common distal tendon. The lesson highlights the principal roles for the direction shown. [Fitted joint motion](https://pubmed.ncbi.nlm.nih.gov/20696507/) · [Forearm rotation mechanics](https://pubmed.ncbi.nlm.nih.gov/16678316/)

## Verification

- The authoring script makes a checksum-verified backup before each staged Blender export. The unmodified anatomical sources remain separate from the lesson.
- The inspection script reimports the GLB, compares the resting bone surfaces to the atlas, and samples the rotating radii every two degrees. Both radii clear the stationary humeri and ulnae in the sampled poses.
- Muscle shape changes are teaching approximations of the source attachment neighborhoods. The clip's direction cues describe anatomical action.

```text
blender -b --factory-startup --disable-autoexec --python-exit-code 1 --python scripts/blender/build_motion_forearm.py -- REPO OUTPUT_DIRECTORY
blender -b --factory-startup --disable-autoexec --python-exit-code 1 --python scripts/blender/verify_motion_forearm.py -- REPO OUTPUT_DIRECTORY
```

Use an output directory outside the repository. The export produces the editable Blender model, GLB, lesson manifest, and a verification report there.
