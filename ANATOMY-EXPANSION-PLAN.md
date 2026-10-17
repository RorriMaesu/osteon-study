# Region navigation and complete bone-landmark expansion

Status: navigation and regional palettes implemented in Stage 15, 17 October 2026. Back/breadcrumbs, Region / Bone alternatives and the existing-target Landmarks browser are also implemented. The additional textbook landmark inventory and its new 3D representations remain under validation; the remaining sections describe that work's acceptance criteria.

The learning sequence is **whole skeleton -> region -> individual bone -> selected feature**. Each step should answer one question: Where am I? Which bone is this? Where is the feature? What distinguishes it from its neighbors?

## 1. The interaction contract

| Current view | Action on a visible bone | Result |
| --- | --- | --- |
| Whole skeleton, including Axial-only or Appendicular-only overviews | Single click | Select and show the bone's information; keep the camera where it is. |
| Whole skeleton | Double-click | Open and frame its anatomical region, retaining useful neighboring bones. |
| A focused region, entered by double-click, region control or Explore region | Single click | Select another bone without zooming or isolating it. |
| A focused region | Double-click | Isolate the clicked bone instance and frame that bone. |
| An isolated bone | Double-click the same bone again | Keep the bone focused; do not bounce between levels. |
| Any focused view | Back / breadcrumb | Return one level and restore its camera orientation and selection. |
| Any view | Whole skeleton / Reset | Return to the appropriate division overview with neutral bone materials. |

A pair of clicks must not produce an intermediate zoom to the individual bone before the region opens. Double-clicking empty background does nothing. Dragging, rotating and pinching must not count as a double-click. New camera motion cancels the previous transition. Respect reduced motion; use a short, smooth transition without spinning the specimen.

Provide **Explore region** and **Focus bone** buttons as equivalent actions. Touch users can double-tap a bone, but the visible buttons remain available. Keyboard users select a named bone from Browse and use the same buttons. Make the next action discoverable with a short contextual hint, rather than requiring learners to discover the gesture.

**Critique:** camera distance is not a reliable navigation state. A learner may zoom manually, rotate, select a landmark or open a reading without intending to change levels. Store overview, region and bone focus explicitly. A manually enlarged overview does not silently acquire regional colors or bone-isolation behavior.

## 2. Regions that feel anatomically useful

Retain the existing broad Skull / Spine / Thorax / Upper limb / Pelvis / Lower limb filters. Add smaller exploration areas for double-click framing:

| Bone clicked from overview | First destination |
| --- | --- |
| Cranial, facial or auditory bone | Skull |
| Cervical vertebra or hyoid | Neck |
| Thoracic vertebra | Thoracic spine, with nearby rib context |
| Lumbar vertebra | Lower back |
| Rib or sternum | Thoracic cage |
| Clavicle or scapula | Shoulder girdle |
| Humerus | Upper arm, with shoulder/elbow context |
| Radius or ulna | Forearm |
| Carpal, metacarpal or hand phalanx | Hand and wrist |
| Hip bone, sacrum or coccyx | Pelvis |
| Femur | Thigh, with hip/knee context |
| Patella | Knee |
| Tibia or fibula | Leg |
| Tarsal, metatarsal or foot phalanx | Foot and ankle |

Use authored region bounds and anatomical centers. Do not frame every complete neighboring long bone merely because part of it belongs in a region; that could make a shoulder view include the entire arm. Maintain anatomical left/right from source identities. The second double-click isolates the actual clicked side and bone, rather than both members of a bilateral course group. Reassemble multipart representations when they represent one bone, such as the sternum.

Regional navigation and skeletal divisions remain separate. The sacrum and coccyx remain axial when shown in the pelvis; hip bones remain appendicular. Respect the current division filter. If a shared feature needs excluded contributors, offer an explicit switch to All rather than silently changing the division.

## 3. Regional bone colors

