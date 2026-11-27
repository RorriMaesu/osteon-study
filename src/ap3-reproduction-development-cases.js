import {select,table} from './ap3-labs-experiments.js';

export const ductSignals={
  title:'Predict the fate of two embryonic ducts',section:'27.3',figure:'28.16',
  intro:'Begin with paired mesonephric (Wolffian) and paramesonephric (Müllerian) ducts. Independently change two tissue signals during the critical period for internal duct differentiation.',
  controls:[select('amh','Effective anti-Müllerian hormone signal',['Absent','Present']),select('androgen','Effective testosterone signal at the duct',['Absent','Present'])],
  run({amh,androgen},responses=[]){
    const observation=table('Signals received by the embryonic tract',['Signal','Effective signaling'],[['AMH',amh?'Present':'Absent'],['Testosterone',androgen?'Present':'Absent']]);
    const m=amh?'Regresses':'Persists and differentiates',w=androgen?'Persists and differentiates':'Regresses';
    const first=!responses.length,duct=first?'Müllerian':'Wolffian',answer=first?m:w;
    const why=first?(amh?'Effective AMH from embryonic Sertoli cells promotes Müllerian duct regression.':'Without effective AMH, the Müllerian ducts can form uterine tubes, uterus, cervix and the upper vagina.'):
      (androgen?'Effective testosterone signaling maintains the Wolffian ducts and supports derivatives such as the epididymides, ductus deferentia and seminal glands.':'In the absence of effective testosterone signaling the Wolffian ducts regress.');
    const data={observation,question:'What happens to the '+duct+' duct under these conditions?',choices:[answer,...['Persists and differentiates','Regresses','Becomes the other duct system'].filter(v=>v!==answer)],why,
      frames:[['Initial structures','Both duct systems are present before differentiation.'],[duct+' outcome',why]]};
    if(first)data.nextDecision='Predict the other duct';
    else data.result=table('Duct-fate map',['Initial duct','Signal','Outcome','Examples of derivatives here'],[
      ['Müllerian',amh?'AMH present':'AMH absent',m,amh?'—':'Uterine tubes, uterus, cervix and upper vagina'],
      ['Wolffian',androgen?'Testosterone present':'Testosterone absent',w,androgen?'Epididymis, ductus deferens and seminal gland':'—']
    ]);
    return data;
  }
};

const meiosisStages=[
  ['Fetal ovary','A diploid germ cell has replicated its DNA and paired its homologous chromosomes. It can remain in this state for years.','Primary oocyte in prophase I','Meiosis I resumes in a selected follicle after puberty.'],
  ['Before ovulation','Homologous chromosomes separate. Most cytoplasm stays in one cell, and a small cell separates from it.','Secondary oocyte and first polar body','The secondary oocyte is haploid. Each chromosome still has two chromatids.'],
  ['Around ovulation','The ovulated cell contains one set of duplicated chromosomes, aligned but awaiting the signal to separate sister chromatids.','Secondary oocyte arrested in metaphase II','Entry of a sperm can trigger completion of meiosis II.'],
  ['After sperm entry','Sister chromatids of the maternal chromosomes separate. An additional small cell receives chromosomes and very little cytoplasm.','Completion of meiosis II and formation of a second polar body','The maternal haploid complement contributes to the zygote, alongside the paternal complement.'],
  ['Seminiferous tubule','A primary spermatocyte completes two meiotic divisions with relatively equal partition of cytoplasm.','Four haploid spermatids','The spermatids differentiate into sperm. In oogenesis, unequal divisions instead preserve cytoplasm in one functional gamete.']
];
export const gameteTimeline={
  title:'Place the two oocyte arrests on a meiosis timeline',section:'27.2',
  intro:'Read each cell record. Use homologs, chromatids, and division of cytoplasm to identify the state.',
  controls:[select('stage','Cell record',meiosisStages.map((_,i)=>'Record '+(i+1)))],
  run({stage}){
    const [time,obs,answer,why]=meiosisStages[stage];
    return {observation:table('Cell findings',['Setting','Observation'],[[time,obs]]),question:'What does this record show?',choices:[answer,...meiosisStages.filter(v=>v[2]!==answer).map(v=>v[2])],
      why,result:table('Compare the pathways',['Time or tissue','Milestone'],meiosisStages.map(row=>[row[0],row[2]])),frames:[['Cell evidence',obs],['Next event',why]]};
  }
};

