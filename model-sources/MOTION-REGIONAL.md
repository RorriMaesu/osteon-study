# Regional Motion Lab models

The Blender 4.5 builder creates four independent regional teaching specimens from the delivered Osteon anatomy. Each exact muscle part keeps its existing atlas identity and anatomical side. The regional downloads remain separate so a learner only loads the current specimen.

| Specimen | Modeled motion and contextual geometry |
| --- | --- |
| Blink | Bilateral palpebral orbicularis oculi and levator palpebrae superioris deform. The orbital portions of orbicularis oculi and orbital bones show the surrounding anatomy. |
| Breathing | Fifteen parts deform. The diaphragm domes and three bilateral intercostal layers move with the ribs. Four bilateral abdominal muscles follow quiet inspiration and simulate wall compression during forced expiration. |
| Jaw | Sixteen parts deform, including both masseter heads, temporalis, medial pterygoid, inferior lateral pterygoid and suprahyoid muscles. The mandible and lower teeth rotate and glide together. Superior lateral pterygoid and posterior digastric remain contextual. |
| Smile | Fourteen bilateral perioral components deform from their atlas surfaces, including zygomaticus major and depressor anguli oris. The shared mouth-corner displacement pulls the corners upward and outward. |

The lift and closure of the eyelids are modeled at the atlas muscle surfaces. This atlas has no lid skin, tarsal plates or globe in this specimen. The breathing lesson depicts respiratory wall motion using small posterior-pivot rib rotations and a dome deformation. Its jaw-opening example uses a stabilized hyoid, symmetric movement, and no temporomandibular disc simulation. The smile represents one symmetric outline and uses the source's muscle surfaces without facial skin. The colors indicate selected anatomical teaching roles. Individual recruitment, tissue loading and muscle-fiber strain are outside these specimens.

## Evidence and reproducibility

The source geometry is Osteon's distributed Z-Anatomy and BodyParts3D derivative anatomy. Individual attribution and license terms appear in [Model licenses](../assets/MODEL-LICENSE.md). Derived GLBs retain CC BY-SA 4.0 credit. Anatomical basis and motion references appear in each asset manifest. These include [human eyelid kinematics](https://pmc.ncbi.nlm.nih.gov/articles/PMC12358864/), [standing tidal diaphragm motion](https://pubmed.ncbi.nlm.nih.gov/27989446/), [respiratory roles by intercostal region](https://journals.physiology.org/doi/10.1152/physrev.00007.2004), [in-vivo 3D jaw kinematics](https://pmc.ncbi.nlm.nih.gov/articles/PMC7860955/) and [zygomaticus major insertion](https://pubmed.ncbi.nlm.nih.gov/18300963/).

Run [the regional Blender builder](../scripts/blender/build_motion_regional.py) with the repository directory, a new output directory outside the repo, and one region name from the usage line. The builder makes hash-verified input copies before opening the model in Blender, then backs up the editable project before export. It writes the GLB, the verified manifest and the editable Blender project into the new directory. Breath uses web surface reduction on high-density input meshes. The manifest records input hashes and checks the imported GLB for side and identity, expected morph targets, finite nonzero displacement and geometric edge-length ratios. The motion scenes and close-ups were also inspected at neutral and excursion poses. These measurements characterize visible model motion.
