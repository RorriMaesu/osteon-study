const cells = [
  ['field-24.webp','Basophil','Coarse blue-purple granules crowd the central cell and partially obscure its nucleus.'],
  ['field-20.webp','Eosinophil','Dense orange granules fill cytoplasm around a lobed nucleus.'],
  ['field-12.webp','Lymphocyte','A dark compact nucleus fills most of the cell, leaving a narrow rim of cytoplasm.'],
  ['field-22.webp','Monocyte','The large central cell has an irregular folded nucleus and a broad field of gray-blue cytoplasm.'],
  ['field-21.webp','Neutrophil','Several nuclear segments are linked by thin strands within pale, finely granulated cytoplasm.'],
  ['field-19.webp','Platelet','A tiny granular fragment at the center is smaller than the surrounding pink red cells.']
];
const names = cells.map(row => row[1]);
export const bloodExamItems = cells.map(([file,name,appearance],index) => {
  const choices = [names[(index+1)%6],names[(index+3)%6],names[(index+5)%6]];
  const answer = (index+2)%4;
  choices.splice(answer,0,name);
  return {id:'ap2-18.4-smear-'+name.toLowerCase(),section:'18.4',type:'visual',
    prompt:'Which formed element is centered in this peripheral blood smear?',
    stimulus:{image:'assets/ap2-blood/'+file,alt:appearance,
      source:'https://data.mendeley.com/datasets/snkd93bnjr/1',
      credit:'Acevedo, Merino, Alférez, Molina, Boldú and Rodellar (2020), Hospital Clínic de Barcelona. CC BY 4.0. Converted to WebP.'},
    choices,answer,why:appearance+' These features support the identification of a '+name.toLowerCase()+'.'};
});