const maternalStages=[
  ['After implantation','A newly implanted embryo has begun signaling. The placenta has yet to assume most steroid production.','hCG maintains the corpus luteum','hCG from trophoblast sustains the corpus luteum and its progesterone secretion in early pregnancy.'],
  ['Later in the first trimester','Ovarian luteal support declines while pregnancy continues and progesterone remains available.','The placenta sustains steroid production','The placenta progressively becomes the major source of progesterone and estrogens. Progesterone supports the endometrium and uterine quiescence.'],
  ['Advancing pregnancy','The placenta requires perfusion and fetal growth raises demands on the maternal circulation.','Maternal blood volume and cardiac output increase','Expanded blood volume and increased cardiac output support uteroplacental and maternal tissue perfusion.'],
  ['Near and during labor','Cervical stretch triggers oxytocin release. Uterine contractions cause further cervical stretch.','Positive feedback strengthens contractions','Oxytocin and prostaglandins can amplify contractions. Delivery removes the stretch driving this loop.'],
  ['Labor record A','Regular contractions progressively thin and open the cervix. Full dilation has not yet occurred.','First stage: cervical dilation','This stage ends at full cervical dilation.'],
  ['Labor record B','The cervix is fully dilated and the fetus is moving through the birth canal.','Second stage: fetal expulsion','The second stage runs from full dilation to delivery of the baby.'],
  ['Labor record C','The baby has been born. The placenta separates from the uterine wall and is expelled.','Third stage: placental delivery','The third stage extends from delivery of the baby through delivery of the placenta.']
];
export const pregnancyLabor={
  title:'Trace maternal pregnancy changes and the stages of labor',section:'28.4',
  intro:'Move through one pregnancy timeline. For each observation, infer the mechanism or stage from what is happening in the maternal tissues.',
  controls:[select('stage','Timeline record',maternalStages.map(row=>row[0]))],
  run({stage}){
    const [time,observed,key,why]=maternalStages[stage];
    const group=Number(stage)>=4?maternalStages.slice(4):maternalStages.slice(0,4);
    return {observation:table('Maternal record',['Interval','Evidence'],[[time,observed]]),question:'Which interpretation best fits the record?',choices:[key,...group.map(row=>row[2]).filter(a=>a!==key)],
      why,figure:stage>=4?'28.21':stage===3?'28.20':null,result:table('Pregnancy-to-birth sequence',['Interval','Event'],maternalStages.map(row=>[row[0],row[2]])),frames:[['Observed',observed],['Mechanism or stage',why]]};
  }
};

