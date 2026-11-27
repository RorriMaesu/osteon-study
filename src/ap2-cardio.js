// Original lessons and activities aligned with the linked OpenStax A&P 2e sections.
import {renderSpecimen,mountSpecimen} from './ap2-cardio-specimens.js';
import {renderValveWindow,paintValves,renderOutput,mountOutput,renderEmbryo,mountEmbryo,renderPump,mountPump,renderExchange,mountExchange,renderHemorrhage,mountHemorrhage} from './ap2-cardio-mechanisms.js';
import {beat,rightBeat,rightPhases,rightPressureState,interpolate,pressureState,valveChallenges,valveChoices,rightValveChallenges,rightValveChoices} from './ap2-heart-cycle.js';
import {renderAfterload,mountAfterload} from './ap2-afterload.js';
import {renderHeartSounds,mountHeartSounds} from './ap2-heart-sounds.js';
import {renderRoutes,mountRoutes} from './ap2-cardio-routes.js';
import {smearStation,mountSmear,clotStation,mountClot} from './ap2-blood-stations.js';

const book = 'https://openstax.org/books/anatomy-and-physiology-2e/pages/';

function section(id, title, objectives, paragraphs, activity, questions) {
  const slug = title.toLowerCase().replaceAll(',', '').replaceAll(' ', '-');
  return { id, title, source: book + id.replace('.', '-') + '-' + slug, objectives, paragraphs, activity, questions };
}

function activity(title, prompt, pairs) {
  return { title, prompt, steps: pairs.map(([label, detail]) => ({ label, detail })) };
}

function question(prompt, choices, answer, why) {
  return { prompt, choices, answer, why };
}

const blood = {
  id: 18, title: 'Blood',
  summary: 'Read a spun blood sample, follow cells from marrow to circulation, and use antigen–antibody reactions to identify a blood type.',
  sections: [
    section('18.1', 'An Overview of Blood',
      ['Identify the layers in a centrifuged sample of whole blood.', 'Predict how changing plasma water or proteins affects blood measurements.'],
      [
        'Spin a tube of anticoagulated blood and the densest component, the red cells, settles at the bottom. White cells and platelets make a narrow pale band called the buffy coat. The fluid above them is plasma. Hematocrit is the percentage of whole-blood volume occupied by red cells. If water leaves the plasma, hematocrit can rise even when the number of red cells in the body stays constant.',
        'Plasma is the moving extracellular matrix of this connective tissue. Water carries dissolved nutrients, wastes, ions and hormones. Albumin helps retain water in the circulation, antibodies in the globulin fraction recognize specific targets, and fibrinogen provides the material for fibrin strands. Blood also distributes heat and buffers changes in acidity. Let the same sample clot before separating the fluid and the liquid you recover is serum, depleted of fibrinogen.'
      ],
      activity('Read the sample tube', 'A 10 mL anticoagulated sample contains 4.4 mL of packed red cells after spinning. Explain what each layer tells you.', [
        ['Calculate the fraction', 'Divide packed red cell volume by total sample volume. Here, 4.4 ÷ 10 × 100 gives a hematocrit of 44%.'],
        ['Locate the thin band', 'The buffy coat sits directly above the red cells. A thin layer can still contain many leukocytes and platelets.'],
        ['Change the water volume', 'Imagine removing only plasma water. The packed red cell volume stays at 4.4 mL while the denominator falls, so the percentage rises.']
      ]),
      [
        question('Which material would you collect from the thin band immediately above packed red cells?', ['Albumin and fibrinogen', 'White cells and platelets', 'Red cells and hemoglobin', 'Serum and dissolved salts'], 1, 'Leukocytes and platelets collect together in the buffy coat between the red cells and plasma.'),
        question('A sample contains 2.0 mL of packed erythrocytes in 5.0 mL of whole blood. What is its hematocrit?', ['2.5%', '20%', '40%', '60%'], 2, 'Hematocrit is 100 × 2.0/5.0, which gives 40%.'),
        question('Which change reduces the osmotic pull of blood plasma on water in capillaries?', ['Loss of circulating albumin', 'A rise in the red cell count', 'Production of more platelets', 'Release of more erythropoietin'], 0, 'Albumin supplies much of the colloid osmotic pressure that opposes filtration from capillaries.')
      ]),
    section('18.2', 'Production of the Formed Elements',
      ['Trace a blood cell to its parent lineage.', 'Explain the signal linking tissue oxygen supply to red cell production.'],
      [
        'Red marrow supplies circulating cells through hematopoiesis, also called hemopoiesis. A hematopoietic stem cell can renew itself or produce increasingly specialized descendants. In the introductory lineage model, lymphoid progenitors produce B cells, T cells and natural killer cells. Myeloid progenitors produce red cells, megakaryocytes, granulocytes and monocytes. A platelet is a piece shed by a megakaryocyte.',
        'Different signals bias production toward the cell type needed. Reduced oxygen availability in the kidney increases secretion of erythropoietin (EPO). EPO supports erythroid precursors in marrow. Young red cells called reticulocytes enter circulation and mature as oxygen-carrying capacity recovers. Thrombopoietin supports megakaryocyte development, while colony-stimulating factors and interleukins regulate white cell production. Several counts can fall together if the marrow stem cell population is damaged.'
      ],
      activity('Follow the altitude response', 'After several days at altitude, a student produces more circulating reticulocytes. Reconstruct the feedback loop.', [
        ['Identify the stimulus', 'Lower oxygen availability at altitude reduces oxygen reaching the tissue that senses it in the kidney.'],
        ['Connect the organs', 'The kidney releases EPO into the circulation. Erythroid precursors in red marrow respond.'],
        ['Close the loop', 'More reticulocytes mature into erythrocytes. Improved oxygen delivery decreases the stimulus for EPO secretion.']
      ]),
      [
        question('Poor oxygen delivery to otherwise functioning kidneys should first increase which circulating signal?', ['Fibrinogen', 'Thrombopoietin', 'Albumin', 'Erythropoietin'], 3, 'Renal oxygen sensing adjusts EPO secretion. A measurable rise in mature red cells takes longer.'),
        question('Which pair shares a myeloid precursor in the introductory lineage model?', ['B cell and T cell', 'Neutrophil and erythrocyte', 'Natural killer cell and erythrocyte', 'B cell and megakaryocyte'], 1, 'Both neutrophils and erythrocytes descend from the myeloid branch. B, T and natural killer cells are lymphoid.'),
        question('A signal increases megakaryocyte maturation. Which measurement should rise most directly?', ['Platelet count', 'Hematocrit', 'Plasma antibody concentration', 'T-cell count'], 0, 'Megakaryocytes release fragments of their cytoplasm into the blood as platelets.')
      ]),
    section('18.3', 'Erythrocytes',
      ['Relate red cell shape and hemoglobin structure to oxygen transport.', 'Follow iron and the remainder of heme after a red cell is cleared.'],
      [
        'A red cell must deliver oxygen even through vessels narrower than its resting diameter. Its flexible membrane can deform, and its biconcave shape keeps diffusion distances short. A mature human erythrocyte lacks a nucleus and mitochondria, leaving space for hemoglobin and allowing it to generate ATP by glycolysis without consuming its oxygen cargo. Each hemoglobin molecule has four globin chains, each holding one heme with an iron ion that can reversibly bind one oxygen molecule.',
        'Oxygen loading is favored in the lungs and unloading in oxygen-consuming tissue. Some carbon dioxide attaches to globin, while most travels as bicarbonate after reactions accelerated inside red cells. After roughly 120 days, macrophages clear aging cells. Globin supplies reusable amino acids, transferrin carries recovered iron, and the remainder of heme becomes bilirubin for processing by the liver. Low hemoglobin can reduce oxygen content even when a high fraction of the available binding sites is occupied.'
      ],
      activity('Account for an oxygen shipment', 'Compare two equal volumes of blood. Both have fully occupied oxygen-binding sites, but one contains half as much hemoglobin.', [
        ['Count the seats', 'Four iron-containing hemes give each hemoglobin molecule up to four oxygen-binding sites.'],
        ['Compare the loads', 'With half the molecules and equally full sites, the second sample carries about half as much hemoglobin-bound oxygen.'],
        ['Follow a retired carrier', 'Macrophages recover iron for reuse. The rest of the heme ring takes a separate route through bilirubin and bile.']
      ]),
      [
        question('One hemoglobin molecule has four functional heme groups. How many oxygen molecules can it bind at once?', ['One', 'Two', 'Four', 'Eight'], 2, 'Each heme iron binds one oxygen molecule, giving four sites per hemoglobin.'),
        question('Two samples have equal oxygen saturation. Sample B has half the hemoglobin concentration. Which comparison follows?', ['B carries twice as much oxygen on hemoglobin', 'B has the same hemoglobin-bound oxygen content', 'B has no oxygen dissolved in plasma', 'B carries about half as much oxygen on hemoglobin'], 3, 'Saturation gives the fraction of occupied sites. Fewer total sites mean less bound oxygen per unit volume.'),
        question('Which material can travel on transferrin from macrophages to developing red cells?', ['Bilirubin', 'Iron', 'Globin chains', 'Carbon dioxide'], 1, 'Transferrin transports iron in plasma for storage or new heme synthesis.')
      ]),
    section('18.4', 'Leukocytes and Platelets',
      ['Use cell features and behavior to distinguish leukocyte populations.', 'Explain how platelets and white cells reach different targets.'],
      [
        'A differential count separates white cells into populations with different jobs. Neutrophils have multilobed nuclei and rapidly ingest microbes. Eosinophils have conspicuous granules and release substances active against parasites. Basophils release inflammatory mediators including histamine. These three are granulocytes. A monocyte can enter tissue and develop into a macrophage. Lymphocytes include antibody-producing B-cell descendants, T cells involved in cellular immunity, and natural killer cells that attack abnormal cells.',
        'White cells circulate to reach tissues. At an inflamed site they can adhere to endothelium, squeeze between its cells (diapedesis), and move up a chemical gradient (chemotaxis). Platelets take another route to their target. These small, nucleus-free fragments circulate until an injured vessel exposes adhesive surfaces. They attach there, release signals and recruit additional platelets to form a temporary plug.',
        'Leukemia starts in blood-forming tissue. Abnormal cells can crowd out production of mature red cells, platelets and effective white cells. Lymphoma typically presents in lymphoid tissue, although cells may also reach blood or marrow. These categories can overlap. The smear practical uses healthy specimens to teach cell recognition. A single white cell, its shape or an elevated count alone cannot establish a diagnosis.'
      ],
      activity('Identify three visitors to a wound', 'Assign a different circulating component to each observation at an injured vessel.', [
        ['An early microbe-eater', 'A cell with a segmented nucleus engulfs bacteria. These clues point to a neutrophil.'],
        ['A future tissue macrophage', 'A large circulating leukocyte with an indented nucleus leaves the vessel and matures in tissue. This is a monocyte.'],
        ['A fragment at the tear', 'A small anucleate fragment adheres and recruits its neighbors. This is a platelet.']
      ]),
      [
        question('Which leukocyte is the best match for a multilobed nucleus and rapid phagocytosis of bacteria?', ['Neutrophil', 'Eosinophil', 'Basophil', 'B lymphocyte'], 0, 'Segmented nuclei and early bacterial phagocytosis are characteristic of neutrophils.'),
        question('A leukocyte squeezes between endothelial cells and then follows an attractant toward microbes. Which sequence occurred?', ['Chemotaxis then clot retraction', 'Diapedesis then coagulation', 'Diapedesis then chemotaxis', 'Agglutination then diapedesis'], 2, 'Crossing the vessel wall is diapedesis. Directed migration in response to a chemical gradient is chemotaxis.'),
        question('A circulating cell enters tissue and becomes a macrophage. Which was its circulating form?', ['Platelet', 'Monocyte', 'Eosinophil', 'Reticulocyte'], 1, 'A circulating monocyte can differentiate into a phagocytic macrophage after entering tissue.')
      ]),
    section('18.5', 'Hemostasis',
      ['Distinguish the temporary platelet plug from the stabilizing fibrin network.', 'Explain how a clot is strengthened and later removed.'],
      [
        'When a vessel tears, local smooth muscle contracts and slows blood loss. Exposure of subendothelial collagen and von Willebrand factor promotes platelet adhesion. Adherent platelets activate, change shape and release signals that attract more platelets. This local positive feedback builds a plug quickly. The healthy endothelium around the tear helps confine the response.',
        'Coagulation reinforces the plug. Tissue factor at injury and the intrinsic pathway can feed into activation of factor X. The common pathway generates thrombin, which cleaves soluble fibrinogen into fibrin. Cross-linked fibrin traps cells and holds the plug together while the vessel repairs. Platelets contract to retract the clot. Later, plasmin cleaves fibrin during fibrinolysis. A clot fixed to the vessel wall is a thrombus. A piece that detaches and travels is a thromboembolus.'
      ],
      activity('Test the repair sequence', 'A small tear attracts platelets normally, but little stable fibrin forms. Locate the failed step.', [
        ['Look for the early response', 'Vasoconstriction limits flow and platelets accumulate, so an initial barrier can still appear.'],
        ['Find the missing material', 'Thrombin normally acts on fibrinogen. Reduced thrombin activity leaves the platelet plug with fewer supporting fibrin strands.'],
        ['Distinguish repair from removal', 'Once the tissue heals, plasmin breaks down the network. This later process is fibrinolysis.']
      ]),
      [
        question('Platelets adhere normally but thrombin activity is greatly reduced. Which event is most directly impaired?', ['Vascular smooth muscle contraction', 'Platelet production in marrow', 'Collagen exposure at the tear', 'Conversion of fibrinogen into fibrin'], 3, 'Thrombin cleaves fibrinogen. The resulting fibrin helps stabilize the platelet plug.'),
        question('Which event provides positive feedback during plug formation?', ['Plasmin breaks up fibrin', 'Activated platelets recruit additional platelets', 'Intact endothelium discourages platelet adhesion', 'A repaired vessel resumes normal flow'], 1, 'Each newly activated platelet can release signals that activate additional platelets at the injury.'),
        question('Which enzyme directly breaks down fibrin as an injured vessel heals?', ['Thrombin', 'Factor X', 'Plasmin', 'Thrombopoietin'], 2, 'Plasmin cleaves the fibrin strands during fibrinolysis.')
      ]),
    section('18.6', 'Blood Typing',
      ['Read forward-typing reactions for A, B and Rh D antigens.', 'Predict which ABO antigens and antibodies meet when red cells or plasma are exchanged.'],
      [
        'A forward-typing well asks whether a particular antigen is present on the red cells. A reagent antibody links cells bearing its matching antigen, producing visible clumps called agglutination. A reaction with anti-A alone among the two ABO reagents identifies group A. Reactions with both identify AB, and a smooth suspension in both indicates O. Read anti-D separately to assign Rh positive or negative in this model.',
        'For packed red cells, compare donor cell antigens with antibodies in recipient plasma. Group O cells carry neither A nor B, so recipient anti-A and anti-B lack targets. For plasma, reverse the direction of the comparison. Donor plasma antibodies can attack recipient cells. Group AB plasma ordinarily lacks both anti-A and anti-B. Other blood group antigens and laboratory compatibility testing matter in actual transfusion practice.',
        'An Rh-negative person can develop anti-D after exposure to D-positive cells during pregnancy or transfusion. In a sensitized pregnant person, anti-D IgG can cross the placenta and destroy D-positive fetal cells. This is a different timing pattern from the ABO antibodies usually present by later infancy.'
      ],
      activity('Match the component', 'A group A recipient has A antigens on red cells and usually has anti-B in plasma. Predict two different donor matches using ABO alone.', [
        ['Try group O packed cells', 'The recipient’s anti-B finds no B antigen on group O cells, so this donor fits the ABO red cell rule.'],
        ['Try group O plasma', 'Group O donor plasma usually carries anti-A. It can recognize the recipient’s A cells.'],
        ['Try group AB plasma', 'The donor plasma lacks both usual ABO antibodies, so it fits the ABO plasma rule for this recipient.']
      ]),
      [
        question('A sample clumps with anti-B and anti-D but stays smooth with anti-A. What is its type?', ['B positive', 'A positive', 'B negative', 'AB positive'], 0, 'Clumping shows B and D antigens. The smooth anti-A well indicates that A antigen is absent.'),
        question('Considering ABO alone, which donor plasma fits a recipient with AB red cells?', ['O only', 'A or O', 'B or O', 'AB only'], 3, 'AB cells carry both targets. AB donor plasma ordinarily contains neither anti-A nor anti-B.'),
        question('Why does a first exposure to D-positive red cells matter to an Rh-negative individual?', ['It removes A and B antigens from their cells', 'It may stimulate production of anti-D antibodies', 'It automatically changes their inherited Rh type', 'It produces the usual naturally occurring anti-A'], 1, 'An immune response to an unfamiliar D antigen can sensitize the person and affect future exposures.')
      ])
  ]
};

