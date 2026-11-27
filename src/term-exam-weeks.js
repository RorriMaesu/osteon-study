// Dates are the Mondays of UCC's 2027 terms. Readings and mock checkpoints are
// Osteon's proposed pacing. Each numbered section first appears in just one week.
const range = (chapter, first, last) =>
  Array.from({ length: last - first + 1 }, (_, index) => chapter + '.' + (first + index));

export const termExamWeeks = {
  ap2: [
    {
      week: 1, weekOf: '2027-01-04', title: 'Neurons, glia and electrical signals',
      sections: range(12, 1, 5),
      focus: 'Label a neuron, read an action-potential trace and predict how blocked transmitter release affects its target.',
      checkpoint: 'Sketch the sequence from threshold to a postsynaptic response from memory.'
    },
    {
      week: 2, weekOf: '2027-01-11', title: 'Central and peripheral nervous anatomy',
      sections: range(13, 1, 4),
      focus: 'Identify brain and cord landmarks. Trace cerebrospinal fluid from a lateral ventricle to venous blood.',
      checkpoint: 'On a cord cross-section, distinguish a sensory root, its ganglion and a motor root.'
    },
    {
      week: 3, weekOf: '2027-01-18', title: 'Special senses and somatic pathways',
      sections: range(14, 1, 3),
      focus: 'Trace light to the retina and sound to the cochlea. Compare the sensory inputs for equilibrium, smell and taste.',
      checkpoint: 'Trace a somatic sensation and a motor command before the Chapters 12–14 mock.', scope: 'unit-1'
    },
    {
      week: 4, weekOf: '2027-01-25', title: 'Autonomic circuits and the neurological exam',
      sections: [...range(15, 1, 4), '16.1'],
      focus: 'Trace the two-neuron autonomic pathways to the heart. Predict how a receptor blocker changes an effector response.',
      checkpoint: 'Draw the sensory input, control center and output of one visceral reflex.'
    },
    {
      week: 5, weekOf: '2027-02-01', title: 'Examination findings and hormone signaling',
      sections: [...range(16, 2, 5), ...range(17, 1, 2)],
      focus: 'Use a pupil response, sensation, strength and coordination to localize a pathway. Then compare membrane and intracellular hormone receptors.',
      checkpoint: 'Take the Chapters 15–16 mock after the neurological cases. Hormone signaling starts the next unit.', scope: 'unit-2'
    },
    {
      week: 6, weekOf: '2027-02-08', title: 'Endocrine glands and feedback',
      sections: range(17, 3, 8),
      focus: 'Locate each gland and pair a hormone with its target. Predict the pituitary response to a fall in circulating thyroid hormone.',
      checkpoint: 'Draw a feedback loop with the stimulus, hormone, target and direction of change.'
    },
    {
      week: 7, weekOf: '2027-02-15', title: 'Endocrine integration and blood formation',
      sections: [...range(17, 9, 11), ...range(18, 1, 2)],
      focus: 'Explain insulin and glucagon responses to a meal and a fast. Then distinguish plasma from formed elements and trace blood cell production.',
      checkpoint: 'Take the Chapter 17 mock after endocrine development and secondary endocrine organs.', scope: 'unit-3'
    },
    {
      week: 8, weekOf: '2027-02-22', title: 'Blood cells, hemostasis and the heart',
      sections: [...range(18, 3, 6), '19.1'],
      focus: 'Identify cells on a smear, interpret a blood-typing reaction and follow blood through all four heart valves.',
      checkpoint: 'Explain why a platelet plug and the fibrin that reinforces it form in different steps.'
    },
    {
      week: 9, weekOf: '2027-03-01', title: 'Cardiac electrical activity, pumping and vessels',
      sections: [...range(19, 2, 5), '20.1'],
      focus: 'Align an ECG with valve events and heart sounds. Calculate cardiac output from pulse and stroke volume and identify vessel-wall layers.',
      checkpoint: 'Use the pressure difference across a valve to justify when it opens.'
    },
    {
      week: 10, weekOf: '2027-03-08', title: 'Pressure, exchange and circulation routes',
      sections: range(20, 2, 6),
      focus: 'Predict changes in resistance and capillary exchange. Trace a systemic route and explain how fetal blood bypasses the lungs.',
      checkpoint: 'Take the Chapters 18–20 mock after the fetal circulation and blood-pressure cases.', scope: 'unit-4'
    },
    {
      week: 11, weekOf: '2027-03-15', title: 'Cumulative winter review',
      sections: [],
      focus: 'Trace the baroreflex from receptor to heart and vessels. Revisit an unfamiliar sensory pathway and a missed endocrine feedback problem.',
      checkpoint: 'Take the Chapters 12–20 cumulative mock, then repeat the practical or written task that cost the most points.', scope: 'all'
    }
  ],
  ap3: [
    {
      week: 1, weekOf: '2027-03-29', title: 'Lymph flow and immune defenses',
      sections: range(21, 1, 5),
      focus: 'Trace lymph from tissue to a vein. Compare innate defense, T-cell action and B-cell antibody production in one infection.',
      checkpoint: 'Identify a lymph node, thymus and spleen, and state one function of each.'
    },
    {
      week: 2, weekOf: '2027-04-05', title: 'Immune disorders, airways and ventilation',
      sections: [...range(21, 6, 7), ...range(22, 1, 3)],
      focus: 'Explain why graft tissue can trigger a response. Follow air into an alveolus and link inspiration to thoracic volume and alveolar pressure.',
      checkpoint: 'Read a ventilation trace and explain which pressure change starts airflow.'
    },
    {
      week: 3, weekOf: '2027-04-12', title: 'Gas exchange and the start of digestion',
      sections: [...range(22, 4, 7), ...range(23, 1, 2)],
      focus: 'Use partial pressures to predict gas movement, explain hemoglobin unloading and relate surfactant to the first breaths. Then trace food through the gut.',
      checkpoint: 'Take the Chapters 21–22 mock after finishing respiratory development. The gut overview starts the next unit.', scope: 'unit-1'
    },
    {
      week: 4, weekOf: '2027-04-19', title: 'Digestive organs and absorption',
      sections: range(23, 3, 7),
      focus: 'Locate the entry of bile and pancreatic juice. Trace absorbed glucose into portal blood and most long-chain dietary fats into lymph.',
      checkpoint: 'Predict which digestive steps are impaired when bile fails to reach the duodenum.'
    },
    {
      week: 5, weekOf: '2027-04-26', title: 'Metabolism, nutrition and temperature',
      sections: range(24, 1, 7),
      focus: 'Compare fuel storage after a meal with fuel mobilization during fasting. Use a heat-balance example to connect metabolism with temperature regulation.',
      checkpoint: 'Take the Chapters 23–24 mock and explain how an absorbed nutrient is stored or used.', scope: 'unit-2'
    },
    {
      week: 6, weekOf: '2027-05-03', title: 'Kidneys, filtration and reabsorption',
      sections: range(25, 1, 6),
      focus: 'Trace blood through glomerular and peritubular capillaries, then take a separate route with filtrate from the capsule through the nephron.',
      checkpoint: 'Distinguish filtration, reabsorption and secretion by naming the starting and ending compartments.'
    },
    {
      week: 7, weekOf: '2027-05-10', title: 'Renal regulation and water balance',
      sections: [...range(25, 7, 10), ...range(26, 1, 2)],
      focus: 'Predict ADH release, collecting-duct water permeability and urine concentration after water loss. Compare this response with the renin–angiotensin–aldosterone system.',
      checkpoint: 'Predict the direction of water movement across a cell membrane after an extracellular solute change.'
    },
    {
      week: 8, weekOf: '2027-05-17', title: 'Electrolytes, acid–base balance and reproduction',
      sections: [...range(26, 3, 5), '27.1'],
      focus: 'Use pH, carbon dioxide and bicarbonate to distinguish respiratory and metabolic disturbances. Then trace sperm from a seminiferous tubule to the urethra.',
      checkpoint: 'Take the Chapters 25–26 mock after acid–base compensation. Reproductive anatomy starts the next unit.', scope: 'unit-3'
    },
    {
      week: 9, weekOf: '2027-05-24', title: 'Reproductive cycles and early development',
      sections: [...range(27, 2, 3), ...range(28, 1, 2)],
      focus: 'Align ovarian and uterine changes with hormone levels. Trace ovulation, fertilization and implantation, including where each occurs.',
      checkpoint: 'Explain the LH surge and place cleavage, blastocyst formation and implantation in order.'
    },
    {
      week: 10, weekOf: '2027-05-31', title: 'Fetal development, birth and inheritance',
      sections: range(28, 3, 7),
      focus: 'Trace placental exchange and changes at the first breath. Distinguish milk production from ejection and interpret inheritance in a simple pedigree.',
      checkpoint: 'Take the Chapters 27–28 mock after neonatal adaptation, lactation and inheritance.', scope: 'unit-4'
    },
    {
      week: 11, weekOf: '2027-06-07', title: 'Cumulative spring review',
      sections: [],
      focus: 'Connect ventilation and kidney compensation in one acid–base case. Compare routes for dietary fat, lymph, filtrate and gametes on unlabeled diagrams.',
      checkpoint: 'Take the Chapters 21–28 cumulative mock. Use the cumulative practical to revisit structure identification.', scope: 'all'
    }
  ]
};

export const termExamSources = [
  {title: 'UCC academic calendar, 2026–27', url: 'https://umpqua.edu/academics/academic-resources/registration-records/academic-calendar/'},
  {title: 'UCC biology catalog descriptions', url: 'https://ucccatalog.courseleaf.com/courses-az/bi/bi.pdf'},
  {course: 'ap2', title: 'Oregon BI 232Z course outcomes', url: 'https://www.oregon.gov/highered/about/transfer/Documents/Transfer-Resources/transfer-common-course-numbering/2025-CCNAP-for-BI-BIOL-BIOL-232Z.pdf'},
  {course: 'ap3', title: 'Oregon BI 233Z course outcomes', url: 'https://www.oregon.gov/highered/about/transfer/Documents/Transfer-Resources/transfer-common-course-numbering/2025-CCNAP-for-BI-BIOL-BIOL-233Z.pdf'},
  {title: 'OpenStax Anatomy and Physiology 2e chapter guide', url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/preface'}
];
