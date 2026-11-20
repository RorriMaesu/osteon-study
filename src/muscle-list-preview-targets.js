import {courseMuscleTargetById, courseTargetComponents} from './muscle-spatial-data.js';
import manifest from './muscle-models.json' with {type:'json'};

const viewNames = {front:'anterior', back:'posterior', right:'lateral', top:'superior', bottom:'inferior'};
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
  const viewLabel = viewNames[view]+' view';
  let caption = side+' · '+viewLabel;
  if (id === 'ch11-diaphragm') caption = 'Superior view';
  if (status === 'partial') caption = 'Partial group · '+viewLabel;
  if (status === 'examples') caption = target.examples[0].name+' · example';
  return {id, name, view, status, components, caption, note:target.note, src:'assets/muscle-previews/'+id+'.webp'};
}
