import {terms,allTerms} from './data.js';
import landmarks from './landmarks.json' with {type:'json'};

// Points are source-authored Z-Anatomy annotation anchors, not guessed surface boundaries.
export const meshExtensions={
 'Vertebral artery':'Vertebral artery',
 'Stylohyoid ligament':'Stylohyoid ligament',
 'Intervertebral discs':'Intervertebral disc .*',
 'Nucleus pulposus':'Nucleus pulposus .*',
 'Pubic symphysis':'Pubic symphysis',
 'Coracoclavicular ligament':'Conoid ligament||Trapezoid ligament',
 'Acromioclavicular ligament':'Acromioclavicular ligament',
 'Glenohumeral ligaments':'Superior glenohumeral ligament||Middle glenohumeral ligament||Inferior glenohumeral ligament',
 'Coracohumeral ligament':'Coracohumeral ligament',
 'Ligament of head of femur':'Ligament of head of femur',
 'Iliofemoral ligament':'Transverse part of iliofemoral ligament||Descending part of iliofemoral ligament',
 'Medial collateral ligament':'Superficial part of tibial collateral ligament||Deep part of tibial collateral ligament',
 'Lateral collateral ligament':'Fibular collateral ligament',
 'Anterior cruciate ligament':'Anterior cruciate ligament',
 'Posterior cruciate ligament':'Posterior cruciate ligament',
 'Pollex':'Proximal phalanx of first finger of hand||Distal phalanx of first finger of hand',
 'Hallux':'Proximal phalanx of first finger of foot||Distal phalanx of first finger of foot',
 'Pelvis':'Hip bone||Sacrum||Coccyx'
};
export const plates={
 'vertebra':{size:[1092,475],crop:[105,65,255,260],masks:[[279,65,100,64]],reference:'7.3',figure:'7.23',title:'Typical vertebra, superior view',points:[['Vertebral body',247,289],['Spinous process',234,88],['Transverse process',347,150],['Superior articular facets',183,198],['Lamina',256,168],['Pedicles',278,219],['Vertebral canal',212,211]]},
 'vertebra-lateral':{image:'vertebra',size:[1092,475],crop:[680,35,220,385],reference:'7.3',figure:'7.23',title:'Articulated vertebrae, lateral view',points:[['Intervertebral foramen',767,258],['Vertebral body',722,289],['Intervertebral discs',693,162],['Spinous process',874,371],['Superior articular facets',785,101]]},
 'thoracic':{size:[1686,1267],crop:[615,0,625,1260],masks:[[820,1060,260,190]],reference:'7.3',figure:'7.26',title:'Thoracic vertebrae',points:[['Superior articular facets',857,84],['Inferior articular facets',955,931],['Costal facets',1108,712],['Pedicles',1075,206],['Vertebral body',1150,508],['Spinous process',695,631],['Lamina',787,226],['Transverse process',729,169]]},
 'atlas':{image:'cervical',size:[1083,1240],crop:[120,670,310,180],masks:[[120,810,105,40],[342,818,88,33],[120,665,60,45],[395,655,80,30]],reference:'7.3',figure:'7.25',title:'Atlas, superior view',points:[['Superior articular facet of atlas',210,715],['Transverse foramen',175,742],['Dens',276,719],['Posterior arch of atlas',300,808]]},
 'axis':{image:'cervical',size:[1083,1240],crop:[745,590,235,255],masks:[[940,580,143,60],[735,590,60,45],[740,810,85,35]],reference:'7.3',figure:'7.25',title:'Axis, superior view',points:[['Dens',860,622],['Superior articular facets',807,655],['Transverse foramen',931,692],['Spinous process',858,828],['Lamina',824,752]]},
 'cervical-typical':{image:'cervical',size:[1083,1240],crop:[285,165,285,230],masks:[[490,190,80,28],[260,180,70,25]],reference:'7.3',figure:'7.25',title:'Typical cervical vertebra',points:[['Transverse foramen',355,320],['Vertebral body',427,340],['Spinous process',425,202],['Superior articular facets',329,280],['Lamina',395,238],['Pedicles',490,298]]},
 'sphenoid':{size:[634,820],crop:[90,115,435,240],masks:[[90,280,50,60]],reference:'7.2',figure:'7.10',title:'Sphenoid, superior view',points:[['Optic canal',289,213],['Sella turcica',309,266],['Greater wing of sphenoid',184,220],['Lesser wing of sphenoid',415,178]]},
 'temporal':{size:[774,555],crop:[125,95,555,420],masks:[[670,220,104,75],[605,475,169,70],[125,435,35,70],[125,95,85,100]],reference:'7.2',figure:'7.7',title:'Temporal bone, lateral view',points:[['Mastoid process',300,445],['Styloid process of temporal bone',483,489],['External acoustic meatus',373,384],['Mandibular fossa',465,348],['Zygomatic process',566,327]]},
 'maxilla':{size:[784,601],crop:[190,60,430,490],masks:[[280,70,100,50]],reference:'7.2',figure:'7.14',title:'Maxilla, lateral view',points:[['Alveolar arch',466,428],['Maxillae',500,339],['Floor of orbit',332,203]]},
 'skull-front':{size:[1500,1269],crop:[345,0,800,1190],reference:'7.2',figure:'7.4',title:'Anterior skull, adult mandibular fusion site',points:[['Mandibular symphysis',750,1123],['Maxillae',622,832],['Frontal bone',735,248],['Zygomatic bones',1084,687],['Mental foramen',580,1085]]},
 'skull-side':{size:[1500,1029],crop:[245,25,1015,955],masks:[[765,0,215,55],[930,45,127,45],[640,850,130,47]],reference:'7.2',figure:'7.5',title:'Lateral skull',points:[['Coronal suture',775,101],['Lambdoid suture',329,571],['Parietal bones',485,160],['Frontal bone',947,174],['Mandible',1020,886]]},
 'skull-base':{size:[1327,1800],crop:[350,0,590,890],masks:[[370,120,85,44]],reference:'7.2',figure:'7.8',title:'Inferior cranial base',points:[['Jugular foramen',536,507],['Carotid canal',795,472],['Hard palate',696,156],['Hard palate',700,275],['Foramen magnum',650,598],['Occipital condyles',580,531]]},
 'skull-back':{size:[810,631],crop:[200,0,410,590],reference:'7.2',figure:'7.9',title:'Posterior skull',points:[['Sagittal suture',407,32],['Lambdoid suture',505,170],['Parietal bones',309,118],['Occipital bone',385,204],['Mastoid process',242,390],['Occipital condyles',455,404]]},
 'ethmoid':{size:[825,637],crop:[210,60,395,530],reference:'7.2',figure:'7.12',title:'Ethmoid bone',points:[['Cribriform plate',436,224],['Perpendicular plate',405,482],['Superior and middle nasal conchae',434,330],['Superior and middle nasal conchae',465,434],['Ethmoidal air cells and sinus openings',324,291]]},
 'mandible':{size:[818,627],crop:[125,165,420,355],masks:[[210,220,110,80],[125,495,90,25]],reference:'7.2',figure:'7.15',title:'Mandible with medial ramus visible',points:[['Mandibular condyles',160,235],['Coronoid process of mandible',458,173],['Mandibular foramina',399,264],['Mandible',517,449]]},
 'sinuses':{size:[827,558],crop:[15,0,330,515],reference:'7.2',figure:'7.18',title:'Anterior paranasal sinuses',points:[['Maxillary sinus',206,318],['Ethmoidal air cells and sinus openings',187,279],['Frontal sinus',163,232]]},
 'fontanelles':{size:[1500,505],crop:[170,0,350,440],reference:'7.5',figure:'7.33',title:'Newborn skull, superior view',points:[['Fontanelles',347,94],['Fontanelles',344,377],['Frontal bone',248,68],['Parietal bones',431,293],['Occipital bone',359,409]]},
 'wrist':{size:[1277,893],crop:[350,575,570,318],reference:'8.2',figure:'8.9',title:'Carpal tunnel, wrist cross section',points:[['Carpal tunnel',643,682],['Median nerve',705,705],['Flexor retinaculum',655,654],['Hamate',458,712],['Trapezium',813,756],['Capitate',595,844]]},
 'sternum':{size:[1146,678],crop:[125,75,175,530],reference:'7.4',figure:'7.32',title:'Sternum, anterior view',points:[['Jugular notch',216,97],['Manubrium',209,166],['Body of sternum',208,361],['Xiphoid process',209,562]]},
 'curves':{size:[1092,1042],crop:[880,0,212,1042],reference:'7.3',figure:'7.20',title:'Vertebral curvatures, lateral view',points:[['Cervical curvature',963,142],['Thoracic curvature',933,270],['Lumbar curvature',960,416],['Sacrococcygeal curvature',944,516]]},
 'disc':{size:[1000,471],crop:[655,0,345,400],reference:'7.3',figure:'7.24',title:'Intervertebral disc, superior view',points:[['Annulus fibrosus',755,258],['Nucleus pulposus',824,295],['Vertebral canal',824,148],['Spinous process',825,60]]},
 'knee':{size:[1500,1150],crop:[225,600,280,500],reference:'9.6',figure:'9.19',title:'Anterior knee',points:[['Patellar ligament',375,969],['Patella',375,838],['Medial collateral ligament',453,892],['Lateral collateral ligament',251,913],['Tibiae',398,1028],['Fibulae',282,1045]]}
};
const preferred={
 'Superior articular facet of atlas':'atlas','Dens':'axis','Transverse foramen':'cervical-typical','Vertebral body':'vertebra','Spinous process':'vertebra','Transverse process':'vertebra','Superior articular facets':'thoracic','Inferior articular facets':'thoracic','Costal facets':'thoracic','Lamina':'vertebra','Pedicles':'vertebra','Vertebral canal':'vertebra','Intervertebral foramen':'vertebra-lateral','Mastoid process':'temporal','Styloid process of temporal bone':'temporal','Foramen magnum':'skull-base','Occipital condyles':'skull-base','Optic canal':'sphenoid','Sella turcica':'sphenoid','Alveolar arch':'maxilla','Mandibular symphysis':'skull-front',
 'Cervical curvature':'curves','Thoracic curvature':'curves','Lumbar curvature':'curves','Annulus fibrosus':'disc','Jugular notch':'sternum',
 'Coronal suture':'skull-side','Sagittal suture':'skull-back','Fontanelles':'fontanelles','Mandibular fossa':'temporal','External acoustic meatus':'temporal',
 'Carotid canal':'skull-base','Jugular foramen':'skull-base','Zygomatic process':'temporal','Lambdoid suture':'skull-back',
 'Cribriform plate':'ethmoid','Perpendicular plate':'ethmoid','Superior and middle nasal conchae':'ethmoid','Ethmoidal air cells and sinus openings':'ethmoid',
 'Hard palate':'skull-base','Maxillary sinus':'sinuses','Mandibular condyles':'mandible','Coronoid process of mandible':'mandible','Mandibular foramina':'mandible','Carpal tunnel':'wrist','Patellar ligament':'knee'
};
for(const t of allTerms){
 if(meshExtensions[t.name]){t.pattern=meshExtensions[t.name];t.exact=true;}
 t.representation=t.exact?{kind:'mesh',reference:t.region==='Joints'?'9.6':t.region==='Skull'?'7.2':t.region==='Spine'?'7.3':t.region==='Thorax'?'7.4':t.region==='Upper limb'?'8.2':t.region==='Lower limb'?'8.4':'8.3'}:landmarks[t.name]||{kind:preferred[t.name]?'diagram':'concept',plate:preferred[t.name],reference:preferred[t.name]?plates[preferred[t.name]].reference:'9.6'};
 if(['Hyoid bone','Stylohyoid ligament'].includes(t.name))t.representation.reference='7.2';
 if(t.name==='Mandibular symphysis')t.representation.note='The target marks the anterior midline fusion site. The adult mandible has no persistent open symphyseal joint.';
 if(t.name==='Sella turcica')t.representation.note='The target marks the hypophyseal fossa within the sella turcica.';
 if(t.name==='Vertebral canal')t.representation.note='The diagram target marks one vertebral foramen along the continuous vertebral canal; it does not outline the entire canal.';
 if(t.name==='Pelvic brim')t.representation.note='The pin marks the arcuate line, one segment of the pelvic brim. Trace the complete inlet boundary in the textbook.';
 if(t.name==='Ethmoidal air cells and sinus openings')t.representation.note='Targets mark ethmoidal air cells. Their drainage openings lead into the nasal cavity: middle cells into the middle meatus and posterior cells into the superior meatus; anterior cells drain via the infundibulum to the middle meatus.';
}
export const labels={mesh:'3D structure', 'source-pin':'3D landmark pin',diagram:'Textbook diagram target',concept:'Movement concept'};
export const coverage=()=>Object.fromEntries(Object.keys(labels).map(k=>[k,terms.filter(t=>t.representation.kind===k).length]));
