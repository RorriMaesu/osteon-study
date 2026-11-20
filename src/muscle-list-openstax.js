import assets from './muscle-textbook-assets.json' with {type:'json'};
import {muscleFigureTargets} from './muscle-figure-targets.js';

const openStax = 'https://openstax.org/books/anatomy-and-physiology-2e/pages/';
const section = {
  skin:'5-1-layers-of-the-skin',
  face:'11-3-axial-muscles-of-the-head-neck-and-back',
  trunk:'11-4-axial-muscles-of-the-abdominal-wall-and-thorax',
  arm:'11-5-muscles-of-the-pectoral-girdle-and-upper-limbs',
  leg:'11-6-appendicular-muscles-of-the-pelvic-girdle-and-lower-limbs',
  urinary:'25-2-gross-anatomy-of-urine-transport',
};
const figures = {
  '5.2':['skin','fig-ch05_01_01'],
  '11.7':['face','fig-ch11_03_01'],
  '11.10':['face','fig-ch11_03_04'],
  '11.11':['face','eip-id2442164'],
  '11.14':['face','fig-ch11_03_07'],
  '11.15':['face','fig-ch11_03_08'],
  '11.16':['trunk','fig-ch11_04_01'],
  '11.17':['trunk','fig-ch11_04_02'],
  '11.18':['trunk','fig-ch11_04_03'],
  '11.19':['trunk','fig-ch11_04_04'],
  '11.20':['trunk','fig-ch11_04_05'],
  '11.22':['arm','fig-ch11_05_01'],
  '11.23':['arm','fig-ch11_05_02'],
  '11.25':['arm','fig-ch11_05_04'],
  '11.28':['arm','fig-ch11_05_07'],
  '11.29':['leg','fig-ch11_06_01'],
  '11.32':['leg','fig-ch11_06_04'],
  '25.4':['urinary','fig-ch26_02_02'],
};
const extraAssets = {
  '5.2':{file:'figure-5-2.jpg',width:1250,height:979},
  '25.4':{file:'figure-25-4-a.jpg',width:926,height:1000},
};
const grayThigh = {
  label:'Gray’s Anatomy · Labeled thigh cross-section',
  url:'https://commons.wikimedia.org/wiki/File:Gray432.png',
  src:'assets/muscle-textbook/gray-432.png', width:683, height:700,
  note:'Find “Vastus intermedius M.” immediately deep to rectus femoris in this transverse section.',
};
const graySheath = {
  label:'Gray’s Anatomy · Labeled palmar tendon sheaths',
  url:'https://commons.wikimedia.org/wiki/File:Gray423.png',
  src:'assets/muscle-textbook/gray-423.png', width:516, height:700,
  note:'The blue sleeves around the flexor tendons are the synovial sheaths. The shared sleeve is labeled at the wrist.',
};
const figure = (number,label,details={}) => ({number,label,status:'labeled',...details});
const palmarForearm = [105,963,1148,942];
const dorsalForearm = [1254,963,1127,942];
const deepPalmarForearm = [110,1934,1120,1004];
const deepDorsalForearm = [1095,1934,1286,1004];
const anteriorThigh = [0,0,925,1055];
const posteriorThigh = [806,1118,907,1057];
const anteriorCalf = [0,0,720,1358];
const gastrocnemiusPlate = {file:'figure-11-32-posterior.jpg',width:695,height:800};
const deepPosteriorCalf = [1580,0,699,1358];

