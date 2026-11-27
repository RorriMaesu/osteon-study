import {CatmullRomCurve3,Vector3} from 'three';

const gold='#ffca62',blue='#71d8ff',oxygen='#fff3bf';
const source='https://openstax.org/books/anatomy-and-physiology-2e/pages/';
const phase=(at,label,text,...members)=>({at,label,text,members});
const route=(points,span,color,extra={})=>({mode:'trace',points,span,color,trail:true,size:.044,...extra});

// Coordinates follow the meshed vessels in build-ap3-fluid-models.py.
// Sample the curved centerlines before passing them to the distance-based player.
function tube(controls){
  return new CatmullRomCurve3(controls.map(p=>new Vector3(...p))).getPoints((controls.length-1)*12).map(p=>p.toArray());
}
const fetalIn=[[-.062,1.075,0],[-.058,.48,0],[-.061,.22,0],[-.18,.03,0],[-.40,-.15,0]];
const loop=[[-.40,-.15,0],[-.46,-.226,0],[-.426,-.279,.024],[-.31,-.165,.035],[-.15,-.037,.04],[-.015,.12,.044],[.12,.018,.035],[.30,-.14,.036],[.447,-.265,.017],[.468,-.220,0],[.40,-.15,0]];
const fetalOut=[[.40,-.15,0],[.19,.035,0],[.063,.22,0],[.058,.47,0],[.061,1.075,0]];
const maternalIn=[[-.54,-1.03,0],[-.48,-.91,.04],[-.58,-.78,.04],[-.53,-.65,0],[-.50,-.527,0]];
const maternalOut=[[.53,-.527,0],[.58,-.71,0],[.63,-1.02,0]];
const bathContact=[-.54,-.279,.217];
const fetalLoop=tube(loop),exchangeIndex=24;
const parentIn=[...tube(maternalIn),[-.52,-.46,.12],[-.56,-.39,.19],bathContact];
const parentOut=[bathContact,[-.19,-.35,.19],[.03,-.40,.18],[.32,-.40,.17],[.51,-.42,.12],...tube(maternalOut)];
const fetalArrival=[...tube(fetalIn),...fetalLoop.slice(1,exchangeIndex+1)];
const fetalDeparture=[...fetalLoop.slice(exchangeIndex),...tube(fetalOut).slice(1)];
const transfer=[bathContact,fetalLoop[exchangeIndex]];

export const fluidExchangeOrgans=[
  {id:'tissue-water-exchange',title:'Body fluids · capillary to cell',system:'Cardiovascular',section:'26.1',
    source:source+'26-1-body-fluids-and-fluid-compartments',asset:'assets/ap3-models/fluid-spaces.glb',
    targets:['plasma','capillary_wall','interstitial_fluid','cell_membrane','intracellular_fluid','red_blood_cells'],
    context:[],bodyIds:[],kind:'Process overlay',duration:13,direction:[.08,.17,1],
    aliases:['water','osmosis','filtration','extracellular fluid','intracellular fluid','fluid compartments','interstitial fluid'],
    action:'Follow water across two barriers',
    description:'Follow one enlarged water marker from plasma to a tissue cell. The capillary is filtering outward in this example. A separate osmotic gradient favors water entry into the cell.',
    landmarks:[{label:'Capillary wall',mesh:'capillary_wall',point:[.075,-.09,-.015],offset:[.59,.19,0],span:[.20,.42],size:.09},
      {label:'Cell membrane',mesh:'cell_membrane',point:[.014,.160,-.015],offset:[-.56,.13,.05],span:[.65,.84],size:.09}],
    phases:[
      phase(0,'Water in plasma','The marker begins in the fluid portion of blood, between red cells.','plasma','red_blood_cells'),
      phase(.20,'Capillary filtration','Hydrostatic and oncotic forces determine net fluid movement across the capillary wall. Here the net movement is outward.','capillary_wall'),
      phase(.42,'Interstitial fluid','Water is now outside the vessel and outside the cells. Lymphatics return excess interstitial fluid to the circulation.','interstitial_fluid'),
      phase(.65,'Water enters the cell','Water crosses the cell membrane toward the higher effective solute concentration. The gradient can reverse.','cell_membrane'),
      phase(.84,'Intracellular fluid','The marker has crossed two distinct boundaries and is now inside the tissue cell.','intracellular_fluid')],
    effects:[
      route([[.18,-.30,-.015],[.12,-.17,-.015],[.085,-.130,-.015]],[0,.20],blue),
      route([[.085,-.130,-.015],[.075,-.112,-.015],[.066,-.090,-.015],[.06,-.065,-.015]],[.20,.42],blue),
      route([[.06,-.065,-.015],[.045,.035,-.015],[.022,.146,-.015]],[.42,.65],blue),
      route([[.022,.146,-.015],[.014,.167,-.015],[.010,.176,-.015],[.007,.23,-.015]],[.65,.84],blue),
      route([[.007,.23,-.015],[0,.40,-.015]],[.84,1],blue)]},
  {id:'placental-villus-exchange',title:'Placental villus · two circulations',system:'Reproductive',section:'28.2',
    source:source+'28-2-embryonic-development',asset:'assets/ap3-models/placental-exchange.glb',
    targets:['maternal_spiral_artery','maternal_vein','intervillous_space','chorionic_villus','fetal_arteriole','fetal_capillaries','fetal_venule'],
    context:[],bodyIds:[],kind:'Process overlay',duration:16,direction:[.78,.07,1],
    aliases:['placenta','maternal blood','fetal blood','intervillous space','gas exchange','oxygen diffusion'],
    action:'Trace maternal blood, fetal blood and oxygen',
    description:'The gold arrow follows maternal blood around the villus. The blue bead follows fetal blood inside its vessels. The small pale bead follows oxygen across the placental barrier. Symbols are enlarged for viewing.',
    landmarks:[{label:'Maternal',mesh:'maternal_spiral_artery',point:maternalIn[2],offset:[.36,-.03,0],size:.10},
      {label:'Fetal',mesh:'fetal_arteriole',point:fetalIn[1],offset:[-.24,.12,0],size:.10},
      {label:'O₂',mesh:'chorionic_villus',point:[-.426,-.279,.135],offset:[-.12,.13,.10],size:.09,span:[.42,.6799]}],
    phases:[
      phase(0,'Two blood supplies','Maternal blood enters from a uterine spiral artery. Fetal blood arrives in a villous arteriole fed by an umbilical artery.','maternal_spiral_artery','fetal_arteriole'),
      phase(.30,'Blood on opposite sides','Maternal blood bathes the villus in the intervillous space. Fetal blood stays inside a villous capillary. The arrow and the round bead mark those two positions.','intervillous_space','fetal_capillaries'),
      phase(.42,'Oxygen crosses','Follow the small oxygen bead from maternal blood across the villous tissue and fetal capillary wall. Its diffusion follows a partial-pressure gradient.','chorionic_villus'),
      phase(.68,'Separate returns','Maternal blood drains to a uterine vein. Fetal blood leaves in a villous venule and eventually returns to the fetus through the umbilical vein.','maternal_vein','fetal_venule')],
    effects:[
      route(parentIn,[0,.30],gold,{arrow:true,holdUntil:.6799}),
      route(fetalArrival,[0,.30],blue,{holdUntil:.6799,size:.036}),
      route(transfer,[.42,.68],oxygen,{size:.020}),
      route(parentOut,[.68,1],gold,{arrow:true}),
      route(fetalDeparture,[.68,1],blue,{size:.036})]}
];
