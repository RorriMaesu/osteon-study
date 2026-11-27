import {termExamWeeks} from './term-exam-weeks.js';
import {sectionSources} from './ap3-curriculum-sources.js';
import {observations} from './spring-weekly-observations.js';
import {alternateWeekStations} from './term-spring-weekly-variants.js';
import {ordered,pick,term,number,data,item} from './term-mock-spring-items.js';

function weeklyStations(week,n){
  if(n>0)return alternateWeekStations(week,n);
  const v=3+n;
  switch(week){
    case 1:return [
      item('21.4','antibody','Compare matched antibody measurements from the same simulated learner.',
        [number('Calculate the secondary peak divided by the primary peak.',v,'fold'),pick('What can explain a larger antigen-specific secondary response?','Expansion of memory B cells','Conversion of erythrocytes to plasma cells','Loss of all matching B cells')],'Memory B cells expand upon renewed exposure.',data(['Exposure','Peak antibody (arbitrary units)'],['Initial',12],['Repeat',12*v])),
      item('21.1','node','Identify the entry and return points in a regional lymph route.',
        [term('What type of vessel approaches the convex nodal surface?','Afferent lymphatic vessel',['afferent','afferent vessel']),term('Where do lymph and venous blood normally meet at the base of the neck?','Venous angle',['jugulosubclavian junction','jugular subclavian junction'])],'Afferent vessels bring lymph into a node. The terminal ducts join the venous system at the venous angles.')];
    case 2:return [
      item('22.3','breath','Evaluate fresh-air delivery in this breathing record.',
        [number('Calculate fresh air per breath after allowing for dead space.',100*v,'mL'),number('Calculate alveolar ventilation per minute.',v*1.4,'L/min')],'Subtract dead space before multiplying by frequency.',data(['Measurement','Value'],['Tidal volume (mL)',100*v+135],['Anatomical dead space (mL)',135],['Breaths/min',14])),
      item('21.7','graft','Describe the donor relationship in each skin graft.',
        [term('The donor and recipient are genetically different people. Name the graft category.','Allograft',['allogeneic graft']),term('The skin is moved between two sites on the same individual. Name the graft category.','Autograft',['autologous graft'])],'Graft categories depend on the relationship of donor to recipient.')];
    case 3:return [
      item('22.4','exchange','Read gradients across two systemic capillary beds.',
        [number('Calculate the blood-to-tissue oxygen pressure difference in bed X.',v*9,'mmHg'),pick('In which bed is the initial oxygen pressure difference greater?','Bed X','Bed Y','The differences are equal')],'Blood oxygen partial pressure minus tissue oxygen partial pressure gives the outward gradient.',data(['Bed','Blood PO₂ (mmHg)','Tissue PO₂ (mmHg)'],['X',80,80-v*9],['Y',80,65])),
      item('23.1','wall','Identify neighboring digestive wall tissues.',
        [term('Which major layer faces the lumen?','Mucosa',['mucosal layer']),term('Which major connective-tissue layer lies just deep to the muscularis mucosae?','Submucosa',['submucosal layer'])],'Mucosa includes epithelium, lamina propria and muscularis mucosae; the submucosa lies outside it.')];
    case 4:return [
      item('23.7','absorb','Interpret post-meal tracer counts from a villus.',
        [pick('Which tracer profile best fits newly packaged long-chain dietary lipid?','Tracer L','Tracer G','Both equally'),pick('Where do most exported monosaccharides go first?','Capillary blood','Lacteal lymph','Bile canaliculi')],'Chylomicrons enter lymph while monosaccharides enter villus capillaries.',data(['Tracer','Capillary counts','Lacteal counts'],['G',30*v,2],['L',1,21*v])),
      item('23.4','gastric','Match two gastric secretions to their source cells.',
        [term('Which gastric cells release pepsinogen?','Chief cells',['chief','chief cell']),term('Which cells release intrinsic factor?','Parietal cells',['parietal','parietal cell'])],'Chief cells secrete a protease precursor; parietal cells secrete intrinsic factor and hydrochloric acid.')];
    case 5:return [
      item('24.7','energy','Compare energy from the two measured macronutrients in a sample.',
        [number('At 9 kcal/g, how much energy comes from fat?',v*9,'kcal'),number('Using 4 kcal/g carbohydrate, how much comes from both nutrients together?',v*9+48,'kcal')],'Multiply each mass by its own energy factor and add the contributions.',data(['Nutrient','Mass (g)'],['Fat',v],['Digestible carbohydrate',12])),
      item('24.2','location','Locate early and late events of aerobic glucose oxidation.',
        [term('In what cellular compartment does glycolysis occur?','Cytosol',['cytoplasm']),term('Which mitochondrial compartment contains most enzymes of the citric acid cycle?','Matrix',['mitochondrial matrix'])],'Glycolysis operates in cytosol; most cycle enzymes occupy the mitochondrial matrix.')];
    case 6:return [
      item('25.5','filter','Use measured filtration and urinary excretion to infer net tubular transport.',
        [number('Calculate the net amount returned to blood per minute.',8*v,'mg/min'),pick('Which movement predominates in the tubules?','Reabsorption','Secretion','No net exchange')],'Less was excreted than filtered. The difference represents net reabsorption.',data(['Solute flow','mg/min'],['Filtered',90],['Excreted',90-8*v])),
      item('25.3','drain','Identify the structures at the boundary of a pyramid and the collection system.',
        [term('Name the tip of a renal pyramid.','Renal papilla',['papilla']),term('What small cup receives urine at one papilla?','Minor calyx',['minor calix'])],'Papillary ducts open at the papilla into a minor calyx.')];
    case 7:return [
      item('26.2','water','Calculate external water balance over one simulated day.',
        [number('Calculate the magnitude of net water loss.',v*100,'mL'),pick('If this is pure water loss, which direction should ADH secretion take?','Increase','Decrease','Remain suppressed independent of osmolality')],'Net loss equals water output minus all water inputs. Pure water loss increases plasma osmolality.',data(['Flux','mL/day'],['All inputs',2300],['All losses',2300+v*100])),
      item('25.10','hormones','Identify two endocrine signals associated with the kidney.',
        [term('Which signal promotes red-cell production during sustained hypoxia?','Erythropoietin',['EPO']),term('Which renal enzyme acts on angiotensinogen?','Renin')],'Erythropoietin acts on erythroid precursors. Renin initiates the angiotensin cascade.')];
    case 8:return [
      item('26.5','buffer','Compare this arterial sample with the stated reference.',
        [pick('Assuming one primary disturbance, which is consistent with these measurements?','Metabolic alkalosis','Respiratory alkalosis','Metabolic acidosis'),pick('Which respiratory response is in the compensating direction?','CO₂ retention','Greater CO₂ elimination','Lower plasma bicarbonate by binding oxygen')],'High bicarbonate fits the alkalemia. Retention of CO₂ counteracts it.',data(['Variable','Observed','Reference'],['pH',(7.44+.01*v).toFixed(2),'7.35–7.45'],['Bicarbonate (mmol/L)',28+v,'22–26'],['PCO₂ (mmHg)',43+v,'35–45'])),
      item('27.1','testicular','Trace the contribution of accessory glands to semen.',
        [term('Which paired glands contribute a fructose-rich secretion?','Seminal vesicles',['seminal glands','seminal vesicle','seminal gland']),term('Which single gland surrounds the urethra just below the bladder?','Prostate',['prostate gland'])],'Seminal vesicle fluid contains fructose. The prostate contributes secretion to the prostatic urethra.')];
    case 9:return [
      item('28.2','early','Interpret a sequence of cell counts from an early conceptus.',
        [number('How many times greater is the final cell count than the initial count?',4,'fold'),pick('Which process fits serial division with little change in overall size?','Cleavage','Gastrulation','Implantation')],'During cleavage the conceptus partitions its cytoplasm among progressively smaller blastomeres.',data(['Observation','Cells','Relative outer diameter'],['First',2**(n+1),100],['Second',2**(n+2),100],['Third',2**(n+3),100])),
      item('27.2','ovary','Connect the ovarian event to its immediate endocrine sequel.',
        [term('Name the anterior pituitary hormone whose surge triggers ovulation.','Luteinizing hormone',['LH','luteinising hormone']),term('What endocrine structure forms from the ruptured follicle?','Corpus luteum')],'The LH surge precedes ovulation and luteinization of the follicular remnant.')];
    case 10:return [
      item('28.7','families','Interpret expected outcomes for independent Aa × aa conceptions under complete dominance.',
        [number('How many heterozygotes are expected on average?',10*v,'offspring'),number('What percentage is expected to be homozygous recessive?',50,'%')],'The heterozygote transmits A or a with equal probability. Expected totals describe averages.',data(['Parents','Independent conceptions'],['Aa × aa',20*v])),
      item('28.6','milk','Distinguish maternal synthesis and ejection signals.',
        [term('Name the anterior pituitary hormone that supports synthesis.','Prolactin',['PRL']),term('Name the posterior pituitary hormone that causes ejection.','Oxytocin')],'Prolactin acts on secretory cells. Oxytocin contracts the myoepithelial cells around the alveoli.')];
  }
}

