import { select, table } from './ap3-labs-experiments.js';

// Display windows use original pixel coordinates in the locally credited
// textbook plates. The full plate remains available in the lesson figure tab.
const micrographCredit = 'Micrograph provided by the Regents of the University of Michigan Medical School © 2012.';
function field(figure, section, size, box, description, micrograph=true) {
  return { figure, section, size, box, description, credit:micrograph?micrographCredit:'',
    kind:micrograph?'Textbook micrograph detail':'Textbook illustration detail' };
}

export const lymphMedia = [
  field('21.8','21.1',[1126,420],[58,77,454,274], 'A capsule borders densely cellular tissue with rounded nodules near the outer margin.'),
  field('21.9','21.1',[1126,1064],[330,595,385,420], 'A dark, rounded lymphoid area surrounds an arteriole and lies in tissue of a different staining density.'),
];

const intestinalFields = [
  { media:field('23.19','23.5',[1238,913],[520,634,405,219],'Long projections with connective-tissue cores extend from the mucosal surface into open space.'),
    answer:'Small intestine', why:'Villi project into the lumen and expand the absorptive surface. A villus contains a connective-tissue core covered by epithelium.',
    role:'Soluble nutrients can enter villus capillaries. Chylomicrons enter a central lacteal.' },
  { media:field('23.22','23.5',[1080,919],[259,567,553,301],'Many closely packed, roughly parallel glands extend inward from the surface. The field has no projecting villi.'),
    answer:'Large intestine', why:'A relatively flat surface with straight, closely spaced crypts supports identification of colon. Numerous goblet cells contribute mucus.',
    role:'The colon recovers water and electrolytes while mucus supports passage of the remaining contents.' },
];
export const intestinalTissue = {
  title:'Identify intestinal mucosa in section',section:'23.5',
  intro:'Examine the tissue field. Find the free surface and decide whether the repeated structures project into the lumen or extend inward as glands. Each image is a cropped detail.',
  controls:[select('field','Microscope field',['Field A','Field B'])],
  run({field:index}){
    const f=intestinalFields[Number(index)];
    return {media:f.media, observation:table('Field description',['Visible landmark'],[[f.media.description]]),
      question:'Which segment best explains this field?',choices:[f.answer,...['Small intestine','Large intestine','Esophagus'].filter(s=>s!==f.answer)],
      why:f.why,frames:[['At the lumen',f.media.description],['Tissue and function',f.role]]};
  },
};

const alveoli = field('22.11','22.1',[1260,745],[625,368,585,247], 'Numerous irregular air spaces share delicate partitions. They open off larger irregular air passages.');
export const gasSurface = {
  title:'Inspect an exchange surface',section:'22.1',
  intro:'Inspect the tissue before interpreting the fictional change. The micrograph shows the baseline architecture. Use the supplied condition to predict gas transfer at the same partial-pressure difference.',
  controls:[select('condition','Change from baseline',['Increase partition thickness','Reduce available exchange area'])],
  run({condition}){
    const thick=Number(condition)===0;
    return {media:alveoli, observation:table('Microscope field and experiment',['Measurement','Observation'],[
      ['Baseline landmark',alveoli.description],['Change',thick?'Diffusion distance doubles. Area stays fixed.':'Effective exchange area halves. Thickness stays fixed.']]),
      question:'With the same gas and the same pressure gradient, how does the predicted diffusion rate change?',
      choices:['It falls to about half','It doubles','It stays fixed'], why:'Diffusive transfer is proportional to area and inversely proportional to thickness. The delicate alveolar septa normally give gas a short path to blood.',
      frames:[['Identify the field','The small open air spaces separated by thin septa are alveoli.'],['Hold fixed','The partial-pressure gradient and the gas diffusion coefficient stay fixed.'],['Compare rates',thick?'Doubling the diffusion distance halves predicted transfer.':'Halving effective surface area halves predicted transfer.']]};
  },
};

const follicle = field('27.12','27.2',[987,1300],[133,835,348,430], 'A large, round oocyte is surrounded by a pale ring and a layer of smaller follicular cells.');
export const gonadField = {
  title:'Read an ovarian tissue field',section:'27.2',
  intro:'The image is a cropped ovarian micrograph. Locate the large central cell, then inspect the cells arranged around it.',
  controls:[select('target','Observation',['Central cell','Cells surrounding the oocyte'])],
  run({target}){
    const center=Number(target)===0;
    return {media:follicle,observation:table('Location under inspection',['Feature'],[[center?'A large round cell inside its surrounding pale zone.':'A layer of smaller cells outside the pale zona pellucida.']]),
      question:center?'Which structure occupies this central location?':'Which cells line the outside of the zona pellucida in this primary follicle?',
      choices:center?['Primary oocyte','Corpus luteum','Whole ovarian follicle']:['Granulosa cells','Myoepithelial cells','Leydig cells'],
      why:center?'The oocyte is one large cell within a follicle. The follicle includes supporting cells as well.':'Follicular granulosa cells surround the growing oocyte. The zona pellucida lies between the oocyte and this surrounding layer.',
      frames:[['Oocyte','The large round profile in the center is the oocyte.'],['Zona pellucida','A pale extracellular layer intervenes between the oocyte and surrounding follicular cells.'],['Follicle','Together, the oocyte and surrounding support cells form the follicle.']]};
  },
};

const cleavage = [
  {name:'Two-cell stage', next:'Four-cell stage', count:2, box:[25,28,227,216]},
  {name:'Four-cell stage', next:'Eight-cell stage', count:4, box:[317,28,223,216]},
  {name:'Eight-cell stage', next:'Further cleavage toward a morula', count:8, box:[608,28,223,216]},
];
export const cleavageFields = {
  title:'Place an early cleavage image',section:'28.2',
  intro:'Each drawing shows a stage after fertilization. Follow the boundaries between blastomeres. Some blastomeres overlap in the two-dimensional view.',
  controls:[select('field','Unlabeled drawing',['Drawing A','Drawing B','Drawing C'])],
  run({field:index}){
    const i=Number(index),s=cleavage[i];
    const description=['Two large profiles divide the conceptus into halves.','Several smaller cells overlap, with four blastomeres in the complete specimen.','Several blastomeres overlap in front and behind, with eight in the complete specimen.'][i];
    return {media:field('28.4','28.2',[856,751],s.box,description,false),
      observation:table('Specimen setting',['Known condition'],[['Early cleavage with little change in overall conceptus diameter.']]),
      question:'Which developmental change should follow this drawing?',choices:[s.next,...cleavage.map(c=>c.next).filter(c=>c!==s.next)],
      why:s.name+'. Cleavage increases cell number and reduces the average size of each blastomere.',
      frames:[['Current specimen',description],['Next landmark',s.next+'.'],['Later stage','A fluid-filled blastocyst cavity appears after the compact morula stage.']]};
  },
};
