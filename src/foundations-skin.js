import skin from './foundations-skin-data.json' with {type:'json'};

const L=(id,title,short,objective,sections,compare,recall,application)=>({id,title,short,objective,sections,compare,recall,application,questions:[]});
export const skinLessons=[
 L('5.1','Layers of the Skin','Read skin from the surface inward','Relate epidermal and dermal structure to barrier function, renewal, pigmentation and support.',[
 ['What belongs to the system','Skin consists of epidermis and dermis. Hair, nails, sweat glands and sebaceous glands are accessory structures. The underlying hypodermis anchors and cushions skin.'],
 ['Epidermis','The epidermis is keratinized stratified squamous epithelium. It lacks blood vessels, and nutrients diffuse from the dermis. From deep to superficial the strata are basale, spinosum, granulosum, lucidum where present, and corneum. Lucidum is a feature of thick skin on palms and soles.'],
 ['Barrier renewal','Basal keratinocytes divide. Their descendants move toward the surface, accumulate keratin, contribute to a lipid barrier and eventually form flattened dead cells that shed from the corneum.'],
 ['Pigmentation','Melanocytes in the basal epidermis produce melanin and transfer melanosomes to keratinocytes. Melanin helps protect nuclear DNA from UV damage. Differences in skin color reflect melanin production, type and distribution as well as other pigments and blood flow.'],
 ['Dermis and below','The papillary dermis is superficial areolar connective tissue with dermal papillae and capillary loops. The deeper reticular dermis is largely dense irregular connective tissue. Hypodermal loose connective tissue and adipose cushion and insulate. Deeper fascia is a denser connective tissue investment around muscles and related structures.']
 ],[['Epidermis / dermis','Avascular epithelial barrier / vascular connective tissue support.'],['Hypodermis / deep fascia','Subcutaneous cushioning / deeper connective tissue investment.']],['Name the epidermal layers deep to superficial.','Basale, spinosum, granulosum, lucidum in thick skin, corneum.'],['A sample has a distinct stratum lucidum and no hair follicles. Where might it be from?','A palm or sole. Thick skin there has a visible stratum lucidum and lacks hair follicles.']),
 L('5.2','Accessory Structures of the Skin','Follow each structure to its destination','Identify the components and functions of hair, nails and skin glands.',[
 ['Hair and follicle','The shaft is above the skin surface, the root is below, and the bulb contains proliferating matrix cells next to a vascular dermal papilla. Hair is keratinized. The follicle surrounds the root and its sensory plexus responds to hair movement.'],
 ['Hair cycles and goosebumps','Growing hair enters a transitional and then a resting phase before the cycle repeats. The arrector pili is smooth muscle attached to a hair follicle. Its contraction raises the hair and puckers the skin.'],
 ['Nails','The hard keratin nail plate protects the distal digit. The nail matrix supplies growing cells, pushing the plate distally over the nail bed. The visible pale crescent is the lunula.'],
 ['Skin glands','Sebaceous glands usually drain oily sebum into follicles. Eccrine sweat glands open on the skin surface and produce watery sweat important for cooling. Apocrine sweat glands in regions such as the axilla usually drain into follicles. Bacterial action on secretions contributes to body odor.']
 ],[['Eccrine / apocrine','Surface pore / typically a hair follicle.'],['Sebum / sweat','Lipid-rich secretion / mostly water with solutes.']],['Where is the growing region of the nail?','The nail matrix.'],['A duct opens directly onto a palm with no hair follicles. Which gland type fits?','An eccrine sweat gland. Palms have many eccrine glands and lack hair follicles.']),
 L('5.3','Functions of the Integumentary System','Connect each function to a structure','Explain how the skin protects, senses and participates in homeostasis.',[
 ['Protection','The cornified layer and intercellular lipids reduce water loss and impede many pathogens. Melanin absorbs some UV radiation, and immune cells participate in defense.'],
 ['Sensation','Free endings detect signals including pain and temperature. Receptors in skin and subcutaneous tissue detect mechanical stimuli. Lamellated (Pacinian) corpuscles respond to vibration and rapidly changing deep pressure.'],
 ['Temperature','When heat must be lost, dermal vessels can dilate and eccrine sweat can evaporate. In cold, cutaneous vasoconstriction decreases heat loss. Sweating that drips away provides less cooling than evaporation.'],
 ['Vitamin D','UVB initiates vitamin D3 synthesis from a precursor in the skin. Subsequent processing in liver and kidney forms the active hormone involved in calcium regulation.']
 ],[['Vasodilation / vasoconstriction','Increased / decreased skin blood flow for heat exchange.'],['Secretion / evaporation','Sweat reaches the surface / conversion to vapor removes heat.']],['What turns sweat into a cooling mechanism?','Evaporation absorbs heat from the skin.'],['Why can high humidity make a hot environment harder to tolerate?','It slows sweat evaporation, reducing evaporative heat loss.']),
 L('5.4','Diseases, Disorders, and Injuries of the Integumentary System','Link visible changes to tissue involvement','Compare major skin disorders, classify injuries by tissue depth and trace the repair sequence.',[
 ['Skin cancer','Basal cell carcinoma arises from basal-type epithelial cells and usually invades locally. Squamous cell carcinoma comes from keratinocytes and can spread. Melanoma arises from melanocytes and has important metastatic potential. Asymmetry, border, color, diameter and evolution are features used in awareness, with professional evaluation required for diagnosis.'],
 ['Inflammation and infection','Eczema is a group of inflammatory skin conditions. Acne involves the pilosebaceous unit, including follicular plugging and inflammation. Pressure injuries arise when prolonged loading damages tissue and impairs perfusion.'],
 ['Burn depth','A superficial burn affects epidermis. A partial-thickness burn extends into dermis, while full-thickness injury destroys epidermis and dermis and can involve deeper tissue. Depth and extent are separate ideas.'],
 ['Repair sequence','Hemostasis limits bleeding, inflammation clears damaged material, and new vessels, fibroblasts and epithelial cells support repair. Remodeling reorganizes collagen. Deeper injury can leave a scar and permanently alter hair, glands and sensation.'],
 ['Aging','Cell replacement, blood supply and dermal matrix can decline with age. Reduced elasticity and slower repair can make older skin more vulnerable to injury.']
 ],[['Superficial / partial thickness','Epidermis only / extends into dermis.'],['Regeneration / fibrosis','Restoration by original tissue / repair with collagen-rich scar.']],['Which skin cells give rise to melanoma?','Melanocytes.'],['Why can deeper burns permanently change sweating in the area?','They can destroy dermal sweat glands and be repaired with scar tissue instead of functional glands.'])
];