const heart = {
  id: 19, title: 'The Cardiovascular System: The Heart',
  summary: 'Trace blood through the pump, connect its electrical signal to its valves and pressure waves, and calculate output per minute.',
  sections: [
    section('19.1', 'Heart Anatomy',
      ['Trace blood through each chamber, valve and great vessel.', 'Relate the structure of the ventricular walls, valve supports and coronary vessels to their jobs.'],
      [
        'The heart lies in the mediastinum between the lungs, with its apex directed inferiorly and to the left. The fibrous pericardium helps anchor it. Two serous surfaces and a film of fluid allow it to move with little friction. From outside inward, its wall contains epicardium, contractile myocardium and endocardium. The left ventricular myocardium is the thickest because it develops pressure for the systemic circuit.',
        'Blood from the venae cavae and coronary sinus enters the right atrium, crosses the tricuspid valve, and leaves the right ventricle through the pulmonary valve and pulmonary trunk. Pulmonary veins bring blood from the lungs to the left atrium. From there it crosses the mitral valve and leaves the left ventricle through the aortic valve. During ventricular contraction, papillary muscles tighten chordae tendineae to prevent the atrioventricular valve cusps from prolapsing.',
        'The myocardium needs its own blood supply. The right and left coronary arteries arise at the aortic root. Their branches run along the surface and penetrate the muscle. Much of the venous return from the muscle enters the coronary sinus and then the right atrium. Blood in the left ventricular cavity cannot diffuse far enough to nourish its thick wall.'
      ],
      activity('Trace a red cell from the foot to the aorta', 'Name a valve each time the red cell crosses one. Identify the one capillary network on this route.', [
        ['Return to the right heart', 'Venous blood from the foot reaches the inferior vena cava, right atrium, tricuspid valve and right ventricle.'],
        ['Exchange at the lungs', 'The cell passes the pulmonary valve, pulmonary trunk and pulmonary arteries to lung capillaries, then returns through pulmonary veins.'],
        ['Enter the systemic pump', 'From the left atrium the route crosses the mitral valve, left ventricle and aortic valve to the aorta.']
      ]),
      [
        question('A red cell has just passed through the mitral valve. Which structure will it reach immediately?', ['Pulmonary trunk', 'Right ventricle', 'Left ventricle', 'Aortic arch'], 2, 'The mitral valve guards the opening between the left atrium and the left ventricle.'),
        question('A chord attached to a mitral cusp ruptures. Which event is most directly affected?', ['Restraint of the cusp during ventricular systole', 'Opening of the pulmonary valve during ejection', 'Initiation of an impulse in the SA node', 'Filling of the coronary sinus from cardiac veins'], 0, 'Chordae transmit papillary muscle tension to prevent a cusp from bulging backward into the atrium.'),
        question('Blood from the myocardium has reached the coronary sinus. Where does it go next?', ['Left atrium', 'Pulmonary artery', 'Ascending aorta', 'Right atrium'], 3, 'The coronary sinus opens directly into the right atrium.')
      ]),
    section('19.2', 'Cardiac Muscle and Electrical Activity',
      ['Trace excitation from the SA node to the ventricular walls.', 'Link distinctive action potential phases and ECG waves to the cells involved.'],
      [
        'Intercalated discs join branching cardiac muscle cells. Desmosomes resist mechanical separation and gap junctions pass current to neighboring cells. Pacemaker cells in the sinoatrial (SA) node gradually depolarize between beats. In nodal cells, inward currents bring the membrane to threshold, calcium entry drives the upstroke and potassium exit repolarizes it. In ventricular contractile cells, a fast sodium upstroke is followed by a calcium-supported plateau. The long refractory period allows the muscle to relax between beats.',
        'An impulse spreads through the atria and pauses briefly at the atrioventricular (AV) node, giving the atria time to empty. The AV bundle, right and left bundle branches and Purkinje fibers then distribute excitation through the ventricles. The surface ECG records the summed electrical activity. P reflects atrial depolarization, QRS ventricular depolarization, and T ventricular repolarization. Atrial repolarization is usually obscured by QRS. Mechanical force develops after electrical activation.'
      ],
      activity('Read the electrical handoff', 'Follow one impulse and identify what a longer delay in the AV node would change.', [
        ['Find the first wave', 'The SA node initiates the impulse. Its spread through atrial muscle produces the P wave.'],
        ['Locate the delay', 'Slower passage from atria to ventricles lengthens the time from the beginning of P to the beginning of QRS.'],
        ['Follow ventricular recovery', 'The conduction network helps rapidly activate the ventricular muscle, producing QRS. The later T wave marks ventricular repolarization.']
      ]),
      [
        question('What is the expected direct electrical effect of slower conduction through the AV node with every impulse still conducted?', ['A missing T wave', 'A longer PR interval', 'A second P wave in each beat', 'A larger aortic pressure notch'], 1, 'AV nodal delay contributes to the interval between the onset of atrial and ventricular depolarization.'),
        question('Which feature of a ventricular contractile cell helps prevent sustained tetanic contraction?', ['A short calcium-free action potential', 'The absence of gap junctions', 'Automatic firing from its own SA node', 'A plateau and prolonged refractory period'], 3, 'The sustained action potential keeps the cell refractory through much of its contraction.'),
        question('Which ECG event reflects ventricular electrical recovery?', ['P wave', 'QRS complex', 'T wave', 'PR segment'], 2, 'The T wave represents ventricular repolarization.')
      ]),
    section('19.3', 'Cardiac Cycle',
      ['Infer valve positions from pressure differences.', 'Align ECG events, pressure changes, heart sounds and volume through one heartbeat.'],
      [
        'Consider the left side during filling. Atrial pressure exceeds ventricular pressure, so the mitral valve opens. Most filling is passive. Atrial contraction after the P wave adds the last portion, bringing the ventricle to end-diastolic volume. QRS precedes the large rise in ventricular pressure. As ventricular pressure exceeds atrial pressure, the mitral valve closes. Closure of the atrioventricular valves is associated with the first heart sound, S1. All valves are briefly shut while pressure rises at constant ventricular volume.',
        'When left ventricular pressure exceeds aortic pressure, the aortic valve opens and volume falls during ejection. After ventricular repolarization, pressure declines. As the gradient reverses, the aortic valve closes. Semilunar closure is associated with S2 and produces a brief dip and rebound, the dicrotic notch, on the aortic pressure tracing. During isovolumetric relaxation, all valves are closed and volume stays at its end-systolic value. The mitral valve reopens when ventricular pressure falls below atrial pressure.'
      ],
      activity('Solve the valve positions', 'The left ventricle contains 120 mL, its pressure is rising, and both valves on its side are shut. What just happened, and what comes next?', [
        ['Name the phase', 'A full ventricle developing pressure with both valves closed is in isovolumetric contraction.'],
        ['Look backward', 'Mitral closure followed the rise of ventricular pressure above atrial pressure and contributed to S1.'],
        ['Look ahead', 'Once ventricular pressure overtakes aortic pressure, the aortic valve opens and volume starts to fall.']
      ]),
      [
        question('Pressure is falling rapidly while left ventricular volume holds at its lowest value. Which valves are open on the left?', ['Mitral only', 'Aortic only', 'Both', 'Neither'], 3, 'During isovolumetric relaxation both valves are closed. Filling begins when the mitral valve opens.'),
        question('Where would you identify the dicrotic notch, and what does it mark?', ['On the aortic pressure trace at aortic valve closure', 'On the ECG at atrial depolarization', 'On the ventricular volume trace at mitral opening', 'On the ECG during ventricular repolarization'], 0, 'Aortic valve closure and elastic recoil produce a brief pressure disturbance in the aorta.'),
        question('Which event begins when left ventricular pressure rises above aortic pressure?', ['Passive ventricular filling', 'Ventricular ejection', 'Isovolumetric relaxation', 'Atrial systole'], 1, 'The forward pressure gradient opens the aortic valve, allowing blood to leave the ventricle.')
      ]),
    section('19.4', 'Cardiac Physiology',
      ['Calculate stroke volume, cardiac output and ejection fraction.', 'Predict how preload, contractility and afterload change the volume ejected.'],
      [
        'Stroke volume (SV) is the amount one ventricle ejects in a beat. Subtract end-systolic volume (ESV, what remains) from end-diastolic volume (EDV, what was present before ejection). Ejection fraction is SV divided by EDV. Cardiac output equals heart rate times stroke volume. A pump delivering 70 mL per beat at 75 beats per minute supplies 5.25 L/min. The two ventricles normally deliver the same average flow in series.',
        'Preload describes ventricular stretch before contraction. With other conditions fixed, a rise in venous return stretches fibers and increases force via the Frank–Starling mechanism. Increased contractility develops more force at a given preload and generally lowers ESV. Higher afterload, the load a ventricle ejects against, can leave more blood behind. Sympathetic stimulation raises rate and contractility. Vagal input slows nodal firing. A very high rate can shorten filling enough to limit stroke volume.'
      ],
      activity('Account for each milliliter', 'A ventricle fills to 130 mL, ends systole at 50 mL, and beats 75 times per minute.', [
        ['Find stroke volume', '130 − 50 = 80 mL/beat. This is the amount leaving one ventricle per beat.'],
        ['Find output', '80 mL/beat × 75 beats/min gives 6,000 mL/min, or 6 L/min.'],
        ['Increase the load', 'If EDV and heart rate hold but ESV rises to 70 mL, stroke volume falls to 60 mL and output to 4.5 L/min.']
      ]),
      [
        question('At 80 beats/min, EDV is 125 mL and ESV is 50 mL. What is the output of one ventricle?', ['4.0 L/min', '10.0 L/min', '6.0 L/min', '14.0 L/min'], 2, 'SV is 75 mL. Multiplying by 80 gives 6,000 mL/min, or 6.0 L/min.'),
        question('With preload and afterload fixed, increased contractility should produce which immediate change?', ['Lower ESV and higher SV', 'Higher ESV and lower SV', 'Higher ESV and unchanged SV', 'Lower EDV and unchanged ESV'], 0, 'Stronger contraction ejects more of the starting volume, leaving less in the ventricle.'),
        question('A ventricle begins with 120 mL and ejects 72 mL. What is its ejection fraction?', ['40%', '48%', '72%', '60%'], 3, 'Ejection fraction is the proportion ejected, 72 ÷ 120 = 0.60.')
      ]),
    section('19.5', 'Development of the Heart',
      ['Order tube formation, looping and septation.', 'Distinguish a normal fetal opening from an incomplete ventricular partition.'],
      [
        'In the third week of embryonic development, mesoderm in the cardiogenic region forms paired endocardial tubes. Folding brings the tubes together to form a single tube, which begins beating around day 22. The inflow end includes the sinus venosus and primitive atrium. Blood then reaches the primitive ventricle, bulbus cordis and truncus arteriosus. As the tube lengthens and loops, its regions shift toward their adult relationships.',
        'Partitions separate the common atrial region, ventricular region and outflow tract. Endocardial cushions help divide the atrioventricular canal. The developing outflow septum separates the aortic and pulmonary channels. A persistent ventricular septal defect leaves an opening between the ventricles. In contrast, an opening between fetal atria, the foramen ovale, normally directs blood toward the left atrium before the lungs take over gas exchange.'
      ],
      activity('Reconstruct a developing pump', 'Place a beating tube, a looped tube and a partitioned heart in developmental order.', [
        ['Build the tube', 'Paired endocardial tubes come together, creating a single early pump with an inflow end and an outflow end.'],
        ['Reposition the regions', 'Looping brings future atrial and ventricular regions into their characteristic spatial arrangement.'],
        ['Divide the streams', 'Septa and cushions separate the chambers and outlets. The fetal atrial opening stays available for a normal right-to-left pathway.']
      ]),
      [
        question('Which event establishes a single early heart tube?', ['Closure of the foramen ovale', 'Fusion of the paired endocardial tubes', 'Closure of the interventricular foramen', 'Separation of the aorta and pulmonary trunk'], 1, 'Folding brings the paired structures together before looping and much of septation.'),
        question('A defect specifically prevents the embryonic outflow tract from separating. Which adult vessels normally arise from that division?', ['Aorta and pulmonary trunk', 'Superior and inferior venae cavae', 'Right and left pulmonary veins', 'Coronary sinus and superior vena cava'], 0, 'The outflow region normally partitions into separate aortic and pulmonary outlets.'),
        question('Which communication normally permits flow between the fetal atria?', ['Ductus venosus', 'Interventricular defect', 'Foramen ovale', 'Ductus arteriosus'], 2, 'The foramen ovale permits a fetal right-to-left atrial pathway before pulmonary circulation expands.')
      ])
  ]
};