// The anatomy and labels below were checked on the illustrations, independent of
// the exam bank's selected recall targets. A group can span panels of a plate.
const rows = {
  'sternocleidomastoid':figure('11.14','Sternocleidomastoid'),
  'orbicularis-oculi':figure('11.7','Orbicularis oculi'),
  'orbicularis-oris':figure('11.7','Orbicularis oris'),
  'zygomaticus-major':figure('11.7','Zygomaticus major',{
    status:'annotated', panel:[0,510,980,815], annotation:{point:[759,894],label:'Zygomaticus major'},
    note:'Osteon marks the larger diagonal cheek muscle in the anterior view. OpenStax describes it in the Figure 11.8 action table.',
  }),
  'temporalis':figure('11.10','Temporalis'),
  'masseter':figure('11.10','Masseter'),
  'hyoglossus':figure('11.11','Hyoglossus'),
  'styloglossus':figure('11.11','Styloglossus'),
  'erector-spinae':figure('11.15','Iliocostalis, longissimus and spinalis',{
    status:'members', panel:[340,900,1240,1717],
    note:'Follow the labeled parts of the three columns in the posterior back view.',
  }),
  'levator-scapulae':figure('11.14','Levator scapulae',{panel:[0,0,950,850]}),
  'trapezius':figure('11.22','Trapezius'),
  'rhomboids':figure('11.22','Rhomboid major and rhomboid minor',{status:'members',panel:[975,0,1217,1004]}),
  'pectoralis-minor':figure('11.22','Pectoralis minor'),
  'external-intercostals':figure('11.18','External intercostal',{panel:[1400,190,875,1083]}),
  'internal-intercostals':figure('11.18','Internal intercostal',{panel:[1400,190,875,1083]}),
  'rectus-abdominis':figure('11.16','Rectus abdominis'),
  'external-oblique':figure('11.16','External oblique',{panel:[650,45,396,540]}),
  'internal-oblique':figure('11.16','Internal oblique'),
  'transversus-abdominis':figure('11.16','Transversus abdominis'),
  'diaphragm':figure('11.17','Diaphragm'),
  'ischiocavernosus':figure('11.20','Ischiocavernosus',{note:'The label points to the paired muscles in both inferior views.'}),
  'pelvic-diaphragm':figure('11.19','Pelvic diaphragm',{
    status:'members',note:'This superior view shows the pelvic diaphragm and labels two parts of levator ani, pubococcygeus and iliococcygeus.',
  }),
  'external-urethral-sphincter':figure('25.4','External urethral sphincter',{
    note:'Panel (a) labels the external sphincter below the internal sphincter.',
  }),
  'external-anal-sphincter':figure('11.20','External anal sphincter'),
  'latissimus-dorsi':figure('11.23','Latissimus dorsi'),
  'deltoid':figure('11.23','Deltoid'),
  'pectoralis-major':figure('11.23','Pectoralis major'),
  'rotator-cuff':figure('11.23','Supraspinatus, infraspinatus, teres minor and subscapularis',{
    status:'members',panel:[0,1135,2229,1060],
    note:'Subscapularis is labeled in the anterior dissection. The three other cuff muscles are labeled in the posterior dissection.',
  }),
  'supraspinatus':figure('11.23','Supraspinatus'),
  'infraspinatus':figure('11.23','Infraspinatus'),
  'subscapularis':figure('11.23','Subscapularis'),
  'teres-minor':figure('11.23','Teres minor'),
  'biceps-brachii':figure('11.25','Biceps brachii'),
  'supinator':figure('11.25','Supinator',{panel:[110,1934,2271,1004]}),
  'brachialis':figure('11.25','Brachialis'),
  'pronator-teres':figure('11.25','Pronator teres'),
  'triceps-brachii':figure('11.25','Triceps brachii',{
    note:'The upper posterior panel labels the lateral and long heads. The deeper medial head is obscured in this view.',
  }),
  'flexor-carpi-radialis':figure('11.25','Flexor carpi radialis'),
  'extensor-carpi-radialis':figure('11.25','Extensor carpi radialis longus and brevis',{status:'members',panel:dorsalForearm}),
  'flexor-digitorum-superficialis':figure('11.25','Flexor digitorum superficialis',{panel:palmarForearm}),
  'extensor-digitorum':figure('11.25','Extensor digitorum',{panel:dorsalForearm}),
  'extensor-pollicis-longus':figure('11.25','Extensor pollicis longus',{panel:deepDorsalForearm}),
  'opponens-pollicis':figure('11.28','Opponens pollicis',{panel:[0,0,2083,1165]}),
  'flexor-retinaculum-of-wrist':figure('11.25','Flexor retinaculum (cut)',{panel:deepPalmarForearm}),
  'extensor-retinaculum-of-wrist':figure('11.25','Extensor retinaculum',{panel:deepDorsalForearm}),
  'gluteus-maximus':figure('11.29','Gluteus maximus (cut)',{panel:posteriorThigh}),
  'gluteus-medius':figure('11.29','Gluteus medius (cut)',{panel:posteriorThigh}),
  'psoas-major':figure('11.29','Psoas major'),
  'adductor-longus':figure('11.29','Adductor longus',{panel:anteriorThigh}),
  'quadriceps-femoris':figure('11.29','Rectus femoris, vastus lateralis and vastus medialis',{
    status:'members',panel:anteriorThigh,supplement:grayThigh,
    note:'The superficial panel labels three of the four quadriceps muscles. The labeled cross-section places vastus intermedius deep to rectus femoris.',
  }),
  'rectus-femoris':figure('11.29','Rectus femoris'),
  'vastus-lateralis':figure('11.29','Vastus lateralis'),
  'vastus-medialis':figure('11.29','Vastus medialis'),
  'vastus-intermedius':figure('11.29','Anterior thigh reference',{
    status:'reference',panel:anteriorThigh,supplement:grayThigh,
    note:'Vastus intermedius lies deep to rectus femoris. OpenStax explains that relationship in section 11.6. The Gray plate labels it in a transverse slice.',
  }),
  'hamstrings':figure('11.29','Biceps femoris, semitendinosus and semimembranosus',{status:'members',panel:posteriorThigh}),
  'biceps-femoris':figure('11.29','Biceps femoris'),
  'semitendinosus':figure('11.29','Semitendinosus',{panel:posteriorThigh}),
  'semimembranosus':figure('11.29','Semimembranosus',{panel:posteriorThigh}),
  'gastrocnemius':figure('11.32','Gastrocnemius, lateral and medial heads',{
    image:gastrocnemiusPlate,
    note:'Posterior view cropped to show both labeled heads and the soleus below them.',
  }),
  'soleus':figure('11.32','Soleus'),
  'tibialis-anterior':figure('11.32','Tibialis anterior'),
  'calcaneal-tendon':figure('11.32','Calcaneal (Achilles) tendon'),
  'flexor-digitorum-longus':figure('11.32','Flexor digitorum longus',{
    panel:deepPosteriorCalf,
    note:'In this deep posterior view, find the label between tibialis posterior and flexor hallucis longus.',
  }),
  'extensor-digitorum-longus':figure('11.32','Extensor digitorum longus',{panel:anteriorCalf}),
  'aponeurosis':figure('11.7','Epicranial aponeurosis',{
    status:'example',note:'This broad sheet between the forehead and occipital muscle bellies is one example of an aponeurosis.',
  }),
  'fascia':figure('5.2','Hypodermis (superficial fascia)',{
    status:'example',note:'The diagram labels the hypodermis below the dermis. OpenStax calls this layer superficial fascia in section 5.1.',
  }),
  'tendon-sheaths':figure('11.28','Palmar hand reference',{
    status:'reference',panel:[0,0,1200,1165],supplement:graySheath,
    note:'The palmar panel shows where coverings guide the finger tendons. The Gray plate labels their synovial sheaths.',
  }),
};

export function muscleListOpenStaxFigure(cardId) {
  if (typeof cardId !== 'string' || !cardId.startsWith('ch11-')) return null;
  const slug = cardId.replace(/^ch11-/, '');
  if (!Object.hasOwn(rows, slug)) return null;
  const row = rows[slug];
  const {number,image,...details} = row;
  const asset = image || extraAssets[number] || assets[number];
  const [region,anchor] = figures[number];
  const reviewedTarget = muscleFigureTargets[slug];
  const targetId = reviewedTarget?.figure === number ? slug : undefined;
  const panel = row.panel || (targetId ? reviewedTarget.panel : undefined);
  const src = 'assets/muscle-textbook/'+asset.file;
  const displayImage = panel
    ? {src:'assets/muscle-textbook/panels/'+number.replace('.','-')+'-'+panel.join('-')+'.webp',width:panel[2],height:panel[3]}
    : {src,width:asset.width,height:asset.height};
  return {number,...details,targetId,panel,src,width:asset.width,height:asset.height,displayImage,
    sourceUrl:openStax+section[region]+'#'+anchor,
  };
}