- Keep whole-skeleton, axial and appendicular overviews neutral, even when the saved color preference is On.
- Apply colors in every explicit regional view and retain them in its bone-focus view. The Skull region follows the same rule as every other region.
- Replace the skull-specific control with **Bone colors: On / Off**. Keep it visible in focused views, and remember the preference across navigation and reloads.
- Assign colors by stable anatomical identity. Bilateral counterparts share a color; neighboring different bones should contrast. Rib numbers and vertebral levels need consistent entries rather than random colors on each visit.
- Keep a bone's color consistent when it appears in overlapping regions. Keep cartilage, teeth and soft tissues distinguishable from bone colors. Adult ilium, ischium and pubis are parts of the fused hip bone, not three separate adult bones to miscount in the key.
- Show the relevant color key in an optional, paged dialog. Use text names and side/level information alongside swatches. Selection adds an outline and a modest emphasis; it does not replace the bone's assigned hue.
- Disable identity colors and named hints during scored identification. Restore the saved exploration preference afterward.

**Critique:** dozens of colors cannot provide a dependable identification system by themselves. Color helps separate neighboring geometry; names, outlines, search and view controls provide the accessible alternative. Test palettes in the actual lighting, including color-vision simulations, rather than judging swatches alone.

## 4. What “all textbook features” means

Treat “follus” as **fossae**: the plural of fossa. Inventory named projections, depressions, openings, passages, articular surfaces, bone parts and relevant shared boundaries. Include processes, spines, crests, lines, ridges, tubercles, tuberosities, trochanters, heads, necks, condyles, epicondyles, facets, fossae, foveae, notches, grooves/sulci, fissures, foramina, canals, meatuses and bony cavities.

Use chapters 6-8 as the skeletal backbone, reconcile every supplied BI 231 lab item, and check other chapters for additional named bony attachments and passages. The entire supplied 1,347-page PDF has been indexed locally for this planning audit. Whole-book indexing is a search aid, not a substitute for checking figure labels, tables and anatomical meaning.

Keep three scales distinct:

1. **Macroscopic landmarks:** locate them on a validated bone or articulated group.
2. **Interior bony spaces:** use verified interior geometry, entry/exit views or a cited section illustration.
3. **Bone histology:** open a separate close-up for central/perforating canals, canaliculi and lacunae. Do not pretend these microscopic features are resolved on the adult skeleton.

Exclude unrelated soft-tissue structures that happen to share the words canal, foramen, fossa or sulcus. Teeth are also not bones. Keep bone and spinal-cord central canals distinct. Ear extensions must distinguish osseous labyrinth spaces from membranous ducts and sensory tissues.

### Initial source audit

[LANDMARK-EXPANSION-AUDIT.csv](LANDMARK-EXPANSION-AUDIT.csv) contains **256 source rows: 237 feature candidates and 19 marking-vocabulary entries**. It records source pages, a planning parent/context, links to current graded targets where found, and unvalidated source annotation candidates.

- 81 feature-source rows link to a current graded target, sometimes only as a grouped or related structure.
- 156 feature-source rows have no matched current graded target. This does not mean they are absent from all reading or glossary content.
- These are source entries, not a final count of unique features. Aliases, repeated instances, grouped structures and vocabulary types must not inflate completion counts.
- The initial inventory starts with chapter key terms, Table 6.2 and selected additional text. A complete figure-label and body-text reconciliation remains required before declaring textbook coverage complete.
- Raw annotation candidates are leads for inspection, not validated 3D anchors. A nearest-surface distance cannot establish anatomical correctness.
- Table 6.2's “auricular fissure” example is explicitly unresolved. Check authoritative anatomy/errata before assigning any location; do not silently invent one.

Confirmed expansion areas include additional cranial openings and fossae, sacral and vertebral features, rib features, humeral/ulnar/radial markings, iliac and pubic landmarks, and femoral/tibial/fibular features. Verify names and aliases before deciding which need a new learning identity.

## 5. Reveal detail without covering the skeleton

| Level | Default on the specimen | Optional detail |
| --- | --- | --- |
| Overview | No landmark pins or persistent name labels | One hovered/selected bone name |
| Region | Bone colors if enabled; no blanket landmark layer | Open searchable Landmarks for this region |
| Bone | Selected bone and its feature list | Browse one feature category at a time |
| Selected feature | One active pin/outline and one name callout | Show a small set of nearby comparison targets |