const vessels = {
  id: 20, title: 'The Cardiovascular System: Blood Vessels and Circulation',
  summary: 'Connect vessel structure to resistance and exchange, follow regional blood routes, and trace the shortcuts used before birth.',
  sections: [
    section('20.1', 'Structure and Function of Blood Vessels',
      ['Identify a vessel from its wall and lumen.', 'Explain how arterioles, capillaries and veins perform different jobs in a circuit.'],
      [
        'Arteries carry blood away from the heart and veins return it. The intima faces the blood, the media contains smooth muscle and elastic tissue, and the externa anchors the vessel in surrounding tissue. The elastic lamellae of the aorta stretch with ejection and recoil during diastole. Muscular arteries distribute blood to regions. Contraction of arteriolar smooth muscle narrows the lumen and changes resistance to flow into a capillary bed.',
        'A capillary consists chiefly of endothelium and its basement membrane, giving solutes a short path to tissue. Continuous capillaries have a relatively uninterrupted lining. Fenestrated capillaries have pores suited to rapid exchange in sites such as the small intestine. Sinusoids in sites such as the liver have wider openings. Venules collect blood from the beds. Thin-walled, compliant veins can hold large volumes at low pressure. In many limb veins, valves help muscle contractions move blood toward the heart.'
      ],
      activity('Compare three vessel sections', 'Match a thick elastic wall, a thin exchange surface and a large collapsible lumen to their roles.', [
        ['Store pressure between beats', 'Elastic arteries accept part of the ejected volume and recoil as ventricular pressure falls.'],
        ['Shorten the exchange distance', 'A capillary has a thin endothelial wall without a muscular tunica media.'],
        ['Return blood uphill', 'Skeletal muscle squeezes a compliant limb vein. Competent valves favor flow toward the heart.']
      ]),
      [
        question('Which wall property allows the aorta to maintain forward flow between ejections?', ['One-way valves along its length', 'Elastic recoil of its stretched wall', 'Large gaps between endothelial cells', 'Repeated contraction of papillary muscles'], 1, 'Elastic tissue stores energy during ejection and releases it during diastole.'),
        question('A small vessel upstream of a capillary bed narrows when its smooth muscle contracts. Which vessel is it?', ['Venule', 'Sinusoid', 'Arteriole', 'Lymphatic capillary'], 2, 'Arterioles vary their resistance and thereby regulate inflow to downstream beds.'),
        question('Which feature specifically facilitates rapid water and small-solute exchange in an intestinal capillary?', ['Fenestrae in the endothelial lining', 'A thick tunica media', 'Large venous valves', 'Elastic lamellae in the tunica media'], 0, 'Fenestrations are small openings through the capillary endothelium that increase permeability.')
      ]),
    section('20.2', 'Blood Flow, Blood Pressure, and Resistance',
      ['Relate pressure difference, resistance and flow.', 'Use arterial pressures and a change in radius to make quantitative predictions.'],
      [
        'Flow is volume delivered per unit time. The driving force is the pressure difference between the ends of a vessel. Flow equals that difference divided by resistance. In the ideal model of steady laminar flow through a rigid cylindrical tube, resistance is proportional to viscosity and tube length and inversely proportional to radius to the fourth power. With everything else held constant, halving radius raises resistance sixteenfold. Living vessels are compliant, branch and receive pulsatile flow.',
        'The difference between systolic and diastolic pressure is pulse pressure. At ordinary resting rates, mean arterial pressure can be estimated as diastolic pressure plus one-third of pulse pressure. The greatest drop in systemic pressure occurs across resistance vessels. Blood velocity is low in the capillary network because its combined cross-sectional area is large. The pressure difference returning blood to the heart is small, so venous valves, skeletal muscle contraction and breathing assist return.'
      ],
      activity('Separate the gradient from the pressure', 'Two ideal tubes have equal resistance. One runs from 95 to 75 mm Hg, the other from 45 to 25 mm Hg.', [
        ['Subtract at both ends', 'The gradient is 20 mm Hg across each tube, so the model predicts equal flow.'],
        ['Narrow one tube', 'Halve its radius with the same pressures. Its resistance rises by 2⁴ = 16 and flow falls to one-sixteenth.'],
        ['Change only the driving force', 'Restoring the original radius and doubling the gradient doubles flow. Resistance stays the same.']
      ]),
      [
        question('At a fixed pressure difference, halving the radius of an ideal tube changes its flow to what fraction?', ['One-half', 'One-quarter', 'One-eighth', 'One-sixteenth'], 3, 'Flow is proportional to the fourth power of radius. (1/2)⁴ equals 1/16.'),
        question('At rest, arterial pressure is 120/75 mm Hg. What is the estimated mean arterial pressure?', ['90 mm Hg', '97.5 mm Hg', '45 mm Hg', '105 mm Hg'], 0, 'Pulse pressure is 45. Adding one-third of 45 to 75 gives about 90 mm Hg.'),
        question('Why is mean blood velocity low in systemic capillaries despite their small individual diameters?', ['Flow reverses in each capillary every beat', 'Their combined cross-sectional area is large', 'Capillary plasma lacks dissolved proteins', 'All systemic blood traverses one capillary at a time'], 1, 'Flow divides among many parallel capillaries. A large total area reduces average linear velocity.')
      ]),
    section('20.3', 'Capillary Exchange',
      ['Distinguish solute diffusion from fluid filtration.', 'Predict how capillary pressure, plasma proteins and lymph drainage influence tissue fluid.'],
      [
        'An oxygen molecule diffuses down its partial pressure gradient from systemic blood into active tissue. Carbon dioxide can diffuse in the other direction at the same time. Water-soluble solutes use pathways permitted by the particular capillary, and selected larger cargo can cross in vesicles. These exchanges can occur even when there is little net movement of water.',
        'Bulk flow moves water and accompanying small solutes together. Capillary hydrostatic pressure favors filtration into tissue. Plasma proteins provide an opposing colloid osmotic pressure across the vessel barrier. The classic textbook model illustrates how falling capillary pressure shifts the balance toward reabsorption. In many tissues at steady state, the endothelial surface layer helps sustain a small net filtration, and lymphatics return excess fluid and proteins. Elevated venous pressure, reduced plasma albumin or impaired lymph drainage can each increase tissue fluid through a different mechanism.'
      ],
      activity('Explain three routes to swelling', 'For each example, identify whether the primary change affects a pushing force, an osmotic force or a drainage route.', [
        ['Raised venous pressure', 'Pressure backs up into capillaries, increasing the hydrostatic force pushing fluid into tissue.'],
        ['Reduced plasma albumin', 'The plasma protein contribution to the inward osmotic force falls, favoring more fluid outside the vessel.'],
        ['Blocked lymphatic drainage', 'The return pathway loses capacity. Fluid and proteins that entered tissue can accumulate.']
      ]),
      [
        question('Which change directly increases the outward hydrostatic force at a systemic capillary?', ['A rise in plasma albumin', 'Lower capillary blood pressure', 'Higher capillary blood pressure', 'Faster lymphatic drainage'], 2, 'Higher pressure inside the capillary favors movement of fluid through the wall toward the interstitium.'),
        question('What primarily drives oxygen from systemic capillaries into exercising muscle?', ['The oxygen partial pressure gradient', 'A rise in lymphatic pressure', 'Contraction of the capillary tunica media', 'Movement of albumin into the muscle'], 0, 'Oxygen consumption in active tissue sustains a gradient for diffusion across the capillary wall.'),
        question('A limb swells after its lymphatic drainage is obstructed. Which process was directly reduced?', ['Delivery of erythrocytes to arterioles', 'Synthesis of plasma albumin', 'Diffusion of oxygen into red cells', 'Return of interstitial fluid and proteins'], 3, 'Lymphatic vessels collect filtered fluid and escaped proteins and return them to venous blood.')
      ]),
    section('20.4', 'Homeostatic Regulation of the Vascular System',
      ['Predict the baroreceptor response to a fall in arterial pressure.', 'Compare local flow control with neural and hormonal responses.'],
      [
        'Standing quickly lets gravity shift blood into dependent veins. Venous return, stroke volume and arterial pressure can fall transiently. Less stretch in the carotid sinus and aortic arch lowers baroreceptor firing to the medulla. The response increases sympathetic activity and reduces vagal slowing of the heart. Rate and contractility rise. Arteriolar constriction raises systemic resistance, and venous constriction helps restore venous return.',
        'Tissues can regulate their own supply. Accumulated metabolites in active muscle promote local dilation. A stretch-sensitive arteriole can constrict when pressure rises, helping steady its downstream flow. Over a longer interval, low renal perfusion activates the renin–angiotensin–aldosterone system. Angiotensin II constricts vessels and supports aldosterone release, which promotes sodium retention. Antidiuretic hormone favors water conservation. Atrial natriuretic peptide, released with atrial stretch, favors sodium and water loss.'
      ],
      activity('Defend perfusion after standing', 'Predict the direction of three changes in the first seconds after venous pooling lowers arterial pressure.', [
        ['At the sensor', 'Less arterial stretch reduces firing from baroreceptors in the carotid sinus and aortic arch.'],
        ['At the pump', 'Increased sympathetic input and withdrawal of vagal input tend to raise heart rate. Sympathetic input also raises ventricular contractility.'],
        ['At the vessels', 'Arteriolar constriction increases resistance. Venous constriction recruits blood from compliant veins and supports venous return.']
      ]),
      [
        question('A rapid fall in arterial pressure decreases carotid sinus stretch. Which immediate response is expected?', ['Increased baroreceptor firing and slower pulse', 'Decreased baroreceptor firing and greater sympathetic drive', 'Increased atrial natriuretic peptide and sodium loss', 'Decreased sympathetic drive and arteriolar dilation'], 1, 'Reduced baroreceptor input evokes compensatory sympathetic responses that support arterial pressure.'),
        question('During exercise, metabolites dilate the arterioles supplying an active muscle. What is this an example of?', ['Atrial natriuresis', 'The respiratory pump', 'Renal volume conservation', 'Local autoregulation'], 3, 'Signals generated within active tissue match its blood supply to its metabolic demand.'),
        question('Which substance promotes renal sodium retention during a response to low effective circulating volume?', ['Atrial natriuretic peptide', 'Plasmin', 'Aldosterone', 'Fibrinogen'], 2, 'Aldosterone increases renal sodium reabsorption, supporting extracellular fluid volume.')
      ]),
    section('20.5', 'Circulatory Pathways',
      ['Trace a red cell through pulmonary, systemic and hepatic portal beds.', 'Use major arterial branches and venous landmarks to reconstruct a regional route.'],
      [
        'Follow flow away from the left ventricle into the ascending aorta. The coronary arteries supply the heart before blood reaches the arch. The usual arch branches, in order, are the brachiocephalic trunk, left common carotid and left subclavian. The trunk divides into the right common carotid and right subclavian. In the upper limb, the subclavian continues as axillary, then brachial, before dividing into radial and ulnar arteries. The abdominal aorta divides into common iliac arteries. The external iliac continues as the femoral artery in the thigh.',
        'Most systemic venous return enters a vena cava. From the right atrium it passes through the right ventricle and pulmonary circuit to the left atrium. A portal route crosses two capillary beds before returning to the heart. Nutrient-rich blood from intestinal capillaries reaches the hepatic portal vein and then the liver sinusoids, where absorbed substances can be processed. Hepatic veins take blood from the liver to the inferior vena cava. The hepatic artery provides the liver with a second, oxygen-rich inflow.'
      ],
      activity('Track an absorbed sugar', 'An absorbed glucose molecule enters a small intestinal blood capillary. Trace its venous route if the liver does not remove it.', [
        ['Reach the portal vessel', 'Blood from much of the small intestine drains through the superior mesenteric vein into the hepatic portal vein.'],
        ['Cross a second bed', 'The portal vein delivers blood to liver sinusoids before it returns to the general circulation.'],
        ['Return to the heart', 'Hepatic veins drain the liver into the inferior vena cava, which empties into the right atrium.']
      ]),
      [
        question('Which route correctly takes venous blood from the intestine toward the right atrium?', ['Hepatic vein → portal vein → superior vena cava', 'Portal vein → hepatic artery → inferior vena cava', 'Portal vein → liver sinusoids → hepatic veins → inferior vena cava', 'Hepatic artery → sinusoids → portal vein → aorta'], 2, 'The portal vessel supplies a second exchange bed in the liver. Hepatic veins then drain that bed to the inferior vena cava.'),
        question('Which artery normally arises directly from the aortic arch to help supply the left upper limb?', ['Left subclavian', 'Right subclavian', 'Left brachial', 'Left axillary'], 0, 'The left subclavian is a direct arch branch and continues as the axillary artery at the first rib.'),
        question('Which vessel carries oxygenated blood from the lungs into the left atrium?', ['Pulmonary artery', 'Superior vena cava', 'Coronary sinus', 'Pulmonary vein'], 3, 'Pulmonary veins return blood from lung capillaries to the heart after gas exchange.')
      ]),
    section('20.6', 'Development of Blood Vessels and Fetal Circulation',
      ['Trace the fetal route from placenta to heart and back.', 'Explain how the three fetal shunts alter flow and why atrial flow changes at birth.'],
      [
        'In the embryo, clusters of mesodermal precursors form early vessels and blood cells. Assembly of vessels from precursors is vasculogenesis. Growth of branches from existing vessels is angiogenesis. During fetal life, the placenta exchanges gases, nutrients and wastes between separate maternal and fetal circulations. One umbilical vein carries relatively oxygen-rich blood toward the fetus. Two umbilical arteries return relatively oxygen-poor blood to the placenta.',
        'Some umbilical venous flow crosses the ductus venosus to reach the inferior vena cava, bypassing much of the liver circulation. In the right atrium, preferential streaming directs some of this blood through the foramen ovale to the left atrium, left ventricle and ascending aorta. Much of the right ventricular output entering the pulmonary trunk crosses the ductus arteriosus to the descending aorta. The fluid-filled lungs still receive some flow.',
        'With the first breaths, pulmonary vascular resistance falls and more blood returns from the lungs to the left atrium. Left atrial pressure rises relative to the right and presses the flap of the foramen ovale closed. Separation from the placenta stops umbilical flow. Rising oxygen and falling prostaglandin signaling favor ductus arteriosus constriction. Functional closure and later anatomical remodeling occur on different time scales.'
      ],
      activity('Choose the fetal shortcut', 'At each location, name the shunt and the destination on its far side.', [
        ['At the liver', 'Ductus venosus carries a portion of umbilical venous blood toward the inferior vena cava.'],
        ['Between the atria', 'Foramen ovale permits flow from the right atrium to the left atrium before birth.'],
        ['Beyond the right ventricle', 'Ductus arteriosus directs much of the flow in the pulmonary trunk toward the descending aorta.']
      ]),
      [
        question('Which fetal vessel returns relatively oxygen-rich blood from the placenta?', ['Umbilical artery', 'Umbilical vein', 'Pulmonary trunk', 'Superior vena cava'], 1, 'The single umbilical vein carries blood from the placenta toward the fetal liver and ductus venosus.'),
        question('Blood in the fetal pulmonary trunk bypasses most of the lung circulation through which pathway?', ['Foramen ovale to the left atrium', 'Ductus venosus to the inferior vena cava', 'Ductus arteriosus to the descending aorta', 'Umbilical vein to the portal vein'], 2, 'The ductus arteriosus connects the pulmonary outflow to the aorta and carries predominantly right-to-left flow before birth.'),
        question('After lung expansion, which pressure change favors functional closure of the foramen ovale?', ['Left atrial pressure exceeds right atrial pressure', 'Right atrial pressure exceeds left atrial pressure', 'Pulmonary vascular resistance rises sharply', 'Umbilical venous return abruptly increases'], 0, 'Increased pulmonary flow raises left atrial filling and pressure, pressing the atrial flap against the septum.')
      ])
  ]
};

