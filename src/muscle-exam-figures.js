import {muscleTextbookExamFigure,muscleFigureTargets} from './muscle-figure-targets.js';
import {tensionTrace} from './muscle-labs.js';
export function muscleAssessmentFigure(name){
 if(name.startsWith('muscle-target:')){const id=name.slice(14),target=muscleFigureTargets[id],svg=muscleTextbookExamFigure(id);return svg?`<figure class="exam-figure muscle-exam-figure">${svg}<figcaption>${target.orientation}. Identify the ringed target; its source label is masked. OpenStax A&amp;P 2e Figure ${target.figure}. Cropped teaching source; access for free at openstax.org.</figcaption></figure>`:null;}
 if(!name.startsWith('muscle-force:'))return null;
 const mode=name.slice(13),recruit=mode==='recruitment',trace=tensionTrace(recruit?'twitch':mode,5);
 const path=(points,factor=1)=>points.map(([t,f],i)=>`${i?'L':'M'}${60+t*220},${255-f*factor*180}`).join(' ');
 const svg=`<svg viewBox="0 0 800 350" role="img" aria-label="Qualitative muscle tension plotted against time. Stimulus events are marked separately below the tension axis. ${recruit?'Trace B is higher than trace A at the same timing.':'Use the visible response and stimulus pattern.'}"><path d="M60 40V255H745M60 295H745" fill="none" stroke="#a9bfb4" stroke-width="2"/><path d="${path(trace.points)}" fill="none" stroke="#efb58f" stroke-width="4"/>${recruit?`<path d="${path(trace.points,.4)}" fill="none" stroke="#9fd9c5" stroke-width="4"/><g fill="#e2eadf" font-size="20"><text x="155" y="195">B</text><text x="155" y="242">A</text></g>`:''}${trace.pulses.map(t=>`<path d="M${60+t*220} 295v-18" stroke="#add8c2" stroke-width="3"/>`).join('')}<g fill="#e2eadf" font-size="17"><text x="60" y="29">Relative tension</text><text x="620" y="280">Time →</text><text x="60" y="330">Stimulus events</text></g></svg>`;
 return `<figure class="exam-figure muscle-exam-figure">${svg}<figcaption>Original qualitative teaching plot. Relative scales; not a calibrated recording. OpenStax A&amp;P 2e §10.4.</figcaption></figure>`;
}
