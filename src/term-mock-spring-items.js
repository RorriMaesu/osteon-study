// Published forms and saved attempts need reproducible option and model orders.
export function ordered(rows, seed) {
  let state = 2166136261;
  for (const character of seed) state = Math.imul(state ^ character.charCodeAt(0), 16777619);
  const result = [...rows];
  for (let i = result.length - 1; i > 0; i--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = Math.floor(state / 4294967296 * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export const pick = (prompt, correct, ...others) => ({type:'choice',prompt,choices:[correct,...others],answer:0});
export const term = (prompt, expected, aliases=[], opposites=[]) => ({type:'term',prompt,expected,aliases,opposites});
export const number = (prompt, expected, unit, tolerance=0) => ({type:'number',prompt,expected,unit,tolerance});
export const data = (columns, ...rows) => ({columns,rows});
export function item(section, key, prompt, parts, why, stimulus) {
  return {section,id:'spring-'+key,objective:key,type:stimulus?'evidence':'short',prompt,parts,why,
    points:parts.length,...(stimulus ? {stimulus} : {})};
}
export function written(section, key, prompt, components) {
  return {id:'spring-'+key,objective:key,section,type:'written',prompt,points:3,
    why:components.map(([,idea])=>idea).join(' '),
    rubric:{id:'spring-rubric-'+key,version:'1',criteria:components.map(([label,description],i)=>
      ({id:'idea-'+(i+1),label,description,points:1}))}};
}
