// Original conceptual diagrams for OpenStax A&P 2e sections with little illustrated material.
const ink = '#183d41';
const muted = '#435c60';
const teal = '#126a65';
const plum = '#843f5c';
const amber = '#a44b25';

function label(x, y, text, { size = 15, color = ink, weight = 400, anchor = 'start' } = {}) {
  return `<text x="${x}" y="${y}" font-family="system-ui, sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}">${text}</text>`;
}

function box(x, y, w, h, fill, radius = 10) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${fill}"/>`;
}

function arrow(x1, y1, x2, y2, color = muted) {
  const angle = Math.atan2(y2-y1,x2-x1);
  const dx = Math.cos(angle), dy = Math.sin(angle);
  const wing = sign => [x2 - 7*dx + sign*3.5*dy, y2 - 7*dy - sign*3.5*dx].join(',');
  return `<path d="M${x1} ${y1} L${x2} ${y2} M${wing(1)} L${x2} ${y2} L${wing(-1)}" fill="none" stroke="${color}" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function plate(title, alt, height, body) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 ${height}" width="100%" role="img" aria-label="${title}" style="display:block;max-width:100%;height:auto">
    <title>${title}</title><desc>${alt}</desc>${box(0,0,500,height,'#f6f4e9',12)}${body}</svg>`;
  return { title, alt, svg };
}

const pineal = plate('How a light signal reaches the pineal gland',
  'Light reaches the retina and entrains the hypothalamic suprachiasmatic nucleus. Its sympathetic relay controls pineal melatonin. On an entrained schedule melatonin stays low in daylight, rises during biological night and falls by morning.', 345,
  `${label(24,33,'Light and the circadian clock',{size:22,weight:650})}
    ${box(24,54,106,62,'#f0dcc1')}${label(77,82,'Retina',{weight:650,anchor:'middle'})}${label(77,103,'senses light',{size:13,anchor:'middle'})}
    ${arrow(134,85,158,85)}${box(163,54,142,62,'#d6e7dd')}${label(234,81,'Hypothalamus',{weight:650,anchor:'middle'})}${label(234,103,'SCN clock',{size:13,anchor:'middle'})}
    ${arrow(309,85,343,85)}${box(348,54,128,62,'#e9d7dd')}${label(412,81,'Pineal gland',{weight:650,anchor:'middle'})}${label(412,103,'melatonin',{size:13,anchor:'middle'})}
    ${label(26,141,'The SCN signals the pineal gland through a sympathetic relay.',{size:13,color:muted})}
    ${label(24,176,'Relative melatonin level',{weight:650})}
    ${box(44,191,209,98,'#f4dfba',0)}${box(253,191,193,98,'#d4dce7',0)}
    <path d="M44 281 C92 284 173 285 213 282 S251 274 270 256 S297 211 329 204 S366 206 382 221 S412 267 446 280" fill="none" stroke="${plum}" stroke-linecap="round" stroke-width="4"/>
    <path d="M44 193 V289 H446" fill="none" stroke="${muted}" stroke-width="1.3"/>
    ${label(48,211,'Daylight',{size:13,color:muted})}${label(262,211,'Dark',{size:13,color:muted})}
    ${label(44,312,'Morning',{size:14})}${label(253,312,'Evening',{size:14,anchor:'middle'})}${label(446,312,'Morning',{size:14,anchor:'end'})}
    ${label(24,335,'Schematic daily rhythm on a regular light–dark schedule.',{size:13,color:muted})}`);

const pregnancy = plate('The ovarian–placental handoff',
  'After implantation, hCG from developing placental tissue sustains the ovarian corpus luteum. The corpus luteum supplies early progesterone. Placental progesterone production takes over as pregnancy progresses, supporting the uterine lining.', 388,
  `${label(24,35,'Who supplies progesterone?',{size:22,weight:650})}
    ${label(24,65,'Early pregnancy',{weight:650,color:plum})}
    ${box(24,80,156,59,'#e9d7dd')}${label(102,106,'Trophoblast',{weight:650,anchor:'middle'})}${label(102,126,'placental precursor',{size:13,anchor:'middle'})}
    ${arrow(187,112,304,112,plum)}${label(245,103,'hCG',{weight:650,anchor:'middle',color:plum})}
    ${box(311,80,165,59,'#f0dcc1')}${label(393,106,'Corpus luteum',{weight:650,anchor:'middle'})}${label(393,126,'in the ovary',{size:13,anchor:'middle'})}
    ${label(24,171,'Source of progesterone through pregnancy',{size:16,weight:650})}
    ${label(24,195,'Darker shading marks the larger contribution.',{size:13,color:muted})}
    ${label(25,230,'Ovary',{weight:650})}${label(25,268,'Placenta',{weight:650})}
    <defs><linearGradient id="ap2-ovarian-prog"><stop offset="0" stop-color="${amber}"/><stop offset=".17" stop-color="${amber}"/><stop offset=".37" stop-color="#ece9de"/></linearGradient>
    <linearGradient id="ap2-placental-prog"><stop offset="0" stop-color="#ece9de"/><stop offset=".13" stop-color="#e1e8dc"/><stop offset=".37" stop-color="${teal}"/></linearGradient></defs>
    ${box(116,213,354,21,'url(#ap2-ovarian-prog)',5)}${box(116,251,354,21,'url(#ap2-placental-prog)',5)}
    <path d="M116 284 H470 M116 280 V289 M234 280 V289 M352 280 V289 M470 280 V289" fill="none" stroke="${muted}" stroke-width="1.5"/>
    ${label(173,307,'1st trimester',{size:13,anchor:'middle'})}${label(293,307,'2nd trimester',{size:13,anchor:'middle'})}${label(410,307,'3rd trimester',{size:13,anchor:'middle'})}
    ${box(24,326,452,45,'#dce8df',7)}${label(38,354,'Progesterone supports the uterine lining as the source shifts.',{size:14,weight:500})}`);