const targets={
 A:{xy:[110,688],label:'Sebaceous gland',detail:'This lobular gland opens into a hair follicle and releases sebum.'},
 B:{xy:[592,634],label:'Arrector pili muscle',detail:'The oblique smooth-muscle band connects the follicle to superficial dermis.'},
 C:{xy:[920,1119],label:'Pacinian corpuscle',detail:'This deep lamellated receptor detects rapid changes in pressure and vibration.'}
};
export function skinFigure(id){
 const t=targets[id];if(!t)return '';
 const [x,y]=t.xy,dx=id==='A'?68:id==='B'?96:-103,dy=id==='B'?-85:-70;
 return `<figure class="exam-figure foundation-skin-figure"><svg viewBox="0 0 1620 1480" role="img" aria-label="Skin cross-section. The orange marker ${id} identifies the target."><image href="assets/foundations/skin.png" width="1620" height="1480"/><path d="M${x} ${y}l${dx} ${dy}" fill="none" stroke="#1c262b" stroke-width="16"/><path d="M${x} ${y}l${dx} ${dy}" fill="none" stroke="#ffcc72" stroke-width="9"/><circle cx="${x}" cy="${y}" r="25" fill="none" stroke="#1c262b" stroke-width="18"/><circle cx="${x}" cy="${y}" r="25" fill="none" stroke="#ffcc72" stroke-width="10"/><circle cx="${x+dx}" cy="${y+dy}" r="37" fill="#ffcc72" stroke="#1c262b" stroke-width="7"/><text x="${x+dx}" y="${y+dy+15}" text-anchor="middle" fill="#1c262b" font-family="sans-serif" font-size="46" font-weight="700">${id}</text></svg><figcaption>Skin cross-section · adapted from OpenStax A&P 2e Figure 5.2 · CC BY-NC-SA 4.0.</figcaption></figure>`;
}
export function renderSkinActivity(root,section,e){
 if(!section.startsWith('5.'))return false;
 root.classList.add('muscle-interactive-step','foundation-studio');
 let target='A',revealed=false;
 const rubrics=(skin.written[section]||[]).map(q=>`<details class="result-detail"><summary>${e(q.stem)}</summary><p>Form an answer before checking the rubric.</p><ul>${q.rubric.map(item=>`<li>${e(item)}</li>`).join('')}</ul></details>`).join('');
 function draw(){
  root.innerHTML=`<h3>Read the skin cross-section.</h3><div class="control-row" aria-label="Skin targets">${Object.keys(targets).map(id=>`<button data-skin-target="${id}" aria-pressed="${target===id}">Target ${id}</button>`).join('')}<button id="skin-reveal" aria-pressed="${revealed}">${revealed?'Hide identification':'Reveal identification'}</button></div><div class="foundation-tissue-layout">${skinFigure(target)}<div aria-live="polite">${revealed?`<h4>${targets[target].label}</h4><p>${targets[target].detail}</p>`:'<p>Identify the highlighted structure, then explain how its position supports its function.</p>'}</div></div>${rubrics?'<h3>Written practice</h3>'+rubrics:''}`;
  root.querySelectorAll('[data-skin-target]').forEach(button=>button.onclick=()=>{target=button.dataset.skinTarget;revealed=false;draw();root.querySelector('[data-skin-target="'+target+'"]').focus({preventScroll:true});});
  root.querySelector('#skin-reveal').onclick=()=>{revealed=!revealed;draw();root.querySelector('#skin-reveal').focus({preventScroll:true});};
 }
 draw();
 return true;
}
