# Whole-body posing review

The **Pose skeleton** workspace keeps one body pose while you inspect different joints. [Open it](https://rorrimaesu.github.io/osteon-study/?motionMode=pose#motion).

## Controls

- Tap a joint marker or choose a named joint. Nearby markers are spaced out; finger markers appear at closer views. Every supported control remains available in the joint selector and search.
- Choose a named movement and use its direction buttons (for example **Bend / Straighten**, **Spread / Together**, or **Sole in / Sole out**). Buttons move 5° at a time, or 10 percentage points for guided shapes; the slider and arrow keys offer finer changes. The circular handle also adjusts the selected movement.
- **Play motion** shows one gentle eight-second cycle, with muscle roles following each direction. A complete cycle restores your starting pose. **Pause** keeps the current pose and one Undo reverses the preview. Escape cancels it. Moving to another joint or leaving the app pauses playback.
- The angle button marked **Neutral** resets the selected joint's unlocked movements. Other joints keep their pose. Its reset can be undone.
- **Move limb** moves a wrist or ankle using linked shoulder/elbow or hip/knee joints. It respects the model's joint limits and angle locks. Arrow keys move this target without dragging.
- **Focus joint** and **Full body** change your view while preserving the pose. Finger detail isolates its arm; Full body restores the overview. Find joint offers other body-region views.
- **Lock angles** fixes a control's values. Parent joints can still carry that limb through space. Locking a shoulder girdle also blocks its coupled arm-elevation channel.
- **Undo** reverses one completed adjustment, including an entire drag. Escape or a cancelled pointer restores the pose from before the drag. Reset returns the model and locks to the starting state and can be undone.
- The most recent pose is saved in this browser. Switching between Pose, Muscle actions and Walk preserves the pose.
- Canvas labels move around joint handles, neighbouring markers, and camera buttons. Where space is insufficient, the optional canvas label yields; the selected joint and muscle names remain in the controls and explorer. Camera and posing controls stay usable.
- Open **Motions** in the Pose explorer to choose a focused study movement. The lesson opens with related muscles visible, and **Play motion** demonstrates the action. Use **Related only** to expose deeper muscles.

## Shipped model

The additive Blender 4.5 specimen contains all **476 existing atlas muscle surfaces**, **69 user controls** and **105 movement channels**, plus **296 bone/support surfaces** including 23 discs and both Achilles tendons. Surface counts include left/right parts and named heads.

| Region | Available controls |
| --- | --- |
| Shoulder and arm | Shoulder girdle, shoulder flexion/abduction/scapular-plane elevation/rotation, raised-arm horizontal sweep, elbow flexion, forearm pronation, wrist flexion/deviation |
| Hand | Thumb base opposition with a short teaching arc, finger MCP/IP hinges, index/middle/ring/little MCP spread and return, coordinated pinch approach and grip previews |
| Pelvis and leg | Pelvic tilt and supported-side obliquity, hip flexion/abduction/rotation, knee flexion with small coupled tibial rotation, ankle flexion, hindfoot roll, grouped toes and individual toe-base hinges |
| Axial body | Separate thoracic rotation, distributed lumbar and cervical bending/rotation, skull-on-atlas nod, jaw opening and small side and forward glides |
| Face and thorax | Guided blink, smile, inspiration and forced-expiration shapes |

The skeleton, walking rigs and original regional lesson models are retained. The build saves checksum-verified backups before every authoring pass and records its source and backup inventory in `assets/motion-pose-body.json`. The editable Blender project and backup copies stay outside the published site.

## Reading the muscles

Green marks **possible contributors to the last adjustment**; violet marks an opposing anatomical action. The model keeps exact side and head identities. Finger-specific intrinsic muscles are matched to their digit. Shared muscle surfaces are described as shared. Biarticular muscles can contribute at one joint while opposing another.

The always-visible muscle summary names a contributor and an opposing muscle and opens the full named list. Preview pauses retain the last actual direction rather than confusing the net change in angle with the movement being demonstrated. Finger spreading is intended near straight MCP joints; collateral-ligament tightening is not simulated. The middle finger's grouped dorsal interosseous surface cannot separately color its radial and ulnar heads. Foot inversion/eversion uses a distinct hindfoot pivot with the talus remaining at the ankle, while midfoot and forefoot motion is coupled for this teaching model.

A pose does not reveal neural recruitment, force, or concentric versus eccentric contraction. The separate Muscle actions lessons supply a stated task. Walking retains its original eight recorded surface-EMG channels. The pose inventory is listed separately from measured walking activity.

## Review and limits

The implementation checks state persistence, one-step drag undo, cancellation, joint limits, dependencies, direction/laterality, exact muscle inventory, skeleton attachment, reset fidelity and browser layout. Blender export is re-imported and inspected; numeric checks are supplemented by attachment reviews. Review caught and corrected shoulder-girdle insertion bindings, pronator quadratus wrist influence, shoulder-elevation signs, virtual neck handles, finger-specific highlights and a tablet layout with a zero-height viewer.

Release checks passed all 450 automated tests and browser interaction/layout checks at 1440×820, 1024×600, 768×1024, 390×844, 320×568 and 667×375. These are desktop-browser viewport checks, not physical-device certification. Checks include preview direction changes, pause/undo, complete-cycle restoration, Escape cancellation, isolated joint reset, new motion roles, and label/control non-overlap. The real exported joint hierarchy also passed bilateral direction checks and endpoint-target regressions. Existing walking playback and pose recovery after switching modes or reloading were checked in the browser. Blender re-import inspected nine pose scenarios, including both new foot directions and bilateral finger spreading.

This is an atlas-derived teaching rig with approximate skin envelopes and conservative working ranges. Large combined poses still produce local stretching or overlap. The [Blender re-import report](model-sources/motion-pose-verification.json) records the tested geometry, reset and stretching measurements. Open work includes individual carpal and toe interphalangeal joints, eye and tongue movements, additional facial expressions, weight-bearing foot mechanics, improved patellar tracking, tissue contact, and ligament constraints. The [coverage inventory](https://rorrimaesu.github.io/osteon-study/muscle-coverage.html) records unresolved anatomy and links to every pose control.

## Guided study

| Movement | Study cue |
| --- | --- |
| [Turn your head](https://rorrimaesu.github.io/osteon-study/?motionMode=pose&motionGuide=head-turn#motion) | Compare opposite-side sternocleidomastoid with same-side splenius. Use the rear view and Related only to see posterior muscles. The rig gives C1–C2 the largest share of the turn. |
| [Nod at the atlas](https://rorrimaesu.github.io/osteon-study/?motionMode=pose&motionGuide=upper-neck-nod#motion) | Compare a small skull-on-atlas tilt with whole-neck flexion. |
| [Raise your arm sideways](https://rorrimaesu.github.io/osteon-study/?motionMode=pose&motionGuide=arm-abduction#motion) | Compare humeral abductors with scapular upward rotators. During the guided return the same muscles can control lowering under gravity. |
| [Move your leg sideways](https://rorrimaesu.github.io/osteon-study/?motionMode=pose&motionGuide=hip-abduction#motion) | Compare abductors with the adductors of the free thigh. |
| [Lift the thigh](https://rorrimaesu.github.io/osteon-study/?motionMode=pose&motionGuide=hip-flexion#motion) and [move it back](https://rorrimaesu.github.io/osteon-study/?motionMode=pose&motionGuide=hip-extension#motion) | Compare iliopsoas and rectus femoris with gluteus maximus and the hamstrings that cross the hip. |
| [Turn the thigh](https://rorrimaesu.github.io/osteon-study/?motionMode=pose&motionGuide=hip-rotation#motion) and [turn a bent thigh](https://rorrimaesu.github.io/osteon-study/?motionMode=pose&motionGuide=hip-rotation-flexed#motion) | Compare near-neutral and deep flexion. Piriformis is a possible internal rotator in the deeply flexed example. Grouped gluteal surfaces remain neutral in the rotation comparison. |
| [Turn the trunk](https://rorrimaesu.github.io/osteon-study/?motionMode=pose&motionGuide=trunk-turn#motion) and [spread the index finger](https://rorrimaesu.github.io/osteon-study/?motionMode=pose&motionGuide=finger-spread#motion) | Compare the oblique pair and interosseous actions respectively. |
| [Raise the arm diagonally](https://rorrimaesu.github.io/osteon-study/?motionMode=pose&motionGuide=scaption#motion) | Compare elevation in the scapular plane with the sideways raise. |
| [Tip the pelvis](https://rorrimaesu.github.io/osteon-study/?motionMode=pose&motionGuide=pelvic-tilt#motion) and [level it on one leg](https://rorrimaesu.github.io/osteon-study/?motionMode=pose&motionGuide=hip-stance#motion) | Compare pelvic tilt with a stance example that keeps the right support ankle still. |
| [Turn the rib cage](https://rorrimaesu.github.io/osteon-study/?motionMode=pose&motionGuide=thoracic-turn#motion), [sweep the thumb across](https://rorrimaesu.github.io/osteon-study/?motionMode=pose&motionGuide=thumb-opposition#motion), and [unlock the knee](https://rorrimaesu.github.io/osteon-study/?motionMode=pose&motionGuide=knee-unlock#motion) | Compare thoracic and lumbar turning, observe first-metacarpal rotation, and inspect slight tibial rotation as the knee bends. |
| [Bring the raised arm across](https://rorrimaesu.github.io/osteon-study/?motionMode=pose&motionGuide=arm-across#motion) and [compare the rotator cuff](https://rorrimaesu.github.io/osteon-study/?motionMode=pose&motionGuide=cuff-rotation#motion) | The preview sets up the arm and elbow positions. Compare pectoralis major and deltoid during the sweep, and subscapularis with infraspinatus and teres minor during rotation. |
| [Approach a precision pinch](https://rorrimaesu.github.io/osteon-study/?motionMode=pose&motionGuide=pinch#motion), [curl into a grip](https://rorrimaesu.github.io/osteon-study/?motionMode=pose&motionGuide=power-grip#motion) and [lift the second toe](https://rorrimaesu.github.io/osteon-study/?motionMode=pose&motionGuide=lesser-toe#motion) | Coordinated finger and thumb motions show a pinch approach and an empty-hand grip. The toe guide demonstrates an independent base joint with shared digital muscle surfaces. |
| [Lift the great toe](https://rorrimaesu.github.io/osteon-study/?motionMode=pose&motionGuide=great-toe#motion), [slide the jaw sideways](https://rorrimaesu.github.io/osteon-study/?motionMode=pose&motionGuide=jaw-side#motion), and [slide it forward](https://rorrimaesu.github.io/osteon-study/?motionMode=pose&motionGuide=jaw-forward#motion) | Inspect the independent great-toe joint and compare the moving mandibular condyles. Tooth and disc contact remain outside the jaw teaching approximation. |

## References

- [OpenStax body movements](https://openstax.org/books/anatomy-and-physiology-2e/pages/9-5-types-of-body-movements)
- [OpenStax muscle interactions](https://openstax.org/books/anatomy-and-physiology-2e/pages/11-1-interactions-of-skeletal-muscles-their-fascicle-arrangement-and-their-lever-systems)
- [Cervical segment rotation in vivo](https://pmc.ncbi.nlm.nih.gov/articles/PMC3701975/)
- [Atlanto-occipital motion in vivo](https://pubmed.ncbi.nlm.nih.gov/39084063/)
- [Shoulder complex during arm elevation](https://pubmed.ncbi.nlm.nih.gov/19181982/)
- [Hip flexion and rotational moment arms](https://nmbl.stanford.edu/publications/pdf/Delp1999.pdf)
- [Mandibular kinematics in vivo](https://pmc.ncbi.nlm.nih.gov/articles/PMC7860955/)
- [Holzbaur et al., upper-extremity musculoskeletal model](https://pubmed.ncbi.nlm.nih.gov/16078622/)
- [Hicks et al., verification and validation of musculoskeletal simulations](https://pmc.ncbi.nlm.nih.gov/articles/PMC4321112/)
- [W3C alternatives to dragging](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html)
- [Anatomy geometry and derivative attribution](assets/MODEL-LICENSE.md)
