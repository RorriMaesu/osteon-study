// Each step lists a destination, two alternative compartments, and the reason.
const route = (label, start, steps) => ({ label, start, steps });

export const drainage = {
  title: 'Trace lymph to venous blood', section: '21.1',
  intro: 'Follow the usual drainage pattern. Select the next structure before revealing each connection. Regional connections are illustrative and individual terminal vessels vary.',
  routes: [
    route('Right hand', 'Interstitial space in the right hand', [
      ['Lymphatic capillary', 'Venous angle', 'Splenic artery', 'Overlapping endothelial flaps admit interstitial fluid. Inside this capillary, the fluid is called lymph.'],
      ['Collecting lymphatic vessel', 'Thoracic duct', 'Lymph node hilum', 'Collecting vessels convey lymph toward regional nodes.'],
      ['Afferent vessel entering a regional node', 'Efferent vessel leaving a regional node', 'Splenic vein', 'Afferent lymphatics bring lymph to a node on its convex surface.'],
      ['Subcapsular sinus', 'Renal sinus', 'Right lymphatic duct', 'Lymph enters the sinus just under the node capsule and flows through deeper cortical and medullary sinuses.'],
      ['Efferent vessel at the hilum', 'Afferent vessel at the hilum', 'Left venous angle', 'Lymph exits through an efferent vessel. It may pass through further nodes en route to the terminal trunk.'],
      ['Right subclavian lymphatic trunk', 'Left lumbar lymphatic trunk', 'Intestinal lymphatic trunk', 'The right upper limb drains through the right subclavian trunk.'],
      ['Right lymphatic duct', 'Thoracic duct', 'Azygos vein', 'In the usual duct pattern the right upper limb drains with the right upper quadrant.'],
      ['Right internal jugular–subclavian junction', 'Left internal jugular–subclavian junction', 'Hepatic portal vein', 'The right duct returns lymph to venous blood at the right venous angle.'],
    ]),
    route('Left foot', 'Interstitial space in the left foot', [
      ['Lymphatic capillary', 'Cisterna chyli', 'Venous angle', 'Tissue fluid first enters a blind-ended lymphatic capillary.'],
      ['Collecting vessels and regional nodes', 'Hepatic portal system', 'Thoracic duct directly', 'Collectors convey lymph toward regional nodes before it enters the larger trunks.'],
      ['Left lumbar lymphatic trunk', 'Right subclavian lymphatic trunk', 'Left jugular lymphatic trunk', 'Lower-limb lymph drains via lumbar trunks.'],
      ['Thoracic duct, often through the cisterna chyli', 'Right lymphatic duct', 'Cystic duct', 'Both lower limbs contribute to thoracic-duct drainage. The cisterna chyli varies in anatomy.'],
      ['Left internal jugular–subclavian junction', 'Right internal jugular–subclavian junction', 'Inferior vena cava at the liver', 'The thoracic duct returns lymph at the left venous angle.'],
    ]),
  ],
};

export const absorption = {
  title: 'Follow two nutrients from a villus', section: '23.7',
  intro: 'Begin at the absorptive epithelium. Choose the first vessel and continue until you reach the first major destination.',
  routes: [
    route('Glucose', 'Glucose leaves the basal surface of an enterocyte', [
      ['Villus blood capillary', 'Central lacteal', 'Common bile duct', 'Monosaccharides enter the villus blood supply.'],
      ['Intestinal venules and mesenteric veins', 'Thoracic duct', 'Umbilical vein', 'Blood drains away from villi into intestinal veins.'],
      ['Hepatic portal vein', 'Hepatic vein', 'Right lymphatic duct', 'The portal vein carries blood from the gut to the liver.'],
      ['Hepatic sinusoids', 'Pulmonary capillaries', 'Glomerular capillaries', 'Intestinal blood reaches liver sinusoids before returning to the heart.'],
    ]),
    route('Long-chain lipid', 'A long-chain fatty acid and monoglyceride enter an enterocyte', [
      ['Reassembly into triglyceride and packaging in a chylomicron', 'Immediate packaging in a red cell', 'Conversion to a bile salt in the villus', 'The enterocyte packages newly formed triglycerides with other lipids and proteins.'],
      ['Central lacteal', 'Villus blood capillary', 'Hepatic vein', 'Chylomicrons enter the blind-ended lymphatic vessel in the villus.'],
      ['Intestinal collecting lymphatics and trunks', 'Hepatic portal vein', 'Pancreatic duct', 'Chylomicron-rich lymph drains from the gut through larger lymph vessels.'],
      ['Thoracic duct', 'Right lymphatic duct', 'Common bile duct', 'The intestinal lymphatic pathway usually joins the thoracic duct through the cisterna chyli.'],
      ['Left venous angle', 'Right venous angle', 'Hepatic portal vein', 'The thoracic duct reaches venous blood at the left jugular–subclavian junction.'],
    ]),
  ],
};