const families=[
  {people:[['Mother','Unaffected'],['Daughter','Affected'],['Father','Status withheld']],
    models:['Autosomal recessive','X-linked recessive'],requests:["The father's phenotype","Repeat the mother's existing phenotype record"],
    observations:['The father is unaffected.','The mother is confirmed unaffected.'],
    evidence:'An affected XX daughter would require an affected father under this X-linked recessive model. The unaffected mother alone fits either model.',
    model:'Autosomal recessive',risk:'What is the chance that the next child of the same parents is affected?',fraction:'1/4',reason:'Two unaffected parents with an affected child must both be carriers in the autosomal recessive model. Aa × Aa gives one affected outcome in four.'},
  {people:[['Father','Affected; one of his own parents is unaffected'],['Mother','Unaffected'],['Daughter','Affected']],
    models:['Autosomal dominant','X-linked dominant'],requests:['Whether the same parents have an affected son','Repeat the existing phenotype record of the daughter'],
    observations:['One son of these parents is affected.','The daughter is confirmed affected.'],
    evidence:'An affected son cannot inherit his father’s X-linked allele and the mother is unaffected. An affected daughter could fit either model.',
    model:'Autosomal dominant',risk:'Given that a future child is a son, what is his chance of being affected?',fraction:'1/2',reason:'The affected father inherited a normal allele from his unaffected parent. Each son can inherit the affected autosomal allele with probability one half.'},
  {people:[['Mother','Unaffected'],['Father','Unaffected'],['Son','Affected']],
    models:['Autosomal recessive','X-linked recessive'],requests:['Genotype the father at the proposed autosomal locus','Repeat the known phenotype of the affected son'],
    observations:['The father has two normal alleles at the proposed autosomal locus.','The son is confirmed affected.'],
    evidence:'A father with two normal alleles cannot supply the recessive autosomal allele that an affected child would require. The affected son alone fits both models.',
    model:'X-linked recessive',risk:'Given that a future child is a son, what is his chance of being affected?',fraction:'1/2',reason:'The affected son inherited an affected X from his unaffected carrier mother. Each son independently receives one of her two X chromosomes.'},
  {people:[['Parent 1','Blood group A'],['Parent 2','Blood group B'],['Children','One previous child has been typed']],
    models:['Both parents carry i','At least one parent is homozygous for A or B'],requests:['The blood group of their previous child','Repeat the blood group of parent 1 without genotyping'],
    observations:['Their previous child has blood group O.','Parent 1 again types as blood group A.'],
    evidence:'An O child has genotype ii and therefore received i from each parent. A phenotype alone cannot distinguish IᴬIᴬ from Iᴬi.',
    model:'Both parents carry i',risk:'What is the chance their next child has blood group AB?',fraction:'1/4',reason:'Iᴬi × Iᴮi yields four equally likely genotypes. One, IᴬIᴮ, gives the AB phenotype through codominant expression.'}
];
const familyOutcomes=[
  [['AA','1/4','Unaffected'],['Aa','1/2','Unaffected carrier'],['aa','1/4','Affected']],
  [['Aa','1/2','Affected son'],['aa','1/2','Unaffected son']],
  [['X with trait allele + Y','1/2','Affected son'],['X with usual allele + Y','1/2','Unaffected son']],
  [['IᴬIᴮ','1/4','Type AB'],['Iᴬi','1/4','Type A'],['Iᴮi','1/4','Type B'],['ii','1/4','Type O']]
];
export const familyEvidence={
  title:'Choose family evidence and revise an inheritance prediction',section:'28.7',
  intro:'Each fictional pedigree allows the two listed hypotheses. For the single-gene records assume complete penetrance, no new mutation, usual XX/XY inheritance, and independent pregnancies. The ABO family uses conventional A, B and O alleles.',
  controls:[select('family','Family record',['Family A','Family B','Family C','ABO family'])],
  run({family},history=[]){
    const f=families[family],base=f.people.map(row=>[...row]);
    const insufficient=history[0]!==0;
    if(history.length)base.push(['Record requested',f.observations[history[0]]]);
    if(insufficient&&history.length>1)base.push(['Other family record',f.observations[0]]);
    const observation=table('Available family evidence',['Relative','Known finding'],base);
    if(!history.length)return {observation,note:'Compare these hypotheses: '+f.models.join(' or ')+'.',
      question:'Which additional family record is more informative for distinguishing the hypotheses?',choices:f.requests,
      why:'A useful record can produce a finding that rules out at least one hypothesis. Open the record to see the actual finding.',
      nextDecision:'Open the requested family record',frames:[['First relative',base[0].join(' · ')],['Second relative',base[1].join(' · ')]]};
    if(insufficient&&history.length===1)return {observation,question:'What can you conclude from this finding?',choices:['Both hypotheses are still possible',...f.models],why:'This observation fits either hypothesis. Inspect the other family record for additional evidence.',
      nextDecision:'Inspect the other family record',frames:[['New observation',f.observations[1]],['Evidence limit','One compatible observation cannot eliminate either model.']]};
    const scoredSteps=insufficient?2:1;
    if(history.length===scoredSteps)return {observation,question:'Which hypothesis is consistent with all the available evidence?',choices:[f.model,...f.models.filter(v=>v!==f.model),'Both hypotheses remain possible'],why:f.evidence,
      nextDecision:'Calculate the updated probability',frames:[['Discriminating evidence',f.observations[0]],['Inference',f.evidence]]};
    return {observation,question:f.risk,figure:family===0?'28.27':null,choices:[f.fraction,...['0','1/4','1/2','3/4','1'].filter(v=>v!==f.fraction)],why:f.reason,
      result:table(family===1||family===2?'Possible outcomes among sons':'Possible outcomes for the next child',['Genotype','Chance','Phenotype'],familyOutcomes[family]),
      frames:[['Supported hypothesis',f.model],['Conditional probability',f.reason]]};
  }
};
