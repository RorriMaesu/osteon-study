const roots=[[/^osteo/i,'oste/o','bone'],[/^arthr/i,'arthr/o','joint'],[/^peri/i,'peri-','around'],[/^endo/i,'endo-','within'],[/^epi/i,'epi-','upon or above'],[/blast\b/i,'-blast','forming cell'],[/clast\b/i,'-clast','breaking or resorbing cell'],[/cyte\b/i,'-cyte','cell']];
export function wordParts(name){return roots.filter(([pattern])=>pattern.test(name)).map(([,part,meaning])=>({part,meaning}));}
export function speakTerm(name,toast){
 if(!globalThis.speechSynthesis||!globalThis.SpeechSynthesisUtterance){toast('Device pronunciation is unavailable in this browser.');return;}
 const voice=speechSynthesis.getVoices().find(v=>v.localService&&/^en[-_]/i.test(v.lang));
 if(!voice){toast('No local English device voice is available. The written term remains available.');return;}
 speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(name);utterance.voice=voice;utterance.lang=voice.lang;utterance.rate=.85;speechSynthesis.speak(utterance);
}
