// The numbered leaders use coordinates in the source OpenStax figures.
// White masks cover printed callouts that would reveal the answer.
export const mockExam4FormCPlates = {
  'c-nmj': {
    figure: '10.6',
    label: 'Magnified junction between a motor neuron and a skeletal muscle fiber, with four numbered markers.',
    bounds: [454, 915, 715, 546],
    maskPolygons: [
      '454,915 733,915 670,963 610,1032 454,1032',
      '939,915 1169,915 1169,1031 1062,1031 1002,989 938,940',
    ],
    markerOffsets: {1: [-61, -63], 2: [71, -46], 3: [72, 56], 4: [58, -25]},
    markers: [
      {number: 1, point: [850, 1038], term: 'Axon terminal'},
      {number: 2, point: [1029, 1124], term: 'Synaptic vesicles'},
      {number: 3, point: [922, 1364], term: 'Motor end plate'},
      {number: 4, point: [1065, 1227], term: 'Synaptic cleft'},
    ],
  },
  'c-twitch': {
    figure: '10.15',
    label: 'Graph of tension over time following one stimulus. Three numbered markers indicate intervals.',
    bounds: [0, 44, 789, 460],
    markerOffsets: {1: [60, -57], 2: [50, -56], 3: [44, 47]},
    markers: [
      {number: 1, point: [49, 324], term: 'Latent period'},
      {number: 2, point: [531, 269], term: 'Relaxation phase'},
      {number: 3, point: [174, 180], term: 'Contraction phase'},
    ],
  },
  'c-abdomen': {
    figure: '11.16',
    label: 'Anterolateral view of the abdominal wall with a cutaway inset and three numbered markers.',
    panels: [{bounds: [260, 13, 786, 524], label: 'Anterolateral view'}],
    masks: [
      [895, 51, 151, 36], // External oblique, inset
      [823, 107, 132, 54], // Transversus abdominis
      [639, 457, 157, 38], // Rectus abdominis
      [720, 443, 326, 94], // Lower callouts beneath the inset
    ],
    markerOffsets: {1: [-85, -58], 2: [70, -36], 3: [-47, 71]},
    markers: [
      {number: 1, point: [502, 243], term: 'External oblique'},
      {number: 2, point: [886, 268], term: 'Transversus abdominis'},
      {number: 3, point: [963, 348], term: 'Internal oblique'},
    ],
  },
  'c-forearm': {
    figure: '11.25',
    label: 'Superficial palmar view of the left forearm with four numbered markers.',
    panels: [{bounds: [105, 983, 1148, 849], label: 'Left forearm · palmar view'}],
    masks: [
      [625, 1011, 260, 63],
      [1088, 1032, 165, 55],
      [742, 1257, 318, 62],
      [106, 1344, 245, 95],
      [106, 1453, 300, 61],
      [106, 1526, 349, 59],
      [106, 1654, 503, 59],
    ],
    maskPolygons: [
      '420,983 520,1060 615,1130 692,1230 757,1348 842,1470 996,1630 1100,1740 1236,1802 1253,1802 1253,983',
      '105,1250 265,1250 400,1350 485,1450 555,1550 655,1665 788,1770 865,1832 105,1832',
    ],
    markerOffsets: {1: [45, -96], 2: [-79, -18], 3: [54, 78], 4: [-75, 60]},
    markers: [
      {number: 1, point: [531, 1286], term: 'Pronator teres'},
      {number: 2, point: [520, 1369], term: 'Flexor carpi radialis'},
      {number: 3, point: [708, 1531], term: 'Flexor digitorum superficialis'},
      {number: 4, point: [548, 1484], term: 'Flexor carpi ulnaris'},
    ],
  },
  'c-thigh': {
    figure: '11.29',
    label: 'Posterior view of the right thigh with three numbered markers.',
    panels: [{bounds: [1060, 1440, 430, 600], label: 'Right · posterior'}],
    maskPolygons: [
      '1060,1440 1081,1440 1134,1530 1150,1630 1164,1705 1185,1790 1198,1880 1171,2040 1060,2040',
      '1444,1440 1444,1670 1430,1810 1409,2040 1490,2040 1490,1440',
    ],
    markerOffsets: {1: [78, 28], 2: [-81, -53], 3: [60, -55]},
    markers: [
      {number: 1, point: [1256, 1692], term: 'Semitendinosus'},
      {number: 2, point: [1232, 1740], term: 'Semimembranosus'},
      {number: 3, point: [1320, 1690], term: 'Biceps femoris'},
    ],
  },
};
