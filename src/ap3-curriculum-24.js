// Original teaching examples and independent assessments aligned to the section sources.
export default [
  {
    id: '24.1',
    objective: "Classify a metabolic reaction by tracing matter and energy separately.",
    explanation: "Catabolism breaks down molecules and can capture released energy in ATP or reduced electron carriers. Anabolism uses energy and building blocks to make larger molecules. Enzymes lower activation energy and can speed a reaction without changing its overall energy difference. ATP hydrolysis can drive a coupled reaction.",
    worked: "Joining amino acids into a new protein builds a larger molecule and consumes energy. Label the protein as the material product and ATP or GTP expenditure as part of the energy cost.",
    check: ["A cell breaks a fuel molecule down and captures some of its energy. What kind of pathway is this?","Catabolic","Anabolic","A passive transport pathway","Catabolism dismantles molecules and can capture part of their chemical energy."],
    exams: [
      ["A catalyst is added to a reaction with fixed reactants, products and temperature. Which quantity decreases?","Activation energy","Energy difference between reactants and products","Number of atoms that must be conserved","An enzyme lowers the reaction barrier while leaving the overall energy change intact."],
      ["A cell incorporates glucose units into a glycogen granule. Which description accounts for the direction of assembly?","An anabolic process builds a polymer","A catabolic process splits glycogen","Osmosis concentrates free glucose","Linking smaller units into a storage polymer is anabolism."],
    ],
  },
  {
    id: '24.2',
    objective: "Place glucose breakdown steps in their cellular compartments and identify the role of oxygen.",
    explanation: "Glycolysis divides glucose into two pyruvates in the cytosol and yields net ATP and NADH. Under aerobic conditions pyruvate can enter the mitochondrial matrix for conversion to acetyl-CoA. The citric acid cycle supplies reduced carriers. Electron transfer in the inner mitochondrial membrane ultimately reduces oxygen and supports ATP synthesis.",
    worked: "Track oxygen in aerobic respiration. It accepts electrons at the end of the respiratory chain and contributes to water formation. Carbon released as CO₂ comes from processing carbon-containing substrates.",
    check: ["Which step can still occur in a mature red blood cell that lacks mitochondria?","Glycolysis","Citric acid cycle","Oxidative phosphorylation","Glycolytic enzymes are in the cytosol and can provide ATP without mitochondria."],
    exams: [
      ["During intense work, pyruvate is converted to lactate. Which regenerated molecule helps sustain glycolysis?","NAD⁺","Acetyl-CoA","Molecular oxygen","Reducing pyruvate oxidizes NADH to NAD⁺, a required electron acceptor for glycolysis."],
      ["Where does the proton gradient that powers mitochondrial ATP synthase span a membrane?","Across the inner mitochondrial membrane","Across the outer nuclear membrane","Across the plasma membrane of an erythrocyte","Respiratory-chain complexes pump protons across the inner mitochondrial membrane."],
    ],
  },
  {
    id: '24.3',
    objective: "Trace triglyceride breakdown products into energy pathways.",
    explanation: "Lipolysis releases fatty acids and glycerol from stored triglycerides. Glycerol can feed pathways leading to glucose or glycolysis, especially in liver. Fatty acids undergo beta oxidation, producing acetyl-CoA and reduced carriers. During sustained carbohydrate shortage, the liver can convert acetyl-CoA into ketone bodies for export.",
    worked: "Split a stored triglyceride into its components. The glycerol backbone can contribute carbon to glucose synthesis. The carbons of a typical even-chain fatty acid enter acetyl-CoA and provide no net glucose in humans.",
    check: ["Beta oxidation removes two-carbon units from fatty acids mostly in which form?","Acetyl-CoA","Pyruvate","Lactate","Each beta-oxidation cycle shortens the fatty acid chain and yields an acetyl-CoA unit."],
    exams: [
      ["Which fuel can the liver export when acetyl-CoA accumulates during prolonged fasting?","Ketone bodies","Glycogen granules","Intact mitochondrial ATP synthase","Hepatic ketogenesis converts acetyl-CoA into water-soluble fuels usable by other tissues."],
      ["Which product of triglyceride hydrolysis can contribute directly to net glucose synthesis in the liver?","Glycerol","Acetyl-CoA from an even-chain fatty acid","All carbon released as expired CO₂","Glycerol can be converted to a three-carbon intermediate for gluconeogenesis."],
    ],
  },
  {
    id: '24.4',
    objective: "Trace amino nitrogen and the carbon skeleton along different paths.",
    explanation: "Amino acids supply building blocks and can also supply fuel. Transfer or removal of amino groups separates nitrogen handling from carbon metabolism. The liver converts much of the waste nitrogen to urea, which the kidneys excrete. Carbon skeletons enter different pathways according to the amino acid.",
    worked: "When alanine donates its amino group, its three-carbon skeleton can become pyruvate. The transferred nitrogen can later enter urea. Tracking nitrogen alone would miss the carbon’s potential contribution to glucose.",
    check: ["Which organ makes most urea from amino nitrogen?","Liver","Urinary bladder","Skeletal muscle tendon","The hepatic urea cycle packages nitrogen into urea for renal excretion."],
    exams: [
      ["A label follows the nitrogen of an amino acid into urine. In what major nitrogenous waste might it appear?","Urea","Glycogen","Acetyl-CoA","Amino nitrogen is commonly processed in the liver into urea and excreted by the kidneys."],
      ["An essential amino acid is missing from a diet that supplies enough calories. Which process can be limited by its absence?","Assembly of proteins that require that amino acid","Passive diffusion of oxygen across an alveolus","Filtration of water across a glomerulus","Humans must obtain essential amino acids from the diet to sustain protein synthesis."],
    ],
  },
  {
    id: '24.5',
    objective: "Predict organ-specific fuel movements in the absorptive and postabsorptive states.",
    explanation: "After a carbohydrate-containing meal, insulin favors glucose uptake in skeletal muscle and adipose tissue and favors fuel storage. Between meals, lower insulin and increased glucagon favor hepatic glucose release. Adipose lipolysis provides fatty acids. Muscle glycogen chiefly supplies the muscle that stores it.",
    worked: "Follow liver glycogen before and after an overnight fast. After a meal, the liver can store incoming glucose as glycogen. During the fast it can break glycogen down and release glucose to support other tissues.",
    check: ["Which direction of flux normally increases in adipose tissue between meals?","Release of fatty acids","Uptake of chylomicron lipid for storage as the dominant response","Insulin-driven glucose uptake","Falling insulin permits lipolysis and fatty-acid release."],
    exams: [
      ["Two glycogen stores shrink during activity and fasting. Which organ can release substantial free glucose directly into blood from its glycogen?","Liver","Skeletal muscle","Both equally","The liver can dephosphorylate glucose-6-phosphate for export. Muscle chiefly uses its glycogen locally."],
      ["In a modeled meal response, insulin rises and muscle contraction is held constant. Which flux is expected to increase in skeletal muscle?","Glucose uptake and glycogen synthesis","Glucose release into blood","Export of muscle glycogen granules","Insulin promotes glucose uptake and storage in insulin-responsive muscle."],
    ],
  },
  {
    id: '24.6',
    objective: "Use heat production, transfer mode and evaporation to predict heat balance.",
    explanation: "Body heat storage increases when heat input and metabolic production exceed heat loss. Radiation transfers energy without contact, conduction requires direct contact, convection involves movement of air or water, and evaporation removes heat when liquid becomes vapor. Skin blood flow and sweat production adjust heat exchange.",
    worked: "A student produces 400 W of heat and loses 350 W to the environment. Net heat storage is +50 W. If humidity reduces evaporation while other terms stay fixed, storage increases.",
    check: ["Sweat drips off without evaporating. Which cooling process has failed to use that portion of sweat?","Evaporation","Conduction through a chair","Radiation toward cooler walls","Heat removal by sweating depends on water changing from liquid to vapor."],
    exams: [
      ["During steady exercise, heat production is 480 W and total heat loss is 510 W. What is the rate of change of stored heat?","−30 W","+30 W","+990 W","Subtract heat loss from production. The negative sign means body heat content falls in this model."],
      ["A person rests a forearm on a cool metal bench. Which mechanism carries heat directly across the contact surface?","Conduction","Evaporation","Radiation","Direct physical contact permits conductive heat transfer."],
    ],
  },
  {
    id: '24.7',
    objective: "Separate energy-yielding nutrients from vitamins and minerals and interpret a simple food label.",
    explanation: "Carbohydrate and protein each contribute about 4 kcal/g, while fat contributes about 9 kcal/g. Vitamins and minerals support metabolic reactions and other body functions. They supply no dietary energy themselves. Essential nutrients must be obtained from food in adequate amounts.",
    worked: "A portion has 8 g fat and 10 g carbohydrate. These contribute about 72 + 40 = 112 kcal. A B vitamin listed on the label can participate in fuel metabolism without adding kilocalories.",
    check: ["Which listed nutrient contributes the most energy per gram?","Fat","Protein","Carbohydrate","Fat contributes about 9 kcal/g compared with about 4 kcal/g from protein or carbohydrate."],
    exams: [
      ["A sample provides 12 g protein and 5 g fat, with other sources negligible. Estimate the energy.","93 kcal","68 kcal","153 kcal","Protein contributes 48 kcal and fat contributes 45 kcal, totaling 93 kcal."],
      ["A vitamin helps an enzyme transfer electrons during fuel metabolism. What can be inferred about this vitamin?","It can serve as part of a coenzyme","It therefore supplies 9 kcal per gram","It replaces the fuel as the main energy source","Many vitamins form parts of coenzymes. Their role in a pathway is distinct from dietary energy yield."],
    ],
  },
];