export const chapters = [blood, heart, vessels];

const labCss = `<style>
.ap2-cardio-lab [hidden]{display:none!important}
.ap2-cardio-lab .ac-specimen .ac-row{align-items:end}.ac-specimen select{max-width:min(60vw,21em)}
.ap2-cardio-lab .ac-actions [aria-pressed=true]{border-color:#a8d4b8;background:#29443b;color:#f5fff9}
.ap2-cardio-lab {background:var(--panel,#172228);border:1px solid var(--line,#35464a);border-radius:14px;padding:clamp(16px,3vw,28px);color:var(--text,#f0eee4);margin:20px 0;min-width:0}
.ap2-cardio-lab * {box-sizing:border-box}
.ap2-cardio-lab h3 {margin:0 0 8px;font:400 clamp(24px,3.5vw,34px)/1.15 var(--serif,Georgia,serif);color:var(--text,#f0eee4)}
.ap2-cardio-lab h4 {font:600 15px/1.4 var(--sans,system-ui);margin:0 0 7px}
.ap2-cardio-lab p {font-size:14px;line-height:1.55;margin:6px 0 12px;color:var(--muted,#b5c6c6)}
.ap2-cardio-lab button,.ap2-cardio-lab select {min-height:44px;padding:8px 11px;font:inherit;border:1px solid var(--line,#44595a);border-radius:7px;background:var(--bg,#10191e);color:var(--text,#f0eee4)}
.ap2-cardio-lab button[aria-pressed="true"] {border-color:var(--mint,#b7ddc5);color:var(--mint,#b7ddc5)}
.ap2-cardio-lab .ac-row {display:flex;align-items:center;flex-wrap:wrap;gap:8px 16px;margin:14px 0}
.ap2-cardio-lab .ac-row label {display:flex;align-items:center;flex-wrap:wrap;gap:6px 10px}
.ap2-cardio-lab .ac-grid {display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,170px),1fr));gap:12px}
.ap2-cardio-lab figure {margin:14px 0;padding:0}
.ap2-cardio-lab svg {display:block;width:100%;height:auto}
.ap2-cardio-lab .ac-plot {background:#112329;border-radius:10px;padding:clamp(5px,1.5vw,12px)}
.ap2-cardio-lab .ac-plot svg text {font:12px var(--sans,system-ui);fill:#d4e2e0}
.ap2-cardio-lab .ac-stats {display:flex;flex-wrap:wrap;gap:9px 20px;margin:12px 0}
.ap2-cardio-lab .ac-stats span {display:grid;gap:2px;font-size:12px;color:var(--muted,#b5c6c6)}
.ap2-cardio-lab .ac-stats strong {font-size:16px;color:var(--text,#f0eee4)}
.ap2-cardio-lab .ac-wells {display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(5px,1.5vw,12px);margin:16px 0}
.ap2-cardio-lab .ac-well {display:grid;justify-items:center;align-content:start;gap:5px;min-width:0;text-align:center}
.ap2-cardio-lab .ac-well svg {max-width:120px}
.ap2-cardio-lab .ac-well small {font-size:12px;color:var(--muted,#b5c6c6)}
.ap2-cardio-lab .ac-hint {display:block;font-size:13px}
.ap2-cardio-lab .ac-note {margin:12px 0 0;padding:10px 12px;border-left:2px solid var(--mint,#bad9c5);font-size:14px}
.ap2-cardio-lab .ac-range {display:grid;gap:6px;margin:12px 0;min-width:0}
.ap2-cardio-lab .ac-range input {min-width:0;width:100%;margin:0;min-height:32px;accent-color:var(--mint,#bad9c5)}
.ap2-cardio-lab .ac-details {border-top:1px solid var(--line,#35464a);padding-top:14px;margin-top:15px}
.ap2-cardio-lab .ac-legend {display:flex;flex-wrap:wrap;align-items:center;gap:4px 15px;font-size:12px;margin:8px 0}
.ap2-cardio-lab .ac-legend i {display:inline-block;width:20px;vertical-align:middle;margin-right:5px;border-top:3px solid}
.ap2-cardio-lab .ac-actions button {flex:0 1 auto}
@media(max-width:520px){.ap2-cardio-lab .ac-well{padding:6px 2px}.ap2-cardio-lab .ac-plot svg text{font-size:14px}.ap2-cardio-lab .ac-actions{gap:7px}.ap2-cardio-lab .ac-actions button{font-size:12px}}
</style>`;

