import {courseMuscleTargetById, courseTargetComponents} from './muscle-spatial-data.js';
import manifest from './muscle-models.json' with {type:'json'};

const viewNames = {front:'anterior', back:'posterior', right:'lateral', top:'superior', bottom:'inferior'};
// Preview cameras use the glTF axes. Keep the study and assessment presets separate.
const previewAngles = {
  'extensor-carpi-radialis': {direction:[-.383,.423,-.821], label:'posterolateral oblique view'},
  'extensor-digitorum': {direction:[0,.423,-.906], label:'posterior oblique view from above'},
  'extensor-digitorum-longus': {direction:[-.821,-.423,.383], label:'anterolateral oblique view'},
  'extensor-pollicis-longus': {direction:[0,.423,-.906], label:'posterior oblique view from above'},
  'extensor-retinaculum-of-wrist': {direction:[.879,-.242,-.41], label:'posteromedial oblique view'},
  'flexor-carpi-radialis': {direction:[0,-.423,.906], label:'anterior oblique view from below'},
  'flexor-digitorum-longus': {direction:[-.383,.423,-.821], label:'posterolateral oblique view'},
  'flexor-digitorum-superficialis': {direction:[0,-.423,.906], label:'anterior oblique view from below'},
  'flexor-retinaculum-of-wrist': {direction:[-.97,.242,0], label:'lateral oblique view from above'},
  'gluteus-medius': {direction:[-.821,-.423,-.383], label:'posterolateral oblique view'},
  'hamstrings': {direction:[0,.423,-.906], label:'posterior oblique view from above'},
  'internal-oblique': {direction:[-.383,.423,.821], label:'anterolateral oblique view'},
  'levator-scapulae': {direction:[-.641,-.423,-.641], label:'posterolateral oblique view'},
  'opponens-pollicis': {direction:[-.686,-.242,.686], label:'anterolateral oblique view'},
  'pectoralis-minor': {direction:[-.383,-.423,.821], label:'anterolateral oblique view'},
  'quadriceps-femoris': {direction:[0,.423,.906], label:'anterior oblique view from above'},
  'semitendinosus': {direction:[.641,.423,-.641], label:'posteromedial oblique view'},
  'sternocleidomastoid': {direction:[-.906,.423,0], label:'lateral oblique view from above'},
  'supraspinatus': {direction:[.383,.423,-.821], label:'posteromedial oblique view'},
  'teres-minor': {direction:[.641,-.423,-.641], label:'posteromedial oblique view'},
  'tibialis-anterior': {direction:[-.383,-.423,.821], label:'anterolateral oblique view'},
  'zygomaticus-major': {direction:[-.641,.423,.641], label:'anterolateral oblique view'},
};
const overlapNotes = {
  'rotator-cuff':'In this view the subscapularis lies behind the posterior muscles. Rotate in 3D to see the front of the group.',
  'quadriceps-femoris':'Vastus intermedius lies deep to rectus femoris. Its individual card shows it in isolation.',
};
const illustrations = {
  'ch11-styloglossus': {
    caption:'Lateral view · illustration',
    note:'Visible lateral fibers redrawn from OpenStax Anatomy and Physiology 2e, figure 11.11a.',
    sourceLabel:'OpenStax',
    sourceUrl:'https://openstax.org/books/anatomy-and-physiology-2e/pages/11-3-axial-muscles-of-the-head-neck-and-back',
  },
  'ch11-ischiocavernosus': {
    caption:'Female · inferior view · illustration',
    note:'Paired superficial perineal muscles redrawn from OpenStax Anatomy and Physiology 2e, figure 11.20.',
    sourceLabel:'OpenStax',
    sourceUrl:'https://openstax.org/books/anatomy-and-physiology-2e/pages/11-4-axial-muscles-of-the-abdominal-wall-and-thorax',
  },
  'ch11-external-urethral-sphincter': {
    caption:'Female · transverse section · schematic',
    note:'One level of the striated sphincter proper, with anterior at the top and a posterior opening. The compressor urethrae and urethrovaginal sphincter lie at other levels. Adapted from figure 2f.',
    sourceLabel:'Liu et al.',
    sourceUrl:'https://pmc.ncbi.nlm.nih.gov/articles/PMC12003430/#Fig2',
  },
};

export function muscleListPreviewTarget(cardId) {
  const target = courseMuscleTargetById.get(cardId);
  if (!target) return null;
  const {id, name, status, view} = target;
  const illustration = illustrations[id];
  if (illustration) {
    return {id, name, view, status, components:[], src:'assets/muscle-previews/'+id+'.svg', ...illustration};
  }
  const components = courseTargetComponents(target, 'right', 0);
  // The source exports this muscle's four distal tendon slips as a separate mesh.
  if (id === 'ch11-extensor-digitorum-longus') {
    components.push(manifest.components.find(component => component.id === 'muscle-tendon-of-extensor-digitorum-longus-r' && !component.retired));
  }
  const side = components.every(component => component.side === 'right') ? 'Right' : 'Both sides';
  const angle=previewAngles[id.slice(5)];
  const viewLabel = angle?.label||viewNames[view]+' view';
  let caption = side+' · '+viewLabel;
  if (id === 'ch11-diaphragm') caption = 'Superior view';
  if (status === 'partial') caption = 'Partial group · '+viewLabel;
  if (status === 'examples') caption = target.examples[0].name+' · example';
  const note=[target.note,overlapNotes[id.slice(5)]].filter(Boolean).join(' ');
  return {id, name, view, status, components, caption, note, direction:angle?.direction,
    src:'assets/muscle-previews/'+id+'.webp'+(angle?'?v=oblique-1':'')};
}
