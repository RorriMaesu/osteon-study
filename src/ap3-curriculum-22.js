// Original teaching examples and independent assessments aligned to the section sources.
export default [
  {
    id: '22.1',
    objective: "Trace air from the nose to the first airway segments capable of gas exchange.",
    explanation: "The nasal cavity warms, moistens and filters inhaled air. Air passes through the pharynx, larynx, trachea, bronchi and progressively smaller bronchioles. Terminal bronchioles end the conducting zone. Respiratory bronchioles bear alveoli and connect to alveolar ducts and sacs.",
    worked: "Start at a terminal bronchiole and move toward the periphery. Scattered alveoli interrupt the wall of the next airway, identifying a respiratory bronchiole and the start of the respiratory zone.",
    check: ["Which airway is the last part of the conducting zone?","Terminal bronchiole","Alveolar duct","Respiratory bronchiole","Terminal bronchioles move air to the respiratory bronchioles; alveoli first appear downstream."],
    exams: [
      ["A slide shows cartilage plates and ciliated lining in an intrapulmonary airway. Which location fits?","Bronchus","Bronchiole","Alveolar duct","Intrapulmonary bronchi have cartilage plates. Bronchioles lack cartilage."],
      ["Air has just passed the vocal folds and exited the larynx inferiorly. Which single airway receives it next?","Trachea","Right main bronchus","Pharynx","The trachea connects the larynx to the bifurcation into main bronchi."],
    ],
  },
  {
    id: '22.2',
    objective: "Locate the lung lobes and distinguish the two pleural surfaces.",
    explanation: "The right lung has superior, middle and inferior lobes. The left has superior and inferior lobes and an indentation for the heart. Visceral pleura covers the lung surface and dips into fissures. Parietal pleura lines the thoracic wall, diaphragm and mediastinum. Fluid between them reduces friction and helps couple lung motion to chest-wall motion.",
    worked: "At the lateral chest wall, travel inward from a rib. You reach parietal pleura, the thin pleural fluid layer, visceral pleura, then lung tissue.",
    check: ["A probe rests directly against the surface of an inferior lobe. Which serous layer is it touching?","Visceral pleura","Parietal pleura","Parietal pericardium","The visceral layer adheres to the organ surface."],
    exams: [
      ["A lobe lies between the horizontal and oblique fissures. On which side and in which lobe is the probe?","Right middle lobe","Left superior lobe","Right inferior lobe","The right lung has a middle lobe bounded by the horizontal and oblique fissures."],
      ["A section crosses the pleural membrane lining the superior surface of the diaphragm. Which layer is shown?","Parietal pleura","Visceral pleura","Visceral pericardium","Diaphragmatic pleura is a region of the parietal layer."],
    ],
  },
  {
    id: '22.3',
    objective: "Predict airflow from alveolar pressure and calculate ventilation from a breathing trace.",
    explanation: "During quiet inspiration the diaphragm contracts, thoracic volume rises and alveolar pressure falls briefly below atmospheric pressure. Air enters until pressures equalize. Elastic recoil during quiet expiration reverses the pressure difference. Minute ventilation equals tidal volume times rate. Alveolar ventilation subtracts conducting dead space from each breath first.",
    worked: "A 500 mL breath at 12 breaths/min gives 6.0 L/min minute ventilation. With 150 mL dead space, only (500 − 150) × 12 = 4.2 L/min reaches exchange regions as fresh air.",
    check: ["With an open airway, alveolar and atmospheric pressures match at end-inspiration. What is instantaneous flow?","Zero","Inward at its highest rate","Outward at its highest rate","Flow requires a pressure difference between the airway opening and the alveoli."],
    exams: [
      ["A learner breathes 450 mL at 16 breaths/min. Dead space is 150 mL per breath. Find alveolar ventilation.","4.8 L/min","7.2 L/min","2.4 L/min","Fresh air per breath is 300 mL. Multiplying by 16 gives 4800 mL/min."],
      ["Which quantity remains in the lungs after maximal expiration and therefore cannot be measured by simple spirometry alone?","Residual volume","Tidal volume","Expiratory reserve volume","A simple spirometer records air moving through its opening. Residual volume stays in the lungs."],
    ],
  },
  {
    id: '22.4',
    objective: "Use separate partial-pressure gradients to predict O₂ and CO₂ movement across a membrane.",
    explanation: "Each gas diffuses down its own partial-pressure gradient. At the lungs, incoming venous blood usually gains O₂ and loses CO₂. At active tissues the gradients usually reverse. A thin barrier and large area favor exchange. Air delivery and blood delivery must both reach a region for effective exchange.",
    worked: "An alveolus has PO₂ of 100 mmHg while arriving capillary blood has 40 mmHg. O₂ moves from alveolus to blood. If membrane thickness increases, the same gradient drives slower exchange.",
    check: ["Incoming pulmonary blood PCO₂ is 46 mmHg and alveolar PCO₂ is 40 mmHg. Where does CO₂ move?","From blood into the alveolus","From the alveolus into blood","Equally in both directions with no net transfer","The higher CO₂ partial pressure is in blood."],
    exams: [
      ["Tissue PO₂ is 20 mmHg and arterial-end capillary PO₂ is 95 mmHg. What is the net direction for oxygen?","From capillary blood to tissue","From tissue to capillary blood","Alongside CO₂ from tissue to blood","Oxygen diffuses down its own gradient from 95 to 20 mmHg."],
      ["An alveolus receives normal airflow but its capillary receives almost no blood. What limits oxygen uptake there?","Perfusion","Airflow through the conducting airway","Diffusion distance set by a thickened membrane","Very little blood arrives to accept oxygen even though air reaches this alveolus."],
    ],
  },
  {
    id: '22.5',
    objective: "Distinguish dissolved gas, hemoglobin-bound gas and bicarbonate transport.",
    explanation: "Most blood O₂ is bound to hemoglobin. Dissolved oxygen establishes PO₂. A drop in pH or a rise in temperature favors O₂ unloading at a given PO₂. Much of the CO₂ entering red cells is converted to bicarbonate, which travels mainly in plasma. These reactions reverse in the lungs.",
    worked: "Active muscle warms and accumulates CO₂. At the same local PO₂, a rightward shift of the hemoglobin dissociation curve leaves fewer oxygen molecules bound, making more available to tissue.",
    check: ["Which form carries most CO₂ in systemic venous blood?","Bicarbonate","CO₂ bound to heme iron","Dissolved CO₂ alone","Carbonic anhydrase helps convert CO₂ to bicarbonate in red cells, and much bicarbonate moves into plasma."],
    exams: [
      ["Two blood samples have equal PO₂ and hemoglobin saturation. Sample B has half as much hemoglobin per deciliter. Which quantity is lower in B?","Total O₂ content per deciliter","Partial pressure of oxygen","Fraction of hemoglobin sites occupied","Most oxygen is bound to hemoglobin. Fewer binding sites reduce content despite equal fractional saturation."],
      ["At the same PO₂, a warmed muscle capillary has lower hemoglobin saturation than a cooler control. What does this support?","Greater release of O₂ to tissue","Greater hemoglobin affinity for O₂","Loss of the gradient for CO₂","A rightward shift lowers affinity and favors unloading at a given oxygen pressure."],
    ],
  },
  {
    id: '22.6',
    objective: "Relate altitude or exercise to ventilatory drive and distinguish rapid responses from acclimatization.",
    explanation: "At altitude the oxygen fraction of air is similar, but lower atmospheric pressure lowers inspired PO₂. Peripheral chemoreceptors respond to low arterial PO₂ and can increase ventilation quickly. With sustained exposure, erythropoietin supports increased red-cell production over days. During exercise, ventilation adjusts to higher metabolic demand.",
    worked: "On arrival at altitude, a hiker breathes faster before the marrow could have produced many new red cells. Increased ventilation suits that time scale. A higher red-cell mass is a later adaptation.",
    check: ["During aerobic exercise, tidal volume and rate both rise. What happens to minute ventilation?","It rises","It stays constant","It falls","Minute ventilation is the product of tidal volume and breathing frequency."],
    exams: [
      ["A chamber lowers atmospheric pressure while keeping the oxygen fraction at 21%. Which inhaled quantity falls?","Partial pressure of oxygen","Fraction of oxygen molecules","Fraction of nitrogen molecules because of oxygen enrichment","A gas contributes its fraction of the total pressure, so lowering total pressure lowers inspired PO₂."],
      ["After sustained residence at altitude, which change can increase blood oxygen-carrying capacity?","Erythropoietin-stimulated red-cell production","A lower atmospheric oxygen fraction","Loss of hemoglobin from red cells","Additional hemoglobin increases the amount of oxygen blood can carry."],
    ],
  },
  {
    id: '22.7',
    objective: "Explain how respiratory diverticulum branching and surfactant support function at birth.",
    explanation: "The respiratory diverticulum buds from the foregut. Repeated branching forms the bronchial tree. As distal air spaces and their capillary networks mature, type II alveolar cells produce surfactant. Surfactant lowers surface tension at the air–liquid interface and reduces the pressure needed to expand the air spaces.",
    worked: "Compare two model air spaces at equal radius. The one with greater surface tension requires more distending pressure. Surfactant lowers that pressure, helping small air spaces stay open between breaths.",
    check: ["Which cell produces pulmonary surfactant?","Type II alveolar cell","Type I alveolar cell","Alveolar macrophage","Type II cells secrete surfactant. Thin type I cells form much of the exchange surface."],
    exams: [
      ["A developing lung has immature distal capillaries far from the air-space lining. Which aspect of gas exchange is limited?","Diffusion across the blood–air barrier","Transport of air through the pharynx","Attachment of the diaphragm to ribs","A larger separation increases diffusion distance for respiratory gases."],
      ["Two equal-sized air sacs have different surface tensions. Which needs more pressure to stay open?","The higher-tension sac","The lower-tension sac","Both require identical pressure at any tension","At fixed radius, greater surface tension increases the collapsing pressure."],
    ],
  },
];
