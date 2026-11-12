import assets from './muscle-textbook-assets.json' with {type:'json'};
import {axialMuscleFigureTargets} from './axial-muscle-targets.js';

const target = (figure, name, orientation, panel, point, cover, description, aliases = [], extra = {}) =>
 ({figure, name, orientation, panel, point, cover, description, aliases, ...extra});

// Coordinates refer to the embedded artwork's native pixels. The white rectangles
// cover only the selected label, leaving the muscle and the leader line intact.
export const muscleFigureTargets = {
 ...axialMuscleFigureTargets,
 'subclavius': target('11.22', 'Subclavius', 'Left scapular region, anterior lateral dissection', [0,0,1180,920], [437,186], [160,98,200,48], 'The marker is on the short muscle immediately beneath the clavicle.'),
 'pectoralis-minor': target('11.22', 'Pectoralis minor', 'Left scapular region, anterior lateral dissection', [0,0,1180,920], [530,310], [890,337,280,48], 'The marker is on the exposed fan from upper ribs toward the coracoid process; the larger superficial pectoral muscle has been cut.'),
 'serratus-anterior': target('11.22', 'Serratus anterior', 'Left thorax, anterior lateral dissection', [0,0,1180,920], [595,505], [890,430,210,92], 'The marker is on one of the slips along the lateral ribs, passing toward the medial scapular border.'),
 'trapezius': target('11.22', 'Trapezius', 'Back, posterior with opposite superficial muscle removed', [975,0,1217,920], [1608,510], [982,824,180,55], 'The marker is on the broad superficial sheet from the midline toward the shoulder, on the intact side.'),
 'rhomboid-minor': target('11.22', 'Rhomboid minor', 'Deep scapular muscles, posterior', [975,0,1217,920], [1807,505], [1990,230,202,90], 'The marker is on the narrow upper band between the vertebral column and medial scapula, above the larger rhomboid.'),
 'rhomboid-major': target('11.22', 'Rhomboid major', 'Deep scapular muscles, posterior', [975,0,1217,920], [1824,664], [1990,357,202,90], 'The marker is on the broad lower band between the thoracic spine and medial scapular border.'),
 'pectoralis-major': target('11.23', 'Pectoralis major', 'Left shoulder, superficial anterior lateral', [0,80,930,860], [510,210], [10,133,190,89], 'The marker is on the broad superficial anterior chest muscle approaching the proximal humerus.'),
 'deltoid': target('11.23', 'Deltoid', 'Left shoulder, superficial posterior', [943,0,1286,950], [1290,290], [950,265,135,50], 'The marker is on the muscular shoulder cap, lateral to the exposed scapular region.'),
 'latissimus-dorsi': target('11.23', 'Latissimus dorsi', 'Left shoulder and back, superficial posterior', [943,0,1286,950], [1480,583], [950,497,286,48], 'The marker is on the broad lower-back muscle ascending toward the proximal humerus.'),
 'biceps-brachii': target('11.25', 'Biceps brachii', 'Left upper arm, anterior lateral', [114,0,985,938], [644,495], [805,185,265,205], 'The marker is on a belly of the two-headed anterior upper-arm muscle. Identify the whole muscle, not one head.'),
 'triceps-brachii': target('11.25', 'Triceps brachii', 'Left upper arm, posterior', [1450,0,931,938], [1900,480], [1510,230,255,85], 'The marker is on the large posterior upper-arm muscle. Identify the whole muscle, not one head.', [], {extraCovers:[[2090,559,275,95]]}),
 'flexor-carpi-radialis': target('11.25', 'Flexor carpi radialis', 'Left forearm, superficial palmar', [105,963,1148,942], [523,1368], [126,1342,220,90], 'The marker is on the superficial forearm muscle whose tendon approaches the radial side of the anterior wrist.'),
 'vastus-medialis': target('11.29', 'Vastus medialis', 'Right thigh, superficial anterior', [0,0,925,950], [388,694], [525,670,285,48], 'The marker is on the medial quadriceps belly above the knee.'),
 'psoas-major': target('11.29', 'Psoas major', 'Right hip, anterior with abdominal wall removed', [0,0,925,950], [342,293], [525,29,247,54], 'The marker is on the hip-flexor muscle descending beside the lumbar spine toward the proximal femur.'),
 'infraspinatus': target('11.23', 'Infraspinatus', 'Deep left shoulder, posterior', [1150,1150,1079,1020], [1820,1417], [1930,1442,290,61], 'The marker is on the broad muscle below the spine of the scapula.'),
 'supraspinatus': target('11.23', 'Supraspinatus', 'Deep left shoulder, posterior', [1150,1150,1079,1020], [1705,1254], [1928,1175,299,56], 'The marker is on the narrow muscle above the spine of the scapula.'),
 'teres-minor': target('11.23', 'Teres minor', 'Deep left shoulder, posterior', [1150,1150,1079,1020], [1671,1431], [1356,1175,227,54], 'The marker is on the narrow band along the lateral scapula between the broad infraspinous muscle and the thicker inferior band.'),
 'subscapularis': target('11.23', 'Subscapularis', 'Deep left shoulder, anterior lateral', [0,1160,1205,1030], [604,1378], [951,1559,241,58], 'The marker is on a muscle covering the anterior surface of the scapula.'),
 'brachialis': target('11.25', 'Brachialis', 'Left upper arm, anterior lateral', [114,0,985,938], [650,722], [263,758,190,59], 'The marker is on the anterior upper arm, deep to the large two-headed muscle, close to the elbow.'),
 'pronator-teres': target('11.25', 'Pronator teres', 'Left forearm, superficial palmar', [105,963,1148,942], [524,1285], [753,1257,253,58], 'The marker is on the oblique muscle just below the medial side of the elbow.'),
 'flexor-digitorum-profundus': target('11.25', 'Flexor digitorum profundus', 'Left forearm, deep palmar', [110,1934,1020,960], [437,2269], [120,2378,268,84], 'The marker is on the deep finger flexor on the ulnar side of the forearm.', ['FDP']),
 'palmar-interossei': target('11.28', 'Palmar interossei', 'Left hand, palmar view', [103,1180,855,853], [526,1415], [126,1740,341,89], 'The marker is on one of the three small palmar muscles along the metacarpals.', ['Palmar interosseous muscles']),
 'dorsal-interossei': target('11.28', 'Dorsal interossei', 'Left hand, dorsal view', [1160,1180,810,853], [1581,1392], [1177,1741,318,91], 'The marker is on one of four muscles between the metacarpals on the dorsal side.', ['Dorsal interosseous muscles']),
 'rectus-femoris': target('11.29', 'Rectus femoris', 'Right thigh, superficial anterior', [0,0,925,1055], [315,588], [12,554,139,87], 'The marker is on the centrally placed superficial muscle of the anterior thigh.'),
 'vastus-lateralis': target('11.29', 'Vastus lateralis', 'Right thigh, superficial anterior', [0,0,925,1055], [295,705], [12,675,144,88], 'The marker is on the lateral portion of the quadriceps beside the centrally placed superficial muscle.'),
 'sartorius': target('11.29', 'Sartorius', 'Right thigh, superficial anterior', [0,0,925,1055], [374,542], [527,603,169,53], 'The marker is on the strap-like muscle crossing the thigh obliquely.'),
 'biceps-femoris': target('11.29', 'Biceps femoris', 'Right thigh, posterior', [806,1118,907,1057], [1305,1667], [1484,1847,178,95], 'The marker is on the lateral hamstring in the posterior thigh.'),
 'tibialis-anterior': target('11.32', 'Tibialis anterior', 'Right leg, superficial anterior', [0,0,720,1358], [544,337], [16,266,270,55], 'The marker is on the anterior muscle beside the shin, with a tendon crossing the front of the ankle.'),
 'soleus': target('11.32', 'Soleus', 'Right leg, posterior with gastrocnemius cut', [843,0,695,1358], [1400,674], [858,649,142,52], 'The marker is on the broad calf muscle exposed beneath the cut gastrocnemius.'),
 'calcaneal-tendon': target('11.32', 'Calcaneal tendon', 'Right leg, posterior', [843,0,695,1358], [1352,930], [858,911,346,89], 'The marker is on the thick tendon between the calf and the heel.', ['Achilles tendon','Tendocalcaneus']),
 'flexor-digitorum-brevis': target('11.34', 'Flexor digitorum brevis', 'Left foot, first plantar layer', [0,756,697,836], [368,1064], [15,1127,223,132], 'The marker is on the central muscle of the first plantar layer.'),
 'quadratus-plantae': target('11.34', 'Quadratus plantae', 'Left foot, second plantar layer', [704,756,622,836], [927,978], [1108,930,199,85], 'The marker is on the muscle attaching to the long flexor tendon in the second plantar layer.'),
};

