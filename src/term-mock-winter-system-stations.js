import {choice,term,num} from './term-mock-winter-stations.js';

const table=(columns,rows)=>({columns,rows:rows.map(r=>r.map(String))});
const measures=rows=>table(['Measurement','Observation'],rows);
const task=(section,objective,prompt,stimulus,parts,why)=>({section,objective,prompt,stimulus,parts,why,points:2});

export function endocrine(f,figure){
  const axis=[
    ['Thyroid hormone','TSH','Below reference','Above reference','Reduced gland output','The downstream thyroid gland'],
    ['Cortisol','ACTH','Below reference','Above reference','Reduced gland output','The downstream adrenal cortex'],
    ['Thyroid hormone','TSH','Above reference','Below reference','Excess gland output','The downstream thyroid gland']
  ][f];
  const calcium=['Below baseline','Above baseline','Below baseline'][f], low=calcium.startsWith('Below');
  const arterial=[95,105,100][f],venous=[70,90,80][f],flow=[2,3,4][f];
  const concentration=['rises','falls','rises'][f];
  const glucoseHigh=concentration==='rises';
  const gland=['adrenal cortex','thyroid gland','adrenal cortex'][f],steroid=gland==='adrenal cortex';
  const tissue=['liver','skeletal muscle','adipose tissue'][f];
  return {evidence:[
    figure(['paired-hormones','follicle-lumen','paired-hormones'][f]),
    task(f===1?'17.6':'17.4','feedback-axis','Use both results in this intact negative-feedback axis. Assume no exogenous hormone.',table(['Hormone','Result'],[[axis[0],axis[2]],[axis[1],axis[3]]]),[
      choice('Which interpretation fits the pattern?',axis[4],axis[4].startsWith('Reduced')?'Excess gland output':'Reduced gland output','Complete loss of all feedback'),
      choice('Where is the change in secretion most consistent with these observations?',axis[5],'An isolated failure of pituitary stimulation with a normal peripheral gland','The posterior pituitary alone')],
      'An intact pituitary changes its tropic signal opposite to the peripheral hormone. Interpret the pair together.'),
    task('17.5','calcium-feedback','A calcium-sensing preparation responds to a change in extracellular calcium.',measures([['Ionized calcium',calcium],['Parathyroid glands','Intact'],['Renal response','Intact']]),[
      choice('Which direction should PTH secretion move?',low?'Increase':'Decrease',low?'Decrease':'Increase','Become independent of calcium'),
      choice('Compared with baseline, what happens to the PTH drive for renal calcium retention?',low?'Increases':'Decreases',low?'Decreases':'Increases','Reverses the direction of filtration')],
      'Falling calcium stimulates PTH, promoting renal calcium conservation. Rising calcium suppresses that drive.'),
    task('17.9','glucose-feedback','Use the direction of the glucose change to predict an islet response.',measures([['Blood glucose','It '+concentration+' from baseline'],['Islet feedback','Normal']]),[
      choice('Which hormone secretion should increase?',glucoseHigh?'Insulin':'Glucagon',glucoseHigh?'Glucagon':'Insulin','Melatonin'),
      choice('Which hepatic effect helps restore baseline?',glucoseHigh?'Increased glycogen synthesis':'Increased glucose release',glucoseHigh?'Increased glucose release':'Increased glycogen synthesis','Complete cessation of metabolism')],
      'Insulin favors storage after glucose rises. Glucagon favors hepatic glucose release during falling glucose.'),
    task('17.2','receptor-specificity','A circulating peptide reaches three cell preparations at the same concentration.',table(['Preparation','Surface receptor','Second-messenger response'],[['A','Present','Increases'],['B','Absent','Unchanged'],['C','Present but blocked','Unchanged']]),[
      choice('Which condition best explains the selectivity?','Availability of functional receptors','Distance from a duct','Equal exposure eliminates differences'),
      choice('What does the response in preparation C demonstrate?','Ligand exposure alone is insufficient','All circulating peptides enter nuclei','Receptor blockade mimics stimulation')],
      'Cells need an appropriate, functional receptor. Exposure alone cannot predict a response.'),
    task('17.3','pituitary-release','Tracer labels a peptide in hypothalamic neuronal cell bodies. Follow it through a severed stalk in a model.',measures([['Synthesis','Occurs in hypothalamic neurons'],['Usual transport','Along axons'],['Stalk transport','Interrupted']]),[
      choice('Which destination normally releases the stored signal?','Posterior pituitary','Anterior pituitary portal capillary','Adrenal cortex'),
      choice('Which pair follows this route?','Oxytocin and ADH','Growth hormone and TSH','Insulin and glucagon')],
      'Oxytocin and ADH travel down hypothalamic axons to the posterior pituitary for release.'),
    task('17.6','cortical-medullary','Use location and stimulus to distinguish two adrenal preparations.',table(['Preparation','Strong immediate stimulus'],[['A','Preganglionic sympathetic action potentials'],['B','ACTH acting on cortisol-producing cells']]),[
      choice('Which preparation represents adrenal medulla?','A','B','Both'),
      choice('Which class is normally released by preparation B?','Steroid hormone','Catecholamine','Thyroid hormone')],
      'Chromaffin cells in the medulla respond to sympathetic input. Cortisol is synthesized by the cortex.'),
    task('17.10','secondary-endocrine','A sustained fall in oxygen delivery to kidney tissue precedes a marrow response.',measures([['Renal oxygen delivery','Low'],['Marrow precursor response','More erythroid cells mature']]),[
      choice('Which renal signal connects the findings?','Erythropoietin','Aldosterone','Glucagon'),
      choice('Which long-term change helps relieve the original stimulus?','Increased blood oxygen-carrying capacity','Reduced hemoglobin synthesis','Fewer circulating erythrocytes')],
      'Kidney-derived erythropoietin promotes erythropoiesis, which can improve oxygen delivery.')],
    short:[
      task('17.9','glucose-flux','A perfused '+tissue+' preparation takes up glucose. Use flow × arterial–venous difference.',measures([['Arterial glucose',arterial+' mg/dL'],['Venous glucose',venous+' mg/dL'],['Flow',flow+' dL/min']]),[
        num('Concentration difference (mg/dL)',arterial-venous,'mg/dL'),num('Net uptake (mg/min)',(arterial-venous)*flow,'mg/min')],'Subtract outflow concentration from inflow concentration, then multiply by tissue flow.'),
      task('17.3','hypophyseal-route','Identify the hormones by their target glands.',null,[term('Pituitary hormone stimulating thyroid follicular cells','TSH',['thyrotropin','thyroid-stimulating hormone']),term('Pituitary hormone stimulating cortisol secretion','ACTH',['adrenocorticotropic hormone','corticotropin'])],'TSH acts on the thyroid and ACTH on the cortisol-producing adrenal cortex.'),
      task('17.9','islet-cells','Name the pancreatic islet cells responsible for these secretions.',null,[term('Glucagon-producing cells','alpha cells',['alpha','alpha cell']),term('Insulin-producing cells','beta cells',['beta','beta cell'])],'Alpha cells secrete glucagon. Beta cells secrete insulin.'),
      task('17.2','hormone-class','A signal leaves the '+gland+'. Identify its class and the receptor location for the specified example.',null,[term(steroid?'Class of cortisol':'Class of thyroxine, based on its tyrosine origin',steroid?'steroid':'amine',['amino acid derivative', 'amino-acid derived hormone'].filter(()=>!steroid)),term(steroid?'Receptor location for cortisol before or during gene regulation':'Receptor location for thyroid hormone action on transcription','intracellular',['intracellular receptor','inside the cell','nuclear','nucleus',...(steroid?['cytoplasmic','cytoplasm']:[])])],'Cortisol is a steroid and thyroid hormone a tyrosine derivative. Both act through intracellular receptors.')
    ]};
}

