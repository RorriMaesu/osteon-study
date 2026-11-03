// Question-specific rules: a formal-name prompt cannot be answered by repeating
// its plain-language description. Counts and sets retain their own meaning.
export const GRADING_VERSION='spelling-2026-11-02';
const structure=['6.1-2','6.3-5','6.3-6','6.3-8','6.3-12','6.3-13','6.4-11','7.2-3','7.2-14','7.2-17','7.2-18','7.2-22','7.3-5','7.3-6','7.3-12','7.3-15','7.4-4','7.4-7','7.5-6','8.1-8','8.2-2','8.2-3','8.2-4','8.2-10','8.3-3','8.4-2','8.4-3','8.4-4','8.4-11','8.5-2','9.3-6','9.4-3','9.6-8','9.6-13','9.7-3'];
const concept=['6.1-5','6.2-3','6.2-6','6.4-6','6.5-3','6.5-6','6.6-4','6.6-10','6.7-5','7.1-5','7.1-7','9.1-7','9.2-5','9.2-7','9.4-9','9.5-3','9.5-4','9.5-9'];
export const answerPolicies=Object.fromEntries([...structure.map(id=>['ex-'+id,{kind:'structure'}]),...concept.map(id=>['ex-'+id,{kind:'concept'}])]);
const set=(id,rule)=>answerPolicies['ex-'+id]=rule;
set('6.3-1',{kind:'term',formalOnly:true});
set('6.3-2',{kind:'term',formalOnly:true,descriptionOnly:['shaft','shaft region','shaft of the bone']});
set('8.2-15',{kind:'term',formalOnly:true,descriptionOnly:['thumb','the thumb']});
set('8.4-7',{kind:'term',formalOnly:true,descriptionOnly:['great toe','big toe','toe']});
set('7.2-2',{kind:'count',suffixes:['bones','cranial bones','bones of the cranium']});
set('8.2-7',{kind:'count',suffixes:['phalanges','phalanges in one hand','phalanges per hand','phalanges in each hand','bones in one hand']});
set('8.4-5',{kind:'count',suffixes:['bones','tarsals','tarsal bones','bones in one foot','bones per foot','bones in each foot','tarsal bones in one foot','tarsal bones per foot','tarsal bones in each foot']});
set('8.4-16',{kind:'count',suffixes:['metatarsals','metatarsal bones','metatarsals in one foot','metatarsals per foot','metatarsals in each foot']});
set('8.1-2',{kind:'set',members:['Clavicle','Scapula']});
set('8.3-7',{kind:'set',members:['Ilium','Ischium','Pubis']});

const variants={
 'ex-7.2-3':{equivalents:['Lower jaw','Lower jaw bone','Mandibular bone'],bone:true},
 'ex-7.2-14':{bone:true},'ex-8.2-2':{equivalents:['Upper arm bone'],bone:true},
 'ex-8.2-3':{bone:true},'ex-8.2-4':{bone:true},
 'ex-8.4-2':{equivalents:['Thigh bone','Thighbone'],bone:true},
 'ex-8.4-3':{equivalents:['Shin bone','Shinbone'],bone:true},'ex-8.4-4':{bone:true}
};
for(const [id,rule]of Object.entries(variants))Object.assign(answerPolicies[id],rule);
for(const id of ['8.2-2','8.2-3','8.2-4','8.4-2','8.4-3','8.4-4'])answerPolicies['ex-'+id].side='right';