const samples = ['B−', 'O+', 'AB−', 'A+', 'B+', 'O−', 'AB+', 'A−'];
const types = ['O−', 'O+', 'A−', 'A+', 'B−', 'B+', 'AB−', 'AB+'];
const reagents = ['A', 'B', 'D'];

function renderTyping() {
  return `<h3>Type an unknown blood sample</h3>
    <p>Select each well to mix the simulated red cells with its reagent. Clumps mean the corresponding antigen is present. Read all three wells before identifying the sample.</p>
    <div class="ac-row"><strong data-specimen></strong><button type="button" data-next-sample>Next sample</button></div>
    <div class="ac-wells">${reagents.map((name, i) => `<button type="button" class="ac-well" data-well="${i}"><strong>Anti-${name}</strong><svg viewBox="0 0 100 100" aria-hidden="true"></svg><small></small></button>`).join('')}</div>
    <div class="ac-row"><label>Your blood type <select data-guess><option value="">Choose a type</option>${types.map(t => `<option>${t}</option>`).join('')}</select></label>
    <button type="button" data-check>Check type</button></div><p class="ac-note" role="status" data-typing-result></p>
    <div class="ac-details" data-components hidden><h4>Test an ABO component match</h4>
    <p>Keep the typed sample as recipient. Choose a donor ABO group and a component. This comparison considers only A and B.</p>
    <div class="ac-row"><label>Donor group <select data-donor>${['O','A','B','AB'].map(t => `<option>${t}</option>`).join('')}</select></label>
    <label>Component <select data-component><option value="cells">Packed red cells</option><option value="plasma">Plasma</option></select></label></div>
    <p class="ac-note" role="status" data-match></p>
    <a href="https://www.blood.ca/en/hospital-services/inventory-ordering/ordering/compatibility-and-substitutions" target="_blank" rel="noopener noreferrer">Canadian Blood Services ABO compatibility table</a></div>`;
}