export function circulation(f,figure){
  const edv=[120,135,115][f],esv=[50,55,55][f],hr=[75,70,90][f];
  const sv=edv-esv,out=sv*hr/1000, upstream=[95,105,110][f],down=[5,15,10][f];
  const imageID=['smear-neutrophil','smear-eosinophil','smear-platelet'][f];
  const antigen=[['+','−','−','A negative','Anti-B'],['−','+','+','B positive','Anti-A'],['+','+','−','AB negative','Neither anti-A nor anti-B']][f];
  const phase=f===1?'Filling':'Early contraction',isFilling=f===1;
  const resistance=[5,6,4][f];
  return {evidence:[
    figure(imageID),
    figure(['ecg-bracket','valve-reopens','ecg-bracket'][f]),
    figure(['vessel-wall','pedal-circuit','vessel-wall'][f]),
    task('18.6','abo-reactions','Interpret this red-cell typing panel. A plus sign means agglutination.',table(['Anti-A','Anti-B','Anti-D'],[antigen.slice(0,3)]),[
      choice('Which ABO/Rh(D) type fits?',antigen[3],...['A negative','B positive','AB negative','O positive'].filter(x=>x!==antigen[3]).slice(0,3)),
      choice('Which ABO antibodies ordinarily occur in this individual’s adult plasma?',antigen[4],...['Anti-A','Anti-B','Neither anti-A nor anti-B','Both anti-A and anti-B'].filter(x=>x!==antigen[4]).slice(0,3))],
      'Agglutination identifies the matching red-cell antigen. Usual ABO plasma antibodies recognize absent A or B antigens.'),
    task('19.3','pressure-gradients','Infer the state of the left heart from the pressures and the timing.',measures([['Interval',phase],['Left atrial pressure','10 mmHg'],['Left ventricular pressure',(isFilling?'6':'22')+' mmHg'],['Aortic pressure','80 mmHg']]),[
      choice('Which state fits the mitral valve?',isFilling?'Open':'Closed',isFilling?'Closed':'Open','Cannot open at any point in diastole'),
      choice('How is ventricular volume changing during this interval?',isFilling?'Increasing':'Approximately constant',isFilling?'Approximately constant':'Increasing','Decreasing by aortic ejection')],
      'Atrial pressure exceeding ventricular pressure favors filling. When the ventricle exceeds atrial pressure but remains below aortic pressure in early contraction both valves close.'),
    task('20.2','resistance-trial','An organ is perfused at a controlled pressure gradient.',table(['Trial','Perfusion gradient','Resistance'],[['A','90 mmHg','3 units'],['B','90 mmHg',resistance+' units']]),[
      choice('Compared with A, what happens to flow in trial B?','It falls','It rises','It must remain constant'),
      choice('Which equation supports the prediction?','Flow = pressure difference / resistance','Flow = resistance / pressure difference','Flow = pressure difference × resistance')],
      'A fixed pressure gradient produces less flow when resistance increases.'),
    task('18.3','oxygen-content','Compare two blood samples at equal oxygen saturation.',table(['Sample','Hemoglobin','Saturation'],[['A',(14+f)+' g/dL','98%'],['B',(8+f)+' g/dL','98%']]),[
      choice('Which sample carries more hemoglobin-bound oxygen per dL?','A','B','They must be equal'),
      choice('What does saturation describe?','Fraction of hemoglobin oxygen-binding sites occupied','Concentration of hemoglobin protein','Volume of plasma in the sample')],
      'At equal saturation, more hemoglobin per dL supplies more occupied binding sites and a greater oxygen content.'),
    task('20.6','fetal-tracer','Trace a marker during fetal circulation.',table(['Observation','Finding'],[['Entry','Oxygen-rich blood returning from placenta'],['Next','Some blood bypasses liver sinusoids'],['Destination','Inferior vena cava']]),[
      choice('Which vessel brings the blood from the placenta?','Umbilical vein','Umbilical artery','Ductus arteriosus'),
      choice('Which shunt provides the described bypass?','Ductus venosus','Foramen ovale','Ductus arteriosus')],
      'The umbilical vein brings placental blood; the ductus venosus shunts part toward the inferior vena cava.')],
    short:[
      task('19.4','cardiac-output','Compute stroke volume and cardiac output from the same ventricular record.',measures([['End-diastolic volume',edv+' mL'],['End-systolic volume',esv+' mL'],['Heart rate',hr+' beats/min']]),[
        num('Stroke volume (mL/beat)',sv,'mL/beat'),num('Cardiac output (L/min)',out,'L/min',.001)],'Stroke volume = EDV – ESV. Cardiac output = heart rate × stroke volume. Divide mL/min by 1,000 to get L/min.'),
      task('20.2','pressure-flow','The vascular bed has a steady resistance of 5 mmHg per L/min.',measures([['Upstream pressure',upstream+' mmHg'],['Downstream pressure',down+' mmHg']]),[
        num('Driving pressure difference (mmHg)',upstream-down,'mmHg'),num('Flow (L/min)',(upstream-down)/5,'L/min')],'Subtract downstream from upstream pressure, then divide the gradient by resistance.'),
      task('19.1','heart-sequence','Name the valves along this one-way path.',null,[
        term('Right atrium to right ventricle','tricuspid valve',['tricuspid','right atrioventricular valve','right AV valve']),
        term('Right ventricle to pulmonary trunk','pulmonary valve',['pulmonary semilunar valve','pulmonic valve'])],'Blood passes through the tricuspid valve to the right ventricle and through the pulmonary valve to the lungs.'),
      task('18.5','plug-and-clot','Identify the fragment and protein that stabilize an injured vessel.',null,[
        term('Small cell fragment adhering at an injured vessel wall','platelet',['thrombocyte','platelets']),
        term('Insoluble protein forming the final meshwork','fibrin',[],['fibrinogen'])],'Platelets form the plug. Thrombin converts soluble fibrinogen into insoluble fibrin strands.')
    ]};
}
