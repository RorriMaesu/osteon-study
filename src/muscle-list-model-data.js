// Supplemental study specimens use their source coordinates independently of the adult atlas.
export const muscleStudyModels={
 'ch11-styloglossus':{
  src:'assets/muscle-reference/ch11-styloglossus.glb',
  kind:'ArtiSynth research model with attachment reconstruction',
  view:[1,.24,.35],
  note:'The darker surfaces are the paired modeled regions within the tongue. The lighter extensions show the attachment paths to the styloid processes, reconstructed from the model’s fiber paths.',
  sourceLabel:'Buchaillard, Perrier & Payan',
  sourceUrl:'https://doi.org/10.1121/1.3204306',
 },
 'ch11-ischiocavernosus':{
  src:'assets/muscle-study/ischiocavernosus.glb',
  kind:'Pelvic dissection model · inferior view',
  view:[0,-1,.18],
  note:'Isolated ischiocavernosus from a male pelvic-floor specimen. The OpenStax diagram shows this muscle in both sexes.',
  sourceLabel:'Leiden University Medical Center',
  sourceUrl:'https://caskanatomy.info/open3dviewer/?model=pelvicfloor',
 },
 'ch11-pelvic-diaphragm':{
  src:'assets/muscle-study/pelvic-diaphragm.glb',
  kind:'Pelvic dissection model · superior view',
  view:[0,1,.18],
  note:'Blue shows coccygeus and clay shows iliococcygeus. Mint and gold identify puborectalis and pubococcygeus on a shared muscle surface. The left side mirrors the dissected right side.',
  sourceLabel:'Leiden University Medical Center',
  sourceUrl:'https://caskanatomy.info/open3dviewer/?model=pelvicfloor',
 },
 'ch11-external-urethral-sphincter':{
  src:'assets/muscle-study/external-urethral-sphincter.glb',
  kind:'Female mid-urethra · histology-based teaching model',
  view:[0,.55,-1],
  note:'Shows the striated sphincter proper around the female mid-urethra, with an opening posteriorly. The teaching model interpolates between three published histology sections.',
  sourceLabel:'Liu et al. · Figures 2–3',
  sourceUrl:'https://pmc.ncbi.nlm.nih.gov/articles/PMC12003430/#Fig2',
 },
};