const organGlyphs = {
  heart: `<path d="M23 43 C17 38 7 29 7 20 C6 10 19 7 23 15 C28 6 40 10 40 20 C40 29 30 39 23 43Z" fill="#be6c76" stroke="#783a50" stroke-width="2"/><path d="M24 18 Q23 25 26 30 T27 39" fill="none" stroke="#783a50" stroke-width="1.5"/>`,
  kidney: `<path d="M29 7 C17 4 8 14 8 27 C7 39 14 46 23 42 C29 39 24 32 26 28 C31 25 35 28 37 22 C40 14 37 9 29 7Z" fill="#c57867" stroke="#803f38" stroke-width="2"/><path d="M28 25 C35 26 34 37 35 43" fill="none" stroke="#916a40" stroke-width="3"/>`,
  intestine: `<path d="M13 11 H31 C39 11 40 17 37 22 Q35 26 23 26 H16 C10 26 10 33 16 34 H33 C40 34 40 42 32 42 H16" fill="none" stroke="#93634d" stroke-width="9" stroke-linecap="round"/><path d="M13 11 H31 C39 11 40 17 37 22 Q35 26 23 26 H16 C10 26 10 33 16 34 H33 C40 34 40 42 32 42 H16" fill="none" stroke="#edc0a3" stroke-width="5" stroke-linecap="round"/>`,
  adipose: `<g fill="#ead097" stroke="#946d3f" stroke-width="1.7"><ellipse cx="16" cy="19" rx="11" ry="10"/><ellipse cx="32" cy="19" rx="9" ry="11"/><ellipse cx="17" cy="35" rx="10" ry="9"/><ellipse cx="34" cy="35" rx="10" ry="9"/></g><g fill="#8d634e"><circle cx="10" cy="21" r="2"/><circle cx="37" cy="19" r="2"/><circle cx="11" cy="36" r="2"/><circle cx="39" cy="35" r="2"/></g>`
};

const secondaryRows = [
  ['heart','Heart atria','Wall stretch','ANP','Kidneys excrete more sodium.'],
  ['kidney','Kidneys','Reduced oxygen','EPO','Red marrow makes more red cells.'],
  ['intestine','Duodenum','Acidic chyme','Secretin','Pancreas releases bicarbonate.'],
  ['adipose','Adipose tissue','Energy stores','Leptin','Hypothalamus helps regulate appetite.']
];

const secondary = plate('Signals from organs with other primary functions',
  'Atrial stretch elicits ANP and promotes sodium excretion. Low kidney oxygen elicits EPO and raises red cell production. Acidic chyme elicits intestinal secretin and pancreatic bicarbonate release. Adipocyte leptin signals energy stores to the hypothalamus.', 375,
  `${label(24,34,'An organ can also be a hormone source',{size:21,weight:650})}
    ${label(24,64,'Source and stimulus',{size:14,weight:650,color:muted})}${label(238,64,'Signal and response',{size:14,weight:650,color:muted})}
    ${secondaryRows.map(([icon,organ,stimulus,hormone,effect],i) => {
      const y = 75 + i * 72;
      return `${box(18,y,464,64,i % 2 ? '#ecece1' : '#e1ebe3',8)}
        <g transform="translate(23,${y+7})">${organGlyphs[icon]}</g>
        ${label(75,y+26,organ,{weight:650})}${label(75,y+47,stimulus,{size:13,color:muted})}
        ${arrow(195,y+31,223,y+31,teal)}${label(236,y+26,hormone,{weight:650,color:teal})}
        ${label(236,y+47,effect,{size:12.8})}`;
    }).join('')}`);

const origins = plate('Endocrine tissues from different embryonic origins',
  'The anterior pituitary develops from oral ectoderm, the posterior pituitary from neural ectoderm. Adrenal cortex develops from mesoderm and adrenal medulla from neural crest. Pancreatic endocrine cells develop from endoderm. After menopause, reduced ovarian feedback on the pituitary generally allows FSH to rise.', 410,
  `${label(24,35,'One gland can have two origins',{size:22,weight:650})}
    ${label(24,65,'Embryonic source',{size:14,weight:650,color:muted})}${label(264,65,'Adult endocrine tissue',{size:14,weight:650,color:muted})}
    ${[
      ['Oral ectoderm','Anterior pituitary','#dce8df'],
      ['Neural ectoderm','Posterior pituitary','#dce8df'],
      ['Mesoderm','Adrenal cortex','#f1dfc9'],
      ['Neural crest (ectoderm)','Adrenal medulla','#f1dfc9'],
      ['Endoderm','Pancreatic islets','#e6dce5']
    ].map(([from,to,fill],i) => {
      const y=79+i*39;
      return `${box(20,y,207,32,fill,5)}${label(32,y+22,from,{size:15})}${arrow(232,y+16,252,y+16)}${box(259,y,220,32,fill,5)}${label(272,y+22,to,{weight:600,size:15})}`;
    }).join('')}
    <line x1="24" x2="476" y1="291" y2="291" stroke="#b8c7be"/>
    ${label(24,320,'Aging changes feedback, too',{size:18,weight:650})}
    ${label(24,347,'After menopause, ovarian estradiol and inhibin are lower.',{size:14})}
    ${arrow(36,357,36,380,plum)}${label(50,378,'Less negative feedback on the pituitary',{size:14,color:plum,weight:600})}
    ${label(50,399,'Circulating FSH generally rises.',{size:14})}`);

export const plates = { '17.7': pineal, '17.8': pregnancy, '17.10': secondary, '17.11': origins };
