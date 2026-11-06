import crops from './textbook-figure-crops.json' with {type:'json'};

// Source artwork for states that benefit from the book's labels, proportions or comparisons.
// Process models and assessment targets retain their own drawings.
export const preferredLessonArt={
 '1.5':['1.10','1.11'],
 '2.2':['2.8','2.9','2.10','2.11'],
 '2.5':['2.19','2.23','2.26','2.29'],
 '5.1':['5.2','5.7','5.2',null,'5.5'],
 '5.2':['5.11','5.13','5.14'],
 '6.1':[null,'6.3','6.2','6.5','6.5'],
 '6.2':['6.6','6.6','6.6','6.6','6.6'],
 '6.3':['6.7','6.12','6.7','6.8','6.15'],
 '6.4':['6.16','6.17','6.17','6.17'],
 '7.1':['7.2','7.2'],
 '7.3':['7.31','7.31','7.31','7.31','7.31'],
 '7.4':['7.32','7.32','7.32'],
 '8.1':['8.3','8.3','8.4'],
 '8.3':['8.13','8.14','8.12'],
 '8.5':['8.20'],
 '9.1':['9.2','9.3','9.10','9.4'],
 '9.2':['9.5','9.5','9.5'],
 '9.3':['9.7','9.7'],
 '9.4':['9.8','9.10','9.10','9.10','9.10','9.10','9.10'],
 '9.6':['9.15','9.16','9.17','9.18','9.19','9.21'],
 '10.8':['10.24',null,'10.25','10.25']
};

// Detail windows use page pixels. The full comparisons remain in OpenStax figures.
const lessonDetail={
 '6.2':[[125,343,149,315],[150,89,158,270],[560,496,255,350],[595,86,265,300],[160,677,162,248]],
 '6.4':[null,[127,94,248,255],[381,131,248,276],[334,623,511,428]],
 '9.2':[[166,91,225,277],[380,87,207,285],[593,90,222,279]],
 '9.3':[[175,365,188,297],[420,379,389,286]],
 '9.4':[null,[578,650,244,174],[112,344,155,235],[190,135,164,184],[721,343,153,288],[157,646,258,257],[543,88,241,237]]
};

export const textbookFigure=number=>crops[number];
export function textbookArt(number,e,detail){
 const figure=textbookFigure(number);
 if(!figure)return null;
 const [page,width,height,box,title,credit]=figure;
 return {viewBox:(detail||box).join(' '),title:`Figure ${number} · ${title}`,art:`<image href="assets/reader/p${page}.jpg" width="${width}" height="${height}"/>`,caption:`OpenStax A&amp;P 2e · Fig. ${e(number)} · Rice University · CC BY-NC-SA 4.0 · cropped from the original page.${credit?' Image credit · '+e(credit)+'.':''}`};
}

export const lessonTextbookArt=(section,state,e)=>textbookArt(preferredLessonArt[section]?.[state],e,lessonDetail[section]?.[state]);

export function textbookGallery(figures,selected,e){
 const options=figures.map((f,i)=>`<option value="${i}" ${i===selected?'selected':''}>${e(f.number+' · '+(textbookFigure(f.number)?.[4]||'Textbook figure'))}</option>`).join('');
 const item=figures[selected],crop=textbookArt(item.number,e);
 return `<div class="lesson-source-preview"><div class="control-row"><label for="lesson-figure-select" class="sr-only">Source figure</label><select id="lesson-figure-select">${options}</select><button type="button" class="lesson-source-open" data-lesson-figure="${item.pdf}">Read source page ↗</button></div><figure class="section-diagram-media section-diagram-source">${crop?`<svg viewBox="${crop.viewBox}" role="img" aria-label="${e(crop.title)}">${crop.art}</svg>`:`<img src="assets/reader/p${item.pdf}.jpg" alt="${e('Source page with figure '+item.number)}">`}<figcaption>${crop?.caption||'OpenStax A&amp;P 2e · Source page.'}</figcaption></figure></div>`;
}