export function springWeeklyItems(week,form){
  const n='ABC'.indexOf(form),row=termExamWeeks.ap3.find(w=>w.week===week);
  if(!row?.sections.length||!['A','B','C'].includes(form))throw new RangeError('Unknown spring weekly form.');
  const concepts=row.sections.map((section,index)=>{
    const cases=observations[section],which=(index+n)%3,[key,scenario]=cases[which];
    const choices=ordered(cases.map(([label])=>label),'weekly-'+section+form);
    return {id:'concept-'+section,section,type:'choice',points:1,prompt:scenario+(scenario.endsWith('?')?'':' Which interpretation fits?'),choices,answer:choices.indexOf(key),why:key+' fits this observation. '+cases[(which+1)%3][0]+' describes a different finding: '+cases[(which+1)%3][1]};
  });
  return [...concepts,...weeklyStations(week,n)].map(q=>{
    const id='spring-week-'+week+'-'+form.toLowerCase()+'-'+q.id;
    const parts=q.parts?.map((p,i)=>{
      if(!p.choices)return p;const choices=ordered(p.choices,id+i);
      return {...p,choices,answer:choices.indexOf(p.choices[p.answer])};
    });
    return {...q,...(parts?{parts}:{}),id,chapter:Number(q.section.split('.')[0]),source:'https://openstax.org/books/anatomy-and-physiology-2e/pages/'+sectionSources[q.section][1]};
  });
}
