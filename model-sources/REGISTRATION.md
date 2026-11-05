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

## Further sources deliberately not shipped

Additional original soft-palate, laryngeal, pelvic and spinal muscle sources were located. Initial regional bone registration gave differences as large as 8.3 mm around the palatine reference, and the existing spinalis/semispinalis and puboanalis/puborectalis identities remain unresolved. These meshes are not overlaid or renamed automatically: that could add misleading duplicates or incorrect attachments. The open entries remain visible in the audit until their source relationships and fit are resolved. The recovered groups do not make the atlas complete.