function wellPicture(tested, clumped) {
  const background = tested ? '#f5c0aa' : '#e0dac9';
  let marks = '';
  if (tested && clumped) {
    for (const [x, y] of [[32,34],[62,34],[43,60],[67,62]]) {
      for (const [dx, dy] of [[-5,-3],[1,-6],[5,0],[-2,2],[1,7],[-6,4]]) {
        marks += `<circle cx="${x+dx}" cy="${y+dy}" r="4.1" fill="#9a3544" stroke="#7d2938" stroke-width=".7"/>`;
      }
    }
  } else if (tested) {
    for (let row = 0; row < 7; row++) {
      for (let column = 0; column < 7; column++) {
        const x = 23 + column * 8.5 + (row % 2) * 3;
        const y = 24 + row * 8.4;
        if (Math.hypot(x - 50, y - 50) < 29) marks += `<circle cx="${x}" cy="${y}" r="1.8" fill="#a64b57"/>`;
      }
    }
  }
  return `<circle cx="50" cy="50" r="46" fill="#243d41" stroke="#718688" stroke-width="1.5"/>
    <circle cx="50" cy="50" r="37" fill="${background}" stroke="#f7eed8" stroke-width="2"/>
    ${marks}<path d="M23 39 Q25 26 39 22" fill="none" stroke="#fff" stroke-opacity=".65" stroke-width="2.5"/>`;
}

function mountTyping(lab) {
  const wells = [...lab.querySelectorAll('[data-well]')];
  const guess = lab.querySelector('[data-guess]');
  const check = lab.querySelector('[data-check]');
  const result = lab.querySelector('[data-typing-result]');
  const components = lab.querySelector('[data-components]');
  const donor = lab.querySelector('[data-donor]');
  const component = lab.querySelector('[data-component]');
  let specimen = 0;
  const tested = new Set();
  function reacts(index) {
    const type = samples[specimen];
    return index === 2 ? type.endsWith('+') : type.includes(reagents[index]);
  }
  function refresh() {
    lab.querySelector('[data-specimen]').textContent = `Sample ${specimen + 1} of ${samples.length}`;
    wells.forEach((well, index) => {
      const mixed = tested.has(index);
      const reading = mixed ? (reacts(index) ? 'Clumped' : 'Smooth') : 'Add reagent';
      well.querySelector('svg').innerHTML = wellPicture(mixed, reacts(index));
      well.querySelector('small').textContent = reading;
      well.setAttribute('aria-label', `Anti-${reagents[index]}. ${reading}.`);
      well.setAttribute('aria-pressed', String(mixed));
    });
    check.disabled = tested.size < 3 || !guess.value;
  }
  function match() {
    const recipient = samples[specimen].slice(0,-1);
    const cells = component.value === 'cells';
    const antigenGroup = cells ? donor.value : recipient;
    const antibodyGroup = cells ? recipient : donor.value;
    const present = reagents.slice(0,2).filter(antigen => antigenGroup.includes(antigen));
    const antibodies = reagents.slice(0,2).filter(antigen => !antibodyGroup.includes(antigen));
    const conflict = present.filter(antigen => antibodies.includes(antigen));
    const cellSource = cells ? 'donor cells' : 'recipient cells';
    const plasmaSource = cells ? 'recipient plasma' : 'donor plasma';
    const finding = conflict.length
      ? `${conflict.map(a => `Anti-${a} in ${plasmaSource} binds ${a} on ${cellSource}`).join('. ')}.`
      : `The ${plasmaSource} contains ${antibodies.length ? antibodies.map(a => 'anti-' + a).join(' and ') : 'neither anti-A nor anti-B'}. The ${cellSource} carry ${present.length ? present.join(' and ') + ' antigen' + (present.length === 2 ? 's' : '') : 'neither A nor B antigen'}.`;
    lab.querySelector('[data-match]').textContent = `Group ${donor.value} ${cells ? 'red cells' : 'plasma'} to group ${recipient}: ABO-${conflict.length ? 'incompatible' : 'compatible'}. ${finding}`;
  }
  wells.forEach((well, i) => well.addEventListener('click', () => {
    if (tested.has(i)) return;
    tested.add(i);
    refresh();
    result.textContent = tested.size === 3 ? 'All wells are ready. Choose your interpretation.' : `${tested.size} of 3 wells read.`;
  }));
  guess.addEventListener('change', () => {
    refresh();
    components.hidden = true;
    result.textContent = tested.size === 3 ? 'Check your interpretation against the three wells.' : 'Mix all three reagents to identify the sample.';
  });
  check.addEventListener('click', () => {
    const correct = guess.value === samples[specimen];
    result.textContent = correct
      ? `Correct. This sample is ${samples[specimen]}. Anti-A ${reacts(0) ? 'clumped' : 'stayed smooth'}, anti-B ${reacts(1) ? 'clumped' : 'stayed smooth'}, and anti-D ${reacts(2) ? 'clumped' : 'stayed smooth'}.`
      : 'Recheck the ABO wells together, then use anti-D to choose positive or negative. A smooth well indicates that the tested antigen is absent.';
    components.hidden = !correct;
    if (correct) match();
  });
  donor.addEventListener('change', match);
  component.addEventListener('change', match);
  lab.querySelector('[data-next-sample]').addEventListener('click', () => {
    specimen = (specimen + 1) % samples.length;
    tested.clear();
    guess.value = '';
    components.hidden = true;
    result.textContent = 'New sample ready. Add each reagent.';
    refresh();
  });
  result.textContent = 'Three wells are ready for testing.';
  refresh();
}

const phases = [
  { start: 0, name: 'Passive filling', mitral: 'Open', aortic: 'Closed', note: 'Left atrial pressure exceeds ventricular pressure. Blood enters the relaxing ventricle.' },
  { start: 88, name: 'Atrial systole', mitral: 'Open', aortic: 'Closed', note: 'Atrial contraction follows the P wave and adds the final volume. Ventricular depolarization begins near the end of this phase.' },
  { start: 195, name: 'Isovolumetric contraction', mitral: 'Closed', aortic: 'Closed', note: 'AV valve closure marks S1. Ventricular pressure climbs rapidly with volume held at 120 mL.' },
  { start: 245, name: 'Ventricular ejection', mitral: 'Closed', aortic: 'Open', note: 'Left ventricular pressure drives blood into the aorta. Ventricular volume falls. The T wave occurs during late ejection.' },
  { start: 492, name: 'Isovolumetric relaxation', mitral: 'Closed', aortic: 'Closed', note: 'Semilunar closure marks S2. Find the notch on the solid aortic pressure trace. Ventricular volume holds at 50 mL.' },
  { start: 562, name: 'Ventricular filling resumes', mitral: 'Open', aortic: 'Closed', note: 'The mitral valve opens as ventricular pressure drops below atrial pressure. Blood flows into the ventricle again.' }
];

const chartX = t => 48 + t * .53;
const pressureY = v => 230 - v * .85;
const ecgY = v => 63 - v * 26;

function trace(points, y) {
  return points.map(([time, value], i) => `${i ? 'L' : 'M'}${chartX(time).toFixed(1)},${y(value).toFixed(1)}`).join(' ');
}

const volumeY = v => 299 - (v-50)*.52;