const escape = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
export function musclePlateSVG(number, {panel, targetId, hideLabel = false, alt} = {}) {
 const asset = assets[number];
 if (!asset) return '';
 const selected = muscleFigureTargets[targetId];
 const item = selected?.figure === number ? selected : null;
 const bounds = panel || item?.panel || [0,0,asset.width,asset.height];
 const scale = Math.min(bounds[2],bounds[3]);
 const mark = item ? `<circle cx="${item.point[0]}" cy="${item.point[1]}" r="${Math.max(11,scale*.018)}" fill="none" stroke="#fff" stroke-width="8"/><circle cx="${item.point[0]}" cy="${item.point[1]}" r="${Math.max(11,scale*.018)}" fill="#c5252e55" stroke="#6b0f19" stroke-width="4"/>` : '';
 const masks = item && hideLabel ? [item.cover,...(item.extraCovers||[])].map(([x,y,width,height])=>
  `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="#fff"/>`).join('') : '';
 const description = alt || (item ? item.orientation+(hideLabel?'. One anatomical target is marked.':'. '+item.description) : 'OpenStax Figure '+number);
 const [x,y,width,height]=bounds;
 const artwork=`<image href="assets/muscle-textbook/${asset.file}" width="${asset.width}" height="${asset.height}"/>${masks}${mark}`;
 // Clip the source to the panel even when the outer viewer letterboxes it.
 return `<svg viewBox="${bounds.join(' ')}" role="img" aria-label="${escape(description)}"><svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="${bounds.join(' ')}" overflow="hidden">${artwork}</svg></svg>`;
}

export function muscleTextbookExamFigure(targetId) {
 const item = muscleFigureTargets[targetId];
 if (!item) return null;
 return musclePlateSVG(item.figure, {targetId, hideLabel:true});
}
