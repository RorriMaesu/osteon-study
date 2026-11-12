import assets from './muscle-textbook-assets.json' with {type:'json'};

const target = (figure, name, orientation, panel, point, cover, description, aliases = []) =>
 ({figure, name, orientation, panel, point, cover, description, aliases});

// Coordinates refer to the embedded artwork's native pixels. The white rectangles
// cover only the selected label, leaving the muscle and the leader line intact.
export const muscleFigureTargets = {
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
 const mask = item && hideLabel ? `<rect x="${item.cover[0]}" y="${item.cover[1]}" width="${item.cover[2]}" height="${item.cover[3]}" fill="#fff"/>` : '';
 const description = alt || (item ? item.orientation + '. ' + item.description : 'OpenStax Figure ' + number);
 return `<svg viewBox="${bounds.join(' ')}" role="img" aria-label="${escape(description)}"><image href="assets/muscle-textbook/${asset.file}" width="${asset.width}" height="${asset.height}"/>${mask}${mark}</svg>`;
}

export function muscleTextbookExamFigure(targetId) {
 const item = muscleFigureTargets[targetId];
 if (!item) return null;
 return musclePlateSVG(item.figure, {targetId, hideLabel:true});
}