function views(labels) {
  return '<div class="ac-row ac-actions" aria-label="Choose a practical view">'+labels.map((label,i)=>`<button type="button" data-cardio-view="${i}" aria-pressed="${i===0}">${label}</button>`).join('')+'</div>';
}
function wireViews(root, onChange) {
  const buttons=root.querySelectorAll('[data-cardio-view]');
  for(const button of buttons)button.onclick=()=>{
    const view=button.dataset.cardioView;
    for(const b of buttons)b.setAttribute('aria-pressed',String(b===button));
    for(const panel of root.querySelectorAll('[data-cardio-panel]'))panel.hidden=panel.dataset.cardioPanel!==view;
    onChange?.(view);
  };
}
function rightHeartChart() {
  const y=p=>177-p*4.7;
  return `<h4>Right heart at the same instant</h4><p>Follow blood from the right atrium through the right ventricle into the pulmonary artery. Switch to the left-heart traces to compare pressures at the same instant.</p>
    <figure class="ac-plot"><svg viewBox="0 0 500 212" role="img" aria-label="Right atrial, right ventricular and pulmonary arterial pressure on a zero to thirty millimeter mercury scale.">
    <text x="8" y="18">Pressure (mm Hg)</text>${[0,10,20,30].map(v=>`<line x1="48" x2="472" y1="${y(v)}" y2="${y(v)}" stroke="#354b50"/><text x="37" y="${y(v)+4}" text-anchor="end">${v}</text>`).join('')}
    ${[[rightBeat.atrium,'#e6b9e1','2 3'],[rightBeat.ventricle,'#a8c8ea','7 3'],[rightBeat.pulmonary,'#f1ac81','']].map(([p,color,dash])=>`<path d="${trace(p,y)}" fill="none" stroke="${color}" stroke-width="3" stroke-dasharray="${dash}"/>`).join('')}
    <rect data-right-future x="472" y="21" width="0" height="159" fill="#192a30"/>
    <line data-right-cursor y1="30" y2="179" stroke="white" stroke-dasharray="2 3"/>
    ${[0,200,400,600,800].map(t=>`<text x="${chartX(t)}" y="202" text-anchor="middle">${(t/1000).toFixed(1)} s</text>`).join('')}</svg></figure>
    <p>Right atrium · dotted. Right ventricle · dashed. Pulmonary artery · solid.</p><div class="ac-stats"><span>RA / RV / PA<strong data-right-pressures></strong></span><span>Tricuspid valve<strong data-right-tricuspid></strong></span><span>Pulmonary valve<strong data-right-pulmonary></strong></span></div>`;
}
function renderHeartbeat() {
  return `<h3>Follow one heartbeat</h3><p>Play the beat or pause at a pressure crossing. Switch between the left heart, right heart and 3D valves to compare them at the same instant. One beat lasts 0.80 s at 75 beats/min. Playback slows it for study.</p>
    ${views(['Left heart traces','3D heart','2D valve motion','Right heart traces','Heart sounds'])}<div data-cardio-panel="0">
    <figure class="ac-plot"><svg viewBox="0 0 500 327" role="img" aria-label="A synchronized ECG, atrial, ventricular and aortic pressure, and left ventricular volume curves. A vertical cursor marks the selected time.">
    <text x="9" y="19">ECG</text>
    ${[[73,'P',33],[186,'QRS',23],[426,'T',34]].map(([time,name,y]) => `<text text-anchor="middle" x="${chartX(time)}" y="${y}">${name}</text>`).join('')}
    <line x1="48" y1="63" x2="472" y2="63" stroke="#334e53"/>
    <path d="${trace(beat.ecg,ecgY)}" fill="none" stroke="#bfe3cc" stroke-width="2.8"/>
    <text x="9" y="102">Pressure (mm Hg)</text>
    ${[0,40,80,120].map(v => `<line x1="48" x2="472" y1="${pressureY(v)}" y2="${pressureY(v)}" stroke="#354b50"/><text x="37" y="${pressureY(v)+4}" text-anchor="end">${v}</text>`).join('')}
    <path d="${trace(beat.atrium,pressureY)}" fill="none" stroke="#e6b9e1" stroke-width="3" stroke-dasharray="2 3"/>
    <path d="${trace(beat.aorta,pressureY)}" fill="none" stroke="#f1ac81" stroke-width="3"/>
    <path d="${trace(beat.ventricle,pressureY)}" fill="none" stroke="#a8c8ea" stroke-width="3" stroke-dasharray="7 3"/>
    <path d="M${chartX(501)},${pressureY(91)-3} l17,-27 h25" fill="none" stroke="#e4b092"/>
    <text x="${chartX(501)+25}" y="${pressureY(91)-36}">Notch</text>
    <text x="9" y="247">LV volume (mL)</text>${[50,120].map(v=>`<line x1="48" x2="472" y1="${volumeY(v)}" y2="${volumeY(v)}" stroke="#354b50"/><text x="37" y="${volumeY(v)+4}" text-anchor="end">${v}</text>`).join('')}
    <path d="${trace(beat.volume,volumeY)}" fill="none" stroke="#f1dc81" stroke-width="2.8"/>
    <rect data-future x="472" y="22" width="0" height="281" fill="#192a30"/>
    ${[0,200,400,600,800].map(t => `<text x="${chartX(t)}" y="320" text-anchor="middle">${(t/1000).toFixed(1)} s</text>`).join('')}
    <line data-cursor y1="26" y2="300" stroke="#fff4cf" stroke-width="1.5" stroke-dasharray="2 3"/>
    <circle data-la-point r="3.5" fill="#e6b9e1"/><circle data-vol-point r="3.5" fill="#f1dc81"/><circle data-ecg-point r="3.5" fill="#bfe3cc"/><circle data-ao-point r="3.5" fill="#f1ac81"/><circle data-lv-point r="3.5" fill="#a8c8ea"/>
    </svg></figure>
    <div class="ac-legend"><span><i style="border-color:#bfe3cc"></i>ECG (relative amplitude)</span><span><i style="border-color:#f1ac81"></i>Aorta</span><span><i style="border-color:#a8c8ea;border-top-style:dashed"></i>Left ventricle</span><span><i style="border-color:#e6b9e1;border-top-style:dotted"></i>Left atrium</span><span><i style="border-color:#f1dc81"></i>LV volume</span></div>
    </div><div data-cardio-panel="1" hidden>${renderSpecimen('heart',true)}</div><div data-cardio-panel="2" hidden>${renderValveWindow()}</div><div data-cardio-panel="3" hidden>${rightHeartChart()}</div>
    <div data-cardio-panel="4" hidden>${renderHeartSounds()}</div>
    <label class="ac-range">Beat time <strong data-time-out></strong><input type="range" min="0" max="800" step="1" value="0" data-beat-time></label>
    <div class="ac-row ac-actions"><button type="button" data-play>Play one beat</button><button type="button" data-rewind>Previous phase</button><label>Playback speed <select data-speed><option value="16">Slower</option><option value="8" selected>Study</option><option value="4">Faster</option></select></label><label>Jump to phase <select data-phase-select>${phases.map(p=>`<option value="${p.start}">${p.name}</option>`).join('')}</select></label></div>
    <div class="ac-details"><small data-phase-side>Left-heart phase</small><h4 data-phase></h4><p data-phase-note></p>
    <div class="ac-stats" data-left-stats><span>Mitral valve<strong data-mitral></strong></span><span>Aortic valve<strong data-aortic></strong></span><span>LV pressure<strong data-lv-pressure></strong></span><span>Aortic pressure<strong data-ao-pressure></strong></span><span>LA pressure<strong data-la-pressure></strong></span><span>LV volume<strong data-volume></strong></span></div></div>
    <div class="ac-actions ac-row"><button type="button" data-predict>Predict the next valve event</button></div>
    <div class="ac-details" data-probe hidden><p data-probe-prompt></p><div class="ac-actions ac-row">${valveChoices.map((label,i)=>`<button type="button" data-probe-choice="${i}">${label}</button>`).join('')}</div><p role="status" data-probe-note></p></div>`;
}

function mountHeartbeat(lab) {
  let modelMounted=false, activeView='0',currentPhases=phases;
  wireViews(lab,view=>{
    if(view!==activeView && (view==='4'||activeView==='4'))stop();
    if(activeView==='4' && view!=='4')sounds.mute();
    activeView=view;
    endProbe();
    currentPhases=view==='3'?rightPhases:phases;
    for(const el of [jump.closest('label'),get('phase').closest('.ac-details'),get('predict'),get('rewind')])el.hidden=view==='4';
    jump.replaceChildren(...currentPhases.map(p=>new Option(p.name,String(p.start))));
    get('phase-side').textContent=view==='3'?'Right-heart phase':'Left-heart phase';
    get('left-stats').hidden=view==='3';
    if(view==='1'&&!modelMounted){mountSpecimen(lab,'heart',true);modelMounted=true;}
    show(+time.value);
  });
  const get = name => lab.querySelector('[data-' + name + ']');
  const time = get('beat-time');
  const play = get('play');
  const sounds=mountHeartSounds(lab.querySelector('[data-cardio-panel="4"]'),time,stop);
  const jump = get('phase-select');
  const cursor = get('cursor');
  const points = [get('ecg-point'),get('ao-point'),get('lv-point'),get('la-point'),get('vol-point')];
  let frame = null;
  function show(t) {
    let phase = currentPhases[0];
    for (const candidate of currentPhases) {
      if (candidate.start > t) break;
      phase = candidate;
    }
    const state = {...pressureState(t),...rightPressureState(t)};
    get('right-cursor').setAttribute('x1',chartX(t));get('right-cursor').setAttribute('x2',chartX(t));
    get('right-pressures').textContent=[state.ra,state.rv,state.pa].map(n=>Math.round(n)).join(' / ')+' mm Hg';
    get('right-tricuspid').textContent=state.tricuspid?'Open':'Closed';get('right-pulmonary').textContent=state.pulmonary?'Open':'Closed';
    const {la,ao,lv} = state;
    paintValves(lab,state);
    lab.dispatchEvent(new CustomEvent('cardiobeat',{detail:{...state,t}}));
    const seconds = (t / 1000).toFixed(3) + ' s';
    time.value = String(t);
    time.setAttribute('aria-valuetext',activeView==='4'?seconds:seconds+', '+phase.name);
    if(activeView==='4')sounds.show(t);
    get('time-out').textContent = seconds;
    cursor.setAttribute('x1', chartX(t));
    cursor.setAttribute('x2', chartX(t));
    [ecgY(interpolate(beat.ecg,t)),pressureY(ao),pressureY(lv),pressureY(la),volumeY(state.volume)].forEach((y,i) => {
      points[i].setAttribute('cx', chartX(t));
      points[i].setAttribute('cy', y);
    });
    jump.value = String(phase.start);
    get('phase').textContent = phase.name;
    get('phase-note').textContent = phase.note;
    get('mitral').textContent = state.mitral ? 'Open' : 'Closed';
    get('aortic').textContent = state.aortic ? 'Open' : 'Closed';
    get('la-pressure').textContent = Math.round(la) + ' mm Hg';
    get('ao-pressure').textContent = Math.round(ao) + ' mm Hg';
    get('lv-pressure').textContent = Math.round(lv) + ' mm Hg';
    get('volume').textContent = Math.round(interpolate(beat.volume,t)) + ' mL';
  }
  function stop() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    play.textContent = +time.value === 800 ? 'Replay beat' : 'Play one beat';
    play.setAttribute('aria-pressed', 'false');
  }
  const probeIndices = { left: -1, right: -1 };
  let challenge;
  function clearMasks() {
    for(const mask of [get('future'), get('right-future')])mask.setAttribute('width',0);
  }
  function endProbe() {
    clearMasks(); challenge=null; get('probe').hidden=true; get('phase-note').hidden=false;
  }
  get('predict').onclick=()=>{
    stop();
    if(activeView!=='0'&&activeView!=='3')lab.querySelector('[data-cardio-view="0"]').click();
    const right=activeView==='3', side=right?'right':'left';
    const challenges=right?rightValveChallenges:valveChallenges;
    const labels=right?rightValveChoices:valveChoices;
    probeIndices[side]=(probeIndices[side]+1)%challenges.length;
    challenge=challenges[probeIndices[side]];
    const [t,prompt]=challenge;
    show(t); get('probe').hidden=false; get('phase-note').hidden=true;
    const mask=get(right?'right-future':'future');
    mask.setAttribute('x',chartX(t));mask.setAttribute('width',472-chartX(t));
    get('probe-prompt').textContent=(right?'Right heart · ':'Left heart · ')+prompt; get('probe-note').textContent='';
    lab.querySelectorAll('[data-probe-choice]').forEach((button,i)=>button.textContent=labels[i]);
  };
  lab.querySelectorAll('[data-probe-choice]').forEach(button=>button.onclick=()=>{
    if(!challenge)return;
    const [, , answer, explanation]=challenge;
    if (+button.dataset.probeChoice===answer) {
      get('probe-note').textContent='Correct. '+explanation; clearMasks();challenge=null;
    } else get('probe-note').textContent='Trace the higher upstream pressure and check which valve is currently open. Try again.';
  });
  get('rewind').onclick=()=>{stop();endProbe();show([...currentPhases].reverse().find(p=>p.start<+time.value)?.start??0);};
  get('speed').onchange=stop;
  time.addEventListener('input',endProbe);jump.addEventListener('change',endProbe);play.addEventListener('click',endProbe);
  time.addEventListener('input', () => { stop(); show(+time.value); });
  jump.addEventListener('change', () => { stop(); show(+jump.value); });
  play.addEventListener('click', () => {
    if (frame !== null) { stop(); return; }
    const start = +time.value === 800 ? 0 : +time.value;
    let previous=start;
    const began = performance.now();
    play.textContent = 'Pause beat';
    play.setAttribute('aria-pressed','true');
    function advance(now) {
      if (!lab.isConnected || !lab.getClientRects().length) { stop(); return; }
      const t = Math.min(800, Math.round(start + (now - began) / Number(get('speed').value)));
      if(activeView==='4')sounds.playBetween(previous,t);
      previous=t;
      show(t);
      if (t === 800) stop();
      else frame = requestAnimationFrame(advance);
    }
    frame = requestAnimationFrame(advance);
  });
  show(0);
}