export const digestiveRoutes = {
  title: 'Trace the gut and its secretions', section: '23.6',
  intro: 'Follow each material in the direction it normally moves. Some adjacent structures share a wall or an opening while carrying different contents.',
  routes: [
    route('Swallowed bolus', 'A bolus in the oral cavity', [
      ['Pharynx', 'Larynx', 'Duodenum', 'The tongue moves the bolus into the pharynx. Airway-protective movements direct it toward the esophagus.'],
      ['Esophagus', 'Trachea', 'Jejunum', 'The upper esophageal sphincter opens for the bolus.'],
      ['Stomach', 'Duodenum', 'Cecum', 'Esophageal peristalsis propels the bolus toward the stomach.'],
      ['Duodenum, jejunum, ileum', 'Jejunum, ileum, duodenum', 'Ileum, duodenum, jejunum', 'Chyme first enters the duodenum and traverses the three small-intestinal segments in order.'],
      ['Cecum and colon', 'Stomach and esophagus', 'Rectum and then cecum', 'The terminal ileum empties through the ileocecal valve into the cecum.'],
      ['Rectum and anal canal', 'Ileum and cecum', 'Pancreatic duct and duodenum', 'After the ascending, transverse, descending and sigmoid colon, residue enters the rectum.'],
    ]),
    route('Gallbladder bile', 'Stored bile in the gallbladder during contraction', [
      ['Cystic duct', 'Common hepatic duct', 'Main pancreatic duct', 'Bile leaving the gallbladder passes into the cystic duct.'],
      ['Common bile duct', 'Duodenal lumen directly', 'Hepatic portal vein', 'The cystic duct joins the common hepatic duct to form the common bile duct.'],
      ['Duodenum via the major duodenal papilla', 'Stomach via the pylorus', 'Ileum via its villi', 'In the usual pattern the common bile duct joins the main pancreatic duct near the papilla.'],
    ]),
  ],
};

export const nephron = {
  title: 'Keep blood, filtrate and urine on their routes', section: '25.4',
  intro: 'Start near the renal corpuscle for two different journeys, then follow fluid through the shared drainage system.',
  routes: [
    route('Blood', 'A red blood cell in the afferent arteriole', [
      ['Glomerular capillary tuft', 'Capsular space', 'Proximal tubule', 'Blood enters the tuft from the afferent arteriole. Red cells normally stay within its lumen.'],
      ['Efferent arteriole', 'Capsular space', 'Collecting duct', 'The glomerulus drains into another arteriole.'],
      ['Peritubular capillaries or vasa recta', 'Proximal convoluted tubule', 'Minor calyx', 'The downstream bed supplies tubular tissues. Juxtamedullary efferent arterioles supply vasa recta.'],
      ['Renal venous drainage', 'Renal pelvis', 'Papillary ducts', 'Blood returns via venules and veins to the renal vein.'],
    ]),
    route('Filtered water', 'Water just filtered into capsular space, traced along the lumen if it remains there', [
      ['Proximal convoluted tubule', 'Efferent arteriole', 'Distal convoluted tubule', 'The capsule opens into the proximal tubule at the urinary pole.'],
      ['Descending then ascending nephron loop', 'Ascending then descending nephron loop', 'Collecting duct', 'Filtrate traverses the loop before reaching the distal tubule.'],
      ['Distal convoluted tubule', 'Vasa recta', 'Minor calyx', 'Fluid returns to cortical distal segments.'],
      ['Connecting segment and collecting duct', 'Glomerular capsule', 'Peritubular capillary', 'Multiple nephrons empty into shared collecting ducts.'],
    ]),
    route('Urine outflow', 'Fluid at a papillary duct opening', [
      ['Minor calyx', 'Major calyx', 'Renal pelvis', 'A minor calyx receives urine emerging from a papilla.'],
      ['Major calyx', 'Renal column', 'Ureter', 'Minor calyces converge into a larger calyx.'],
      ['Renal pelvis', 'Cortex', 'Urinary bladder', 'Major calyces lead toward the funnel-shaped pelvis.'],
      ['Ureter', 'Urethra', 'Efferent arteriole', 'The ureter carries urine from one renal pelvis toward the bladder.'],
      ['Bladder, then urethra', 'Urethra, then bladder', 'Renal vein, then bladder', 'The bladder stores urine before voiding through the urethra.'],
    ]),
  ],
};

export const sperm = {
  title: 'Trace sperm and urine through the pelvis', section: '27.1',
  intro: 'The routes share the urethra at different times. Trace the separate upstream ducts before the shared exit.',
  routes: [
    route('Sperm', 'Sperm in a seminiferous tubule', [
      ['Straight tubules and rete testis', 'Prostatic urethra', 'Ductus deferens', 'Seminiferous tubules drain via straight tubules into the intratesticular rete.'],
      ['Efferent ductules', 'Ejaculatory duct', 'Ureter', 'Efferent ductules connect the rete to the epididymis.'],
      ['Epididymis', 'Seminal vesicle lumen', 'Bladder', 'Sperm mature and are stored along the epididymal duct.'],
      ['Ductus deferens', 'Ejaculatory duct', 'Prostatic urethra', 'The epididymal tail continues as the ductus deferens.'],
      ['Ejaculatory duct', 'Seminal vesicle lumen', 'Ureter', 'The distal ductus deferens joins the duct of a seminal vesicle to form the ejaculatory duct.'],
      ['Prostatic urethra', 'Renal pelvis', 'Uterine tube', 'The ejaculatory ducts empty into the prostatic urethra.'],
    ]),
    route('Urine in a typical prostate-bearing tract', 'Urine in the renal pelvis', [
      ['Ureter', 'Urethra', 'Ejaculatory duct', 'A ureter carries urine from the renal pelvis toward the bladder.'],
      ['Bladder', 'Ductus deferens', 'Seminal vesicle', 'Urine is stored in the bladder.'],
      ['Urethra through the prostate and onward', 'Ejaculatory duct through the prostate', 'Epididymis', 'Urine leaves through the urethra. Ejaculatory ducts join this route but do not carry urine during normal voiding.'],
    ]),
  ],
};