The Landmarks panel filters **Openings and passages / Depressions and grooves / Projections and ridges / Articular surfaces / Bone parts and boundaries**. Search accepts textbook names, common synonyms and the parent bone. Selecting a result frames a useful view and selects its location; it never merely highlights the parent bone and calls that landmark completion.

Default to a single active feature. A deliberate comparison mode allows at most **five numbered targets on desktop and three on mobile**. Names appear in the panel and for the active target, rather than printing every label across the model. Limit collisions in screen space, keep leader lines attached to their real anchors and prioritize the selected target. Suppress other labels when they cannot fit.

Respect occlusion. Do not draw an internal target through opaque bone as though it were visible on the surface. Offer a meaningful front/back/superior/inferior or interior preset and show “Occluded - rotate or open interior view” when appropriate. Let learners explicitly request transparent context or a cutaway. A selected pin must not be moved to an anatomically false position to make its label fit.

**Critique:** a small number of tiny pins can still be unusable. Provide a touch-sized label/button for each candidate, keep search and the text list usable independently of WebGL, and evaluate actual label collisions on the smallest supported screen. Do not reduce educational text to make the layout fit.

## 6. Accurate representation and model work

Each feature needs a stable identity, source/section/page, contributing bone instances, side/level, feature class, valid viewing presets, representation type and validation status. Record variants and whether a target is a point, an extended surface, a boundary or a passage.

Use the following order:

1. Inspect the existing web mesh against the original Z-Anatomy source and the textbook view. Check whether simplification has closed a small opening or removed a projection.
2. Reuse a source annotation only after verifying its anatomical endpoint, contributing bone, side and orientation. Check the final exported mesh as well as the Blender source. Do not assume all 1,194 raw source-point entries are reliable.
3. Use a verified surface anchor for a reference point. For an extended crest, fossa or rim, provide a validated outline/region where feasible and label the distinction from a point.
4. For a canal, identify entrances/exits and use a path only if its course is supported by source geometry or a reliable anatomical source. A straight line between two openings is not adequate evidence of the full canal.
5. If needed, export a more detailed version of that bone from Blender 4.5 and load it only for close inspection. Preserve model alignment and attribution. Do not replace the entire lightweight skeleton with a heavy model.
6. Until usable 3D geometry is verified, provide the corresponding cited textbook illustration with precise numbered targets and a clear “Textbook view” label. Keep the feature searchable and learnable without claiming it is accurately localized in 3D.

Bind validated surface anchors to a geometry revision and, where suitable, a mesh triangle/barycentric position so a later export cannot silently detach them. Verify both sides independently; do not assume perfect symmetry.

Shared features require special handling. An intervertebral foramen needs adjacent vertebrae; a cranial opening can involve more than one skull bone; a pelvic boundary needs the contributing ring. A sciatic foramen also requires ligament context. Selecting such a feature may open **Shared feature** context with just its necessary contributors. Back restores the isolated bone. Do not substitute a bony notch for a ligament-completed opening or score a parent bone as the feature.

Cutaways reveal interior relationships but create artificial cut edges. Mark them as section views and never use those artificial edges as anatomical targets. Avoid filling a foramen with a fake surface simply to make it clickable; use verified target proxies or reference pins instead.

## 7. Learning and assessment

Use a short sequence: locate the region, identify the bone, find a feature, then distinguish it from a similar neighbor. Teach marking vocabulary through actual examples rather than a long list alone.

Offer Learn, Locate and Name modes using the same validated feature registry. Learn can show one name and a location; Locate and Name hide answer labels and bone identity colors. Hints progress from region to bone to helpful view to revealed target; assistance is recorded separately from independent accuracy. A feature without a valid location representation must not enter a scored 3D localization queue.

Keep the original 177-item lab checklist and its saved progress intact. Add a separate **Textbook landmarks** bank, with optional combined practice. Aliases share one concept identity; meaningful sides, levels and subfeatures have explicitly defined instance rules. Group-level knowledge must not automatically mark every subfeature mastered.

