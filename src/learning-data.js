import {chapter6} from './chapter6.js';
import {chapter7} from './chapter7.js';
import glossaryData from './glossary.json' with {type:'json'};
export const lessons=[...chapter6,...chapter7];
export const glossary=glossaryData.map(t=>({...t,region:t.topic,type:'textbook term',exact:false,source:'OpenStax A&P 2e · textbook glossary · CC BY-NC-SA 4.0'}));
export const questions=lessons.flatMap(l=>l.questions.map((q,i)=>({...q,id:`q-${l.id}-${i+1}`,lesson:l.id,topic:'Chapter '+l.id[0]})));
export const questionCards=questions.map(q=>({id:q.id,name:q.answer,front:q.prompt,cue:q.explanation,region:q.topic,type:'concept',exact:false,source:'OpenStax chapter '+q.lesson+' · original practice question'}));
export const reviewCards=[...glossary,...questionCards];
