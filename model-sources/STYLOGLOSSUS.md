# Styloglossus study model

`assets/muscle-reference/ch11-styloglossus.glb` shows the left and right styloglossus from a finite-element model of the human tongue. The darker surfaces are the exposed faces of the source's 16 hexahedral elements per side. The lighter shapes are teaching envelopes around the nine source fiber routes to the styloid anchor on each side. They indicate the path from the tongue to the styloid attachment. The envelopes estimate the outer contour of the proximal portions between the labeled fiber endpoints. This specimen is a standalone model in its own anatomical coordinates.

## Source and license

The underlying data come from the [ArtiSynth Models tongue package](https://github.com/artisynth/artisynth_models/tree/e37be3f1b4831f347c055cbf7124b6bd57414f98/src/artisynth/models/tongue3d), pinned at commit `e37be3f1b4831f347c055cbf7124b6bd57414f98`. The source geometry and fiber macros credit J.-M. Gérard and S. Buchaillard, ICP and TIMC/DPC-GIPSA. See the [ArtiSynth biomechanical model](https://www.artisynth.org/Demo/BiomechanicalTongueModel) and [Buchaillard, Perrier and Payan (2009), *A biomechanical model of cardinal vowel production*](https://doi.org/10.1121/1.3204306). [OpenStax Anatomy and Physiology 2e, figure 11.11a](https://openstax.org/books/anatomy-and-physiology-2e/pages/11-3-axial-muscles-of-the-head-neck-and-back#eip-id2442164) shows the relationship to the temporal bone and adjacent tongue muscles.

Osteon extracted the exterior surfaces for the named finite-element regions, constructed the lighter convex envelopes from the fiber endpoints, centered and oriented the result, and assigned contrasting study colors in Blender 4.5.1. The model is redistributed under the [ArtiSynth Models data license and copyright notice](artisynth-models-LICENSE.txt).

## Reproduction

Obtain these four source files from the pinned [geometry directory](https://github.com/artisynth/artisynth_models/tree/e37be3f1b4831f347c055cbf7124b6bd57414f98/src/artisynth/models/tongue3d/geometry). The SHA-256 sums identify the source files used for the export.

| File | SHA-256 |
| --- | --- |
| `tongueIcp.3.node` | `5c353fc83a4da53d80306e53feba3010b6cb8bf56c5a0b171d06e6625faecfbd` |
| `tongueIcp.3.elem` | `807a1d863d55f7674cb3d06056f519e225592cc93231fc04964bdf5515b177ed` |
| `tongueIcp.3.mac` | `1f3569bd44e84ac2b37a8c20d624ce412f1dfc0661012869200ab3ad1b3b3d18` |
| `Fibers.mac` | `cc9ade837523949a493431b937b08037b669ef25502c40da8d5bcd21de6f22e2` |

```sh
blender -b --factory-startup --python-exit-code 1 --python scripts/blender/export_styloglossus_reference.py -- SOURCE_DIRECTORY OUTPUT.glb
```

The output uses meters. Its glTF coordinates are Y-up, anterior toward +Z, and anatomical left toward +X. The initial left anterolateral view uses the direction `[1, 0.24, 0.35]`.
