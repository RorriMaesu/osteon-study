# Whole-body posing review

The **Pose skeleton** workspace keeps one body pose while you inspect different joints. [Open it](https://rorrimaesu.github.io/osteon-study/?motionMode=pose#motion).

## Controls

- Tap a joint marker or choose a named joint. Nearby markers are spaced out; finger markers appear at closer views. Every supported control remains available in the joint selector and search.
- Drag the circular control to adjust one movement. Use the slider, arrow keys, or minus/plus buttons for precise changes.
- **Move limb** moves a wrist or ankle using linked shoulder/elbow or hip/knee joints. It respects the model's joint limits and angle locks. Arrow keys move this target without dragging.
- **Focus joint** and **Full body** change your view while preserving the pose. Finger detail isolates its arm; Full body restores the overview. Find joint offers other body-region views.
- **Lock angles** fixes a control's values. Parent joints can still carry that limb through space. Locking a shoulder girdle also blocks its coupled arm-elevation channel.
- **Undo** reverses one completed adjustment, including an entire drag. Escape or a cancelled pointer restores the pose from before the drag. Reset returns the model and locks to the starting state and can be undone.
- The most recent pose is saved in this browser. Switching between Pose, Muscle actions and Walk preserves the pose.

## Shipped model

The additive Blender 4.5 specimen contains all **476 existing atlas muscle surfaces**, **54 user controls** and **73 movement channels**, plus **296 bone/support surfaces** including 23 discs and both Achilles tendons. Surface counts include left/right parts and named heads, not 476 distinct anatomical muscles.

| Region | Available controls |
| --- | --- |
| Shoulder and arm | Shoulder girdle, shoulder flexion/abduction/rotation, elbow flexion, forearm pronation, wrist flexion/deviation |
| Hand | Thumb base and finger MCP/IP hinges, separately on each side |
| Pelvis and leg | Hip flexion/abduction/rotation, knee flexion, ankle dorsiflexion/plantarflexion, grouped toes |
| Axial body | Distributed lumbar and cervical bending/rotation, jaw opening with translation |
| Face and thorax | Guided blink, smile, inspiration and forced-expiration shapes |

The skeleton, walking rigs and original regional lesson models are retained. The build saves checksum-verified backups before every authoring pass and records its source and backup inventory in `assets/motion-pose-body.json`. The editable Blender project and backup copies stay outside the published site.

## Reading the muscles

Green marks **possible contributors to the last adjustment**; violet marks an opposing anatomical action. The model keeps exact side and head identities. Finger-specific intrinsic muscles are matched to their digit. Shared muscle surfaces are described as shared. Biarticular muscles can contribute at one joint while opposing another.

A pose does not reveal neural recruitment, force, or concentric versus eccentric contraction. The separate Muscle actions lessons supply a stated task. Walking retains its original eight recorded surface-EMG channels. The pose inventory is listed separately from measured walking activity.

## Review and limits

The implementation checks state persistence, one-step drag undo, cancellation, joint limits, dependencies, direction/laterality, exact muscle inventory, skeleton attachment, reset fidelity and browser layout. Blender export is re-imported and inspected; numeric checks are supplemented by attachment reviews. Review caught and corrected shoulder-girdle insertion bindings, pronator quadratus wrist influence, shoulder-elevation signs, virtual neck handles, finger-specific highlights and a tablet layout with a zero-height viewer.

This is an atlas-derived teaching rig with approximate skin envelopes and conservative working ranges. Large combined poses still produce local stretching or overlap; the viewer identifies the model as approximate and flags large teaching poses. The [Blender re-import report](model-sources/motion-pose-verification.json) records the tested geometry, reset and stretching measurements. It is not a validated contact or muscle-force simulation. Individual carpal glides, individual toe joints, eye rotations, tongue actions, tissue collision and ligament constraints remain outside this rig. Distributed spinal motion and shoulder coupling are teaching approximations. The [coverage inventory](https://rorrimaesu.github.io/osteon-study/muscle-coverage.html) continues to flag missing or unresolved anatomy rather than treating a rigged surface as anatomical certification.

## References

- [OpenStax body movements](https://openstax.org/books/anatomy-and-physiology-2e/pages/9-5-types-of-body-movements)
- [OpenStax muscle interactions](https://openstax.org/books/anatomy-and-physiology-2e/pages/11-1-interactions-of-skeletal-muscles-their-fascicle-arrangement-and-their-lever-systems)
- [Holzbaur et al., upper-extremity musculoskeletal model](https://pubmed.ncbi.nlm.nih.gov/16078622/)
- [Hicks et al., verification and validation of musculoskeletal simulations](https://pmc.ncbi.nlm.nih.gov/articles/PMC4321112/)
- [W3C alternatives to dragging](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html)
- [Anatomy geometry and derivative attribution](assets/MODEL-LICENSE.md)
