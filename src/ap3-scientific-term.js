// Resolve only unambiguous scientific notation and qualifiers. Other responses
// still go through the existing anatomy spelling and meaning checks.
export function springScientificTerm(expected,raw){
  const key=String(expected).toLowerCase(),s=String(raw).normalize('NFKC').trim().toLowerCase().replace(/[−–]/g,'-').replace(/[.,;:]$/,'').trim();
  if(key==='bicarbonate'){
    if(/\bhco\s*3/.test(s)){
      const formula='hco\\s*3\\s*(?:\\^?\\s*-)?',name='(?:bicarbonate(?: ion)?|hydrogen carbonate(?: ion)?)';
      return new RegExp('^(?:'+formula+'|'+name+'\\s*\\(\\s*'+formula+'\\s*\\)|'+formula+'\\s*\\(\\s*'+name+'\\s*\\))$').test(s)?'correct':'incorrect';
    }
    if(/positive|negative|\+|(^|\s)-/.test(s))return /^(?:negatively charged bicarbonate(?: ion)?|bicarbonate(?: ion)?\s*\(\s*-\s*\))$/.test(s)?'correct':'incorrect';
  }
  if(/cytotoxic t|cd8/.test(key)&&/\bcd\s*[48]/.test(s)){
    if(/\bcd\s*8\s*(?:-|negative\b)/.test(s))return 'incorrect';
    const t='t(?:[ -]+(?:cells?|lymphocytes?))?',marker='cd\\s*8(?:\\s*(?:\\+|positive))?';
    return new RegExp('^(?:(?:cytotoxic\\s+)?'+marker+'[ -]+(?:cytotoxic\\s+)?'+t+'|cytotoxic\\s+'+t+'\\s*\\(\\s*'+marker+'\\s*\\))$').test(s)?'correct':'incorrect';
  }
  if(/^(?:respiratory|metabolic) (?:acidosis|alkalosis)$/.test(key)&&/\bcompensat/.test(s)){
    const organ=key.startsWith('metabolic')?'respiratory':'renal|metabolic';
    return new RegExp('^(?:primary )?'+key+'(?:,? (?:with |showing |and )(?:partial )?(?:'+organ+') compensation|,? \\((?:'+organ+') compensation\\))$').test(s)?'correct':'incorrect';
  }
}