function renderVessel() {
  return `<h3>Change a vessel’s radius</h3><p>In this ideal tube, choose a lumen radius and a pressure difference. Hold one steady to see which change has the larger effect on flow. Length and viscosity stay fixed.</p>
    <figure class="ac-plot"><svg viewBox="0 0 500 178" role="img" aria-label="A vessel cross section and a longitudinal cutaway show how the lumen changes with the radius setting.">
    <text x="86" y="20" text-anchor="middle">Cross section</text><text x="320" y="20" text-anchor="middle">Longitudinal cutaway</text>
    <circle cx="86" cy="96" r="70" fill="#1b3034" stroke="#486163"/>
    <circle data-ring cx="86" cy="96" fill="#ad6b64" stroke="#f3bd9d" stroke-width="2"/>
    <circle data-lumen cx="86" cy="96" fill="#542a3a" stroke="#e59b95" stroke-width="1.5"/>
    <circle cx="86" cy="96" r="28" fill="none" stroke="#e5eee1" stroke-width="1.3" stroke-dasharray="4 4"/>
    <line data-radius-line x1="86" y1="96" y2="96" stroke="#ffdfb6" stroke-width="2"/>
    <circle cx="86" cy="96" r="2.4" fill="#ffdfb6"/>
    <rect data-tube-wall x="189" width="276" fill="#ad6b64" stroke="#f3bd9d" stroke-width="2" rx="3"/>
    <rect data-tube-lumen x="189" width="276" fill="#542a3a"/>
    <g data-flow-arrow stroke="#ffdfb6" stroke-width="3" fill="none"><path d="M242 96 H408 M397 89 L408 96 L397 103"/></g>
    <text x="189" y="168">Inlet</text><text x="465" y="168" text-anchor="end">Outlet</text></svg></figure>
    <div class="ac-legend"><span><i style="border-color:#d1dcd0;border-top-style:dashed"></i>Reference radius (20 µm)</span><span><i style="border-color:#ffdfb6"></i>Selected radius and flow direction</span></div>
    <div class="ac-grid"><label class="ac-range">Lumen radius <strong data-radius-out></strong><input type="range" min="10" max="40" step="1" value="20" data-radius></label>
    <label class="ac-range">Pressure difference <strong data-gradient-out></strong><input type="range" min="0" max="80" step="1" value="40" data-gradient></label></div>
    <div class="ac-stats"><span>Relative resistance<strong data-resistance></strong></span><span>Relative flow<strong data-flow></strong></span></div>
    <p class="ac-note" data-flow-note></p><div class="ac-row"><button type="button" data-reset-flow>Reset to reference</button></div>`;
}

function mountVessel(lab) {
  const get = name => lab.querySelector('[data-' + name + ']');
  const radius = get('radius');
  const gradient = get('gradient');
  function change() {
    const r = +radius.value;
    const dp = +gradient.value;
    const relativeRadius = r / 20;
    const relativeResistance = 1 / relativeRadius ** 4;
    const relativeFlow = (dp / 40) / relativeResistance;
    const drawnRadius = r * 1.4;
    const wall = get('tube-wall');
    const lumen = get('tube-lumen');
    get('ring').setAttribute('r', drawnRadius + 7);
    get('lumen').setAttribute('r', drawnRadius);
    get('radius-line').setAttribute('x2', 86 + drawnRadius);
    wall.setAttribute('y',96 - drawnRadius - 7);
    wall.setAttribute('height', 2 * (drawnRadius + 7));
    lumen.setAttribute('y',96 - drawnRadius);
    lumen.setAttribute('height',2 * drawnRadius);
    get('flow-arrow').style.display = dp ? '' : 'none';
    const times = n => Number(n.toFixed(4)) + '× reference';
    get('radius-out').textContent = r + ' µm';
    radius.setAttribute('aria-valuetext',r + ' micrometers');
    get('gradient-out').textContent = dp + ' mm Hg';
    gradient.setAttribute('aria-valuetext',dp + ' millimeters of mercury');
    get('resistance').textContent = times(relativeResistance);
    get('flow').textContent = times(relativeFlow);
    get('flow-note').textContent = dp === 0
      ? 'With equal inlet and outlet pressures, this model has zero net flow at any radius.'
      : `Relative flow = (${dp}/40) × (${r}/20)⁴ = ${Number(relativeFlow.toFixed(4))}. The pressure term changes linearly. The radius term changes to the fourth power.`;
  }
  radius.addEventListener('input', change);
  gradient.addEventListener('input', change);
  get('reset-flow').addEventListener('click', () => { radius.value = '20'; gradient.value = '40'; change(); });
  change();
}

const labs = new Map([
  ['18.4', [smearStation, mountSmear]],
  ['18.5', [clotStation, mountClot]],
  ['18.6', [renderTyping, mountTyping]],
  ['19.1', [()=>renderSpecimen('heart'),lab=>mountSpecimen(lab,'heart')]],
  ['19.2', [renderHeartbeat, mountHeartbeat]],
  ['19.3', [renderHeartbeat, mountHeartbeat]],
  ['19.4', [()=>'<nav class="course-actions" aria-label="Cardiac physiology experiments"><a class="course-link" data-output-link href="#ap2-lesson-19.4/activity">Cardiac output</a><a class="course-link" data-afterload-link href="#ap2-lesson-19.4/activity/afterload">Compare pressure–volume loops</a></nav>'+
    '<div data-output-view>'+renderOutput()+'</div><div data-afterload-view hidden>'+renderAfterload()+'</div>',(lab,{store,station}={})=>{
      const afterload=station==='afterload',outputView=lab.querySelector('[data-output-view]'),afterloadView=lab.querySelector('[data-afterload-view]');
      outputView.hidden=afterload;afterloadView.hidden=!afterload;
      lab.querySelector(afterload?'[data-afterload-link]':'[data-output-link]').setAttribute('aria-current','page');
      if(afterload)mountAfterload(afterloadView,store);
      else mountOutput(outputView);
    }]],
  ['19.5', [renderEmbryo,mountEmbryo]],
  ['20.1', [renderPump,mountPump]],
  ['20.2', [renderVessel, mountVessel]],
  ['20.3', [renderExchange,mountExchange]],
  ['20.4', [renderHemorrhage,mountHemorrhage]],
  ['20.5', [() => views(['Follow a route','3D vessels']) + '<div data-cardio-panel="0">'+renderRoutes(false)+'</div><div data-cardio-panel="1" hidden>'+renderSpecimen('vessels')+'</div>', lab => {
    mountRoutes(lab,false);let mounted=false;
    wireViews(lab,view=>{
      if(view!=='1')return;
      if(!mounted){mountSpecimen(lab,'vessels');mounted=true;}
      requestAnimationFrame(()=>{
        const viewport=lab.querySelector('[data-organ-kind="vessels"] .organ-viewport');
        if(!viewport?.getClientRects().length)return;
        const bounds=viewport.getBoundingClientRect();
        if(bounds.top<0||bounds.bottom>innerHeight)viewport.scrollIntoView({block:'center',behavior:'instant'});
      });
    });
  }]],
  ['20.6', [() => renderRoutes(true), lab => mountRoutes(lab,true)]]
]);

export function renderLab(id) {
  const lab = labs.get(id);
  return lab ? `${labCss}<section class="ap2-cardio-lab" data-cardio-lab="${id}">${lab[0]()}</section>` : '';
}

export function mountLab(root, id, options) {
  const behavior = labs.get(id);
  if (!root || !behavior) return;
  const selector = `[data-cardio-lab="${id}"]`;
  const lab = root.matches?.(selector) ? root : root.querySelector(selector);
  if (!lab || lab.dataset.cardioMounted) return;
  behavior[1](lab,options);
  lab.dataset.cardioMounted = 'true';
}