Pass the current region, bone, feature, source and representation to the Socratic tutor. The tutor can ask comparison questions using curated material. It must not invent coordinates, assert a missing model feature exists, or turn an assisted answer into independent credit.

## 8. Desktop and mobile layout

Preserve the viewport-sized desktop workspace. Put the breadcrumb and short next-action hint inside the existing specimen header. Use the existing paged details area for feature filters/list/description, and an optional dialog for the color key. Keep Back, region, Focus bone, Bone colors and Landmarks reachable without document scrolling.

On mobile, keep Specimen / Browse / Details. Browse offers Bones / Landmarks tabs with search; choosing a feature returns to the specimen. Details remains one tap away. Show one compact active callout, maintain 44-pixel touch controls and safe-area spacing, and keep pinch/rotate gestures. Reading can continue using natural vertical flow on phones.

Animate only changes that clarify orientation: region framing, bone isolation, restoration and active-feature emphasis. Defer detailed geometry loading until needed and provide visible loading/cancel/retry states. Cap rendering work on phones and stop label-layout work when no pins are visible.

## 9. Implementation stages and release gates

1. **Navigation and palettes.** Implement explicit focus state, area definitions, the two double-click actions, Back/breadcrumbs, accessible equivalents and regional colors. Publish after verifying every bone routes sensibly and overviews remain neutral.
2. **Complete source registry.** Finish the body-text/table/figure-label reconciliation across the supplied textbook, normalize aliases, verify contributors and distinguish generic terms from named instances. Publish the expanded inventory with unresolved entries visible. Do not announce complete feature coverage while this reconciliation remains open.
3. **Validated landmark batches.** Work through skull; spine/thorax; shoulder/upper limb/hand; pelvis/lower limb/foot; and interior/microscopic views. Publish each batch with its own representation/verification report. Use Blender only where source inspection demonstrates a need.
4. **Learning integration.** Connect searchable features, selective pins, comparison mode, textbook views, the new practice bank, progress and tutor context. Preserve existing course IDs and data backups.
5. **Cross-device verification.** Review anatomy views, pointer/touch/keyboard behavior, label density, motion, performance, source links and progress persistence. Publish the verified build and the remaining limits.

### Acceptance checks

- Overview double-click frames a region; the next double-click isolates only the clicked bone instance. Single clicks never cause an extra zoom. Test different bones, repeated clicks, rapid navigation, dragging, peeling and camera presets.
- A region opened through its control behaves like a region opened by gesture. Back restores the prior level and pose; division changes, Reset and direct links cannot leave stale isolation or palette state.
- Assessment input takes precedence: exploration gestures cannot reveal a target, narrow the answer scope, hide a test bone or bypass scoring. Peel/Shift-click is a separate gesture and never triggers navigation.
- Colors work for every region, survive navigation/reload preferences, remain off in overview and assessment, and do not color soft tissues as bones.
- Every source candidate resolves to a canonical feature, a documented alias, a teaching category, an explicitly excluded non-bony structure or an unresolved issue. Every feature has a source and an honest representation status. No guessed anchors.
- Show content coverage and verified 3D coverage as separate measures. A diagram fallback can satisfy a learning representation but cannot count as verified 3D geometry. Release checks block stronger completion claims while unresolved anatomy remains.
- Check desktop at 1024 x 768, 1280 x 600, 1280 x 720, 1440 x 900 and 1920 x 1080 without page overflow; phones at 360 x 740 and 390 x 844, plus landscape. Verify label limits, visible controls, readable source views and preserved drafts/progress.
- Test real touch behavior, keyboard equivalents, reduced motion, color independence and WebGL failure. Verify high-detail downloads do not block basic exploration or unnecessarily load on overview.

## Source and licensing record

Based on the supplied OpenStax Anatomy and Physiology 2e PDF, the existing BI 231 transcription, the current application and original Z-Anatomy annotation/model metadata. Source page numbers in the audit are one-based PDF pages and printed page numbers; they do not imply a verified 3D location. The supplied textbook's CC BY-NC-SA 4.0 and the model's CC BY-SA licensing/attribution remain as described in [CREDITS.md](CREDITS.md). Do not publish the original full PDF, course document or machine-specific file paths.
