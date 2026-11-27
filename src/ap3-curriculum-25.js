// Original teaching examples and independent assessments aligned to the section sources.
export default [
  {
    id: '25.1',
    objective: "Interpret urine volume and concentration as separate observations.",
    explanation: "Urine contains water and dissolved wastes such as urea, with variable amounts of electrolytes. Volume measures the amount of fluid. Osmolality measures particles per kilogram of water, while specific gravity compares density with water. Hydration and solute handling can affect these measurements. A single finding requires context.",
    worked: "Two complete collections each contain 300 milliosmoles. One occupies 1 kg of water and the other 0.5 kg. Their approximate osmolalities are 300 and 600 mOsm/kg, respectively, despite equal solute amounts.",
    check: ["If water excretion falls and the same amount of solute is excreted, what happens to urine concentration?","It increases","It decreases","It stays constant","The same number of dissolved particles is carried in less water."],
    exams: [
      ["Collection A contains 0.8 kg of water at 500 mOsm/kg. How many milliosmoles does it contain?","400 mOsm","625 mOsm","500 mOsm","Multiply concentration by water mass: 500 × 0.8 = 400 mOsm."],
      ["A specimen has a specific gravity above that of water. What does this comparison directly describe?","Its density relative to water","Its daily volume","Its rate of filtration at the glomerulus","Specific gravity compares densities. Neither daily output nor filtration rate follows from this measurement alone."],
    ],
  },
  {
    id: '25.2',
    objective: "Trace urine to the exterior and distinguish voluntary sphincter control from bladder contraction.",
    explanation: "Urine travels from each renal pelvis along a ureter to the bladder. Muscular waves help propel it. During voiding the detrusor contracts and the outlet relaxes. The external urethral sphincter is skeletal muscle under somatic control. Urine exits the bladder through the urethra.",
    worked: "Start at a ureteric opening in the bladder trigone. Fluid enters the bladder from above and leaves through the internal urethral opening. Voluntary contraction of the external urethral sphincter can delay voiding.",
    check: ["Which change supplies the force to empty the bladder during normal voiding?","Detrusor contraction","Contraction of the external urethral sphincter","Closure of both ureters","Detrusor smooth muscle contraction raises bladder pressure while the outlet relaxes."],
    exams: [
      ["Peristaltic waves carry a tracer from the left renal pelvis toward the bladder. Which tube contains it?","Left ureter","Urethra","Left collecting duct","Each ureter connects a renal pelvis to the bladder. The urethra leads from the bladder outward."],
      ["Which structure can contract under somatic motor control to postpone urine release?","External urethral sphincter","Detrusor smooth muscle","Ureteric smooth muscle","The external urethral sphincter contains skeletal muscle."],
    ],
  },
  {
    id: '25.3',
    objective: "Use landmarks in a kidney section to trace outflow from a single medullary pyramid.",
    explanation: "The renal cortex lies beneath the capsule. Medullary pyramids have broad bases facing cortex and papillae projecting toward minor calyces. Cortical columns extend between pyramids. Minor calyces join major calyces and then the renal pelvis, which narrows to form the ureter at the hilum.",
    worked: "Place a point at the tip of a medullary pyramid. Fluid emerging through papillary ducts enters a minor calyx first, followed by a major calyx, the pelvis and the ureter.",
    check: ["A cup-shaped structure embraces one renal papilla. Identify it.","Minor calyx","Renal column","Major renal artery","A minor calyx collects fluid from the papillary tip."],
    exams: [
      ["A band of tissue continuous with the peripheral cortex runs between adjacent pyramids. What is it?","Renal column","Papillary duct","Renal pelvis","Columns are extensions of cortical tissue between medullary pyramids."],
      ["In a section, two minor calyces join into a larger branch before the central funnel. Name that branch.","Major calyx","Ureter","Renal papilla","Major calyces collect smaller calyces and drain to the renal pelvis."],
    ],
  },
  {
    id: '25.4',
    objective: "Distinguish the blood and fluid spaces of a renal corpuscle and compare nephron loop depths.",
    explanation: "A renal corpuscle in the cortex contains a glomerular capillary tuft and its capsule. Blood enters via an afferent arteriole and leaves via an efferent arteriole. Filtered fluid enters capsular space and then the proximal tubule. Juxtamedullary nephrons have long loops extending deep into the medulla. Collecting ducts receive fluid from multiple nephrons.",
    worked: "A cortical field contains a round tuft of capillaries with a clear rim enclosed by a capsule. The rim is capsular space. A molecule entering that space can next reach the proximal tubule, while a red cell remains in the capillary lumen.",
    check: ["Which vessel carries blood immediately away from a glomerular tuft?","Efferent arteriole","Afferent arteriole","Renal vein","The efferent arteriole drains the tuft and supplies downstream capillaries."],
    exams: [
      ["A reconstructed nephron has its corpuscle near the cortex–medulla boundary and a long loop descending deep into a pyramid. Classify it.","Juxtamedullary nephron","Superficial cortical nephron","Collecting duct","The position of the corpuscle and deep loop identify a juxtamedullary nephron."],
      ["A tracer enters the space between the visceral and parietal layers of a glomerular capsule. Which segment does it reach next?","Proximal convoluted tubule","Efferent arteriole","Vasa recta","Capsular space continues into the proximal tubule at the urinary pole."],
    ],
  },
  {
    id: '25.5',
    objective: "Predict a filtration change from the forces acting across glomerular capillaries.",
    explanation: "Glomerular capillary hydrostatic pressure pushes fluid into capsular space. Capsular hydrostatic pressure and plasma colloid osmotic pressure oppose filtration. With negligible protein in capsular fluid, net filtration pressure is glomerular pressure minus the two opposing pressures. GFR also depends on filtration area and permeability.",
    worked: "For glomerular pressure 55 mmHg, capsular pressure 15 mmHg and plasma oncotic pressure 30 mmHg, net pressure is 55 − 15 − 30 = 10 mmHg. Increasing only capsular pressure reduces the driving force.",
    check: ["Suppose filtration area and all hydrostatic pressures stay fixed. What does increasing plasma protein osmotic pressure do to GFR?","Lowers GFR","Raises GFR","Leaves GFR fixed","Higher plasma oncotic pressure increases the force retaining water in glomerular blood."],
    exams: [
      ["Glomerular hydrostatic pressure is 58 mmHg. Opposing pressures are 18 and 28 mmHg. Find net filtration pressure.","12 mmHg","48 mmHg","104 mmHg","Subtract both opposing terms: 58 − 18 − 28 = 12 mmHg."],
      ["An outflow obstruction raises capsular hydrostatic pressure while other forces initially stay fixed. What happens to filtration?","It falls","It rises","It reverses immediately at any pressure increase","Higher capsular pressure opposes filtration. Reversal would depend on the magnitude of the total forces."],
    ],
  },
  {
    id: '25.6',
    objective: "Predict solute excretion using direction of transport and limits on reabsorption.",
    explanation: "Filtration delivers a solute from blood to tubular fluid. Reabsorption returns it to blood. Secretion moves additional solute from blood into the tubule. Excretion equals filtration minus reabsorption plus secretion, with all rates in matching units. Carrier-mediated uptake has a finite capacity.",
    worked: "A substance is filtered at 125 mg/min, reabsorbed at 120 mg/min and secreted at 0 mg/min. Net excretion is 125 − 120 + 0 = 5 mg/min. The mass balance does not specify urine volume.",
    check: ["A solute is filtered at 50, reabsorbed at 10 and secreted at 4 mg/min. What is its excretion rate?","44 mg/min","36 mg/min","64 mg/min","Secretion adds to the tubular load: 50 − 10 + 4 = 44 mg/min."],
    exams: [
      ["Glucose is filtered faster than its available tubular carriers can reabsorb it. Which observation follows?","Some filtered glucose reaches final urine","All excess glucose bypasses the tubule into blood","Glomerular pressure immediately drops to zero","Transport capacity limits reabsorption, leaving glucose in tubular fluid."],
      ["A substance is filtered at 60 mg/min and excreted at 75 mg/min. Which net tubular movement accounts for the difference?","Net secretion of 15 mg/min","Net reabsorption of 15 mg/min","Net secretion of 135 mg/min","Excretion exceeds the filtered load by 15 mg/min, so secretion exceeds reabsorption by that amount."],
    ],
  },
  {
    id: '25.7',
    objective: "Explain how local resistance changes stabilize glomerular perfusion.",
    explanation: "Within the autoregulatory range, stretch of the afferent arteriole can cause its smooth muscle to contract. The macula densa also senses tubular salt delivery and signals nearby arterioles and renin-releasing cells. Strong sympathetic activation can override local regulation and redirect flow.",
    worked: "A modest rise in arterial pressure stretches the afferent arteriole. Myogenic contraction increases resistance, limiting the rise in glomerular pressure that would otherwise accompany the pressure rise.",
    check: ["At fixed upstream pressure, what is the immediate effect of constricting the afferent arteriole?","Less flow into the glomerulus","More flow into the glomerulus","A direct rise in capsular oncotic pressure","An increased resistance upstream reduces blood entry and tends to reduce glomerular pressure."],
    exams: [
      ["A sensor in the distal nephron detects increased salt delivery and signals the neighboring arteriole. Which sensor is involved?","Macula densa","Parietal layer of the glomerular capsule","Papillary duct opening","The macula densa is the tubular sensor involved in tubuloglomerular feedback."],
      ["Afferent smooth muscle contracts when perfusion pressure rises modestly, even without a nerve signal. Which response is demonstrated?","Myogenic autoregulation","Voluntary somatic control","Water recovery through ADH channels","Direct contraction in response to stretch is a myogenic mechanism."],
    ],
  },
  {
    id: '25.8',
    objective: "Discriminate the nephron effects of ADH, aldosterone and atrial natriuretic peptide.",
    explanation: "ADH increases collecting-duct water permeability by promoting aquaporin insertion. With a medullary osmotic gradient, water can leave the lumen. Aldosterone increases sodium reabsorption and supports potassium secretion in the distal nephron. Atrial natriuretic peptide favors sodium and water excretion when atrial stretch rises.",
    worked: "In a model with the medullary gradient fixed, add ADH. More water channels in principal cells allow water to move out of collecting fluid, tending to lower urine flow and raise urine concentration.",
    check: ["Which change best fits increased aldosterone action with other conditions fixed?","Greater sodium reabsorption in the distal nephron","Loss of collecting-duct aquaporins as its defining action","Inhibition of all potassium secretion","Aldosterone promotes sodium transport and usually favors distal potassium secretion."],
    exams: [
      ["Atrial walls stretch after extracellular volume expansion. Which endocrine signal favors urinary sodium loss?","Atrial natriuretic peptide","Aldosterone","Renin","Atrial stretch stimulates natriuretic peptide release, favoring natriuresis."],
      ["A duct develops more apical aquaporins, yet little water leaves because surrounding fluid has almost the same osmolality. What is missing?","An osmotic driving gradient","A route for all solutes through the water channels","A rise in luminal hydrostatic pressure to arterial levels","Permeability permits movement, but net osmosis also requires a gradient."],
    ],
  },
  {
    id: '25.9',
    objective: "Relate segment-specific salt and water transport to a medullary concentration gradient.",
    explanation: "In the descending thin limb, water can leave for a more concentrated medulla. The ascending limb transports salt outward and is relatively impermeable to water. Countercurrent multiplication in long loops helps build the gradient. Exchange in the vasa recta helps preserve it, supporting regulated water recovery downstream.",
    worked: "Compare tubular fluid entering and leaving the thick ascending limb. Salt leaves while little water follows. The tubular fluid becomes more dilute and the surrounding tissue gains solute.",
    check: ["What happens to fluid descending a water-permeable limb in increasingly concentrated medulla?","It loses water and becomes more concentrated","It gains water and becomes dilute","Its concentration must equal plasma throughout","The interstitial gradient draws water out of the descending limb."],
    exams: [
      ["Which combination can produce concentrated urine in a collecting duct?","A concentrated medullary interstitium and high duct water permeability","High duct water permeability with no osmotic gradient","A dilute medulla and zero duct water permeability","Both a driving gradient and a water-permeable route support substantial water reabsorption."],
      ["What role do the hairpin capillaries alongside long nephron loops play?","Vasa recta exchange solutes and water while limiting gradient washout","They filter plasma directly into capsular space","They receive urine from multiple nephrons","Countercurrent exchange in vasa recta helps maintain the medullary gradient."],
    ],
  },
  {
    id: '25.10',
    objective: "Link renal oxygen sensing, vitamin D activation and renin release to whole-body homeostasis.",
    explanation: "Kidneys respond to reduced oxygen delivery by increasing erythropoietin, which supports red-cell production in marrow. Renal enzymes convert a vitamin D precursor into calcitriol, aiding calcium balance. Renin initiates a hormonal sequence that supports pressure and volume. These functions connect the kidney to blood, bone and circulation.",
    worked: "Low renal tissue oxygen can raise erythropoietin before the circulating red-cell count changes. The kidney supplies the signal, while the marrow supplies newly produced cells over time.",
    check: ["Which renal product increases intestinal calcium absorption through vitamin D signaling?","Calcitriol","Erythropoietin","Renin","Calcitriol is the hormonally active vitamin D product made after renal activation."],
    exams: [
      ["Renal signaling after reduced oxygen delivery is intact, but the marrow cannot respond. Which expected change would be limited?","An increase in red-cell production","Release of renin from the kidney in response to low perfusion","Water movement through existing aquaporins","Erythropoietin acts on red-cell precursors in marrow, so impaired marrow response limits output."],
      ["Which renal substance initiates the conversion of angiotensinogen to angiotensin I?","Renin","Aldosterone","Erythropoietin","Renin released by granular cells catalyzes the first step of the renin–angiotensin cascade."],
    ],
  },
];
