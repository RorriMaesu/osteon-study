import {readFileSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {organMotions} from '../src/organ-atlas-catalog.js';

// Limit mixed regional specimens to structures relevant to this particular lesson.
// Raw node names (including laterality) are the source's identifiers.
const all = /.*/;
const scope = {
  'adipose-lipolysis': all, adrenal: all, alveoli: all, artery: all,
  'formed-elements': all, heart: all,
  'coronary-circulation': /artery|vein|coronary|marginal|aorta|atrium|ventricle/,
  aorta: /aort|^VH_M_heart_left_ventricle$|coronary_artery/,
  'pulmonary-outflow': /pulmonary|right_ventricle|tricuspid|septum/,
  'paired-ears': /^(helix|concha_of_auricle|lobule_of_auricle|cochlea|tympanic_membrane|malleus|incus|stapes)_/,
  'paired-eyes': /^(iris|retina|sclera|lens|cornea)_/,
  brain: all, brainstem: /Medulla|Pons|Midbrain|Cerebellum|Thalamus/,
  cerebellum: /Medulla|Pons|Midbrain|Cerebellum/, ventricles: all, eye: all,
  'cranial-nerves': all, 'spinal-cord': all, 'inner-ear': /duct|ampulla|Utricle|Saccule/, cochlea: /Scala|Utricle|Saccule/,
  skin: all, 'nasal-olfaction': all, 'tongue-taste': all,
  hypothalamus: all, pituitary: all, pineal: all, parathyroids: all, thyroid: all, 'glandular-pancreas': all,
  'red-marrow': all, spleen: /spleen|splenic|portal_vein|stomach|pancreas/,
  'nephron-transit': all, 'renal-acid-base': all, 'respiratory-acid-base': all,
  'mammary-glands': all, placenta: all,
  ovaries: /ovary|tube|fallopian|cornua/, 'uterine-tubes': /ovary|tube|fallopian|cornua|fundus_of_uterus/,
  uterus: /uterus|uterine_segment|cervi|cornua/, cervix: /uterus|uterine_segment|cervi|cornua/,
  'female-collecting-system': /calyx|renal_pelvis|ureter$/, 'female-bladder': /urinary_bladder|ureter/,
  'female-ureters': /urinary_bladder|ureter|renal_pelvis/,
  kidneys: /kidney|renal|ureter/, ureters: /kidney|ureter|renal_pelvis|bladder/, 'urinary-bladder': /bladder|ureter|urethra/,
  'female-urethra': /urethra|bladder|vagina|pubic/, vagina: /vagina|cervix|urethra|bladder|rectum|uterine_body/,
  'trachea-bronchi': /trachea|bronchus|lobe_of|thyroid_cartilage/, lungs: all, diaphragm: /lung|diaphragm|rib/,
  larynx: /^(epiglottis|cricoid|thyroid_cartilage|arytenoid_cartilage|trachea)/,
  phonation: /arytenoid|vocalis|cricothyroid/i,
  stomach: /esophagus|stomach|duodenum/, duodenum: /stomach|duodenum|jejunum/,
  jejunum: /duodenum|jejunum|ileum/, ileum: /jejunum|ileum|ileocecal_junction/,
  appendix: /^(cecum|ascending_colon|ileum|vermiform_appendix)$/, cecum: /^(cecum|ascending_colon|ileum|vermiform_appendix)$/,
  'ascending-colon': /ileocecal_junction|ascending_colon|transverse_colon/,
  'transverse-colon': /ascending_colon|transverse_colon|descending_colon/,
  'descending-colon': /transverse_colon|descending_colon/, 'sigmoid-colon': /colon/,
  liver: /liver|hepatic_portal_vein|bile_duct|gallbladder/, gallbladder: /liver|gallbladder|cystic_duct|bile_duct|duodenum/,
  pancreas: /pancreas|pancreatic_duct|duodenum|bile_duct/,
  'submandibular-glands': /submandibular|sublingual|tongue/, 'sublingual-glands': /sublingual|tongue|submandibular_duct/,
  'parotid-glands': /parotid|upper_teeth/, 'tongue-swallow': /^(tongue|oropharynx|laryngopharynx|epiglottis)$/,
  'ductus-deferens': /ductus|epididymis|ejaculatory_duct/, 'ejaculatory-ducts': /ejaculatory|terminal_ductus|seminal_gland|prostate|urethra/,
  epididymis: /epididymis|testis|^ductus_deferens/, testes: /testis|epididymis|^ductus_deferens/,
  'seminal-glands': /seminal_gland|ejaculatory|terminal_ductus|prostate/, prostate: /prostate|urethra|ejaculatory|bladder/
};

export function indexStudySurfaces() {
  const root = new URL('../', import.meta.url);
  const sourceNodes = new Map(), entries = {};
  for (const entry of organMotions) {
    const include = scope[entry.id];
    if (!include) continue;
    if (!sourceNodes.has(entry.asset)) {
      const glb = readFileSync(new URL(entry.asset, root));
      const gltf = JSON.parse(glb.toString('utf8', 20, 20 + glb.readUInt32LE(12)));
      sourceNodes.set(entry.asset, gltf.nodes.filter(node => node.mesh !== undefined).map(node => node.name));
    }
    const visible = new Set([...entry.targets, ...entry.context]);
    const extras = sourceNodes.get(entry.asset).filter(name => name !== 'flow_arrows' && include.test(name) && !visible.has(name));
    if (extras.length) entries[entry.id] = extras;
  }
  return entries;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  writeFileSync(new URL('../src/organ-study-surfaces.json', import.meta.url), JSON.stringify(indexStudySurfaces(), null, 2) + '\n');
}
