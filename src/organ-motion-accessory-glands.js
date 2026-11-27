import {mountVisceralMotion} from './organ-motion-visceral.js';

// Centers of successive cross sections of each donor duct, ending at its
// open edge. Coordinates are in the exported model's glTF frame.
const ducts = {
  left: [
    [.118172,-.011154,-.021245], [.113240,-.012780,-.022376],
    [.108774,-.015305,-.022571], [.105089,-.018634,-.021777],
    [.102073,-.022099,-.020002], [.099283,-.025504,-.017684],
    [.096443,-.028826,-.015256], [.093328,-.032073,-.013013],
    [.089992,-.035159,-.010834], [.086593,-.038128,-.008590],
    [.083269,-.040965,-.006102], [.080093,-.043714,-.003369],
    [.077065,-.046410,-.000439], [.074065,-.049008,.002631]
  ],
  right: [
    [-.135036,-.018381,-.016668], [-.130838,-.019277,-.014665],
    [-.127176,-.020418,-.011609], [-.124099,-.021855,-.007977],
    [-.121524,-.023818,-.004098], [-.119352,-.026080,-.000120],
    [-.117260,-.028462,.003881], [-.115031,-.030821,.007923],
    [-.112623,-.033091,.011846], [-.109968,-.035327,.015729],
    [-.107230,-.037480,.019579], [-.104489,-.039543,.023240],
    [-.101661,-.041622,.026908], [-.098563,-.044277,.030424]
  ]
};
const folder = 'assets/organ-atlas/accessory-glands/';
const sides = ['left','right'];
const gland = side => 'greater_vestibular_gland_' + side;

export const accessoryGlandOrgans = [{
  id:'greater-vestibular-glands', title:'Greater vestibular glands', system:'Reproductive',
  asset:folder+'greater-vestibular.glb', credits:folder+'SOURCES.md',
  bodyIds:['greater-vestibular-glands'], aliases:['Bartholin glands','Bartholin’s glands'],
  targets:sides.map(gland), context:['vaginal_wall','urethral_submucosa','vestibular_bulbs'],
  kind:'Process overlay', direction:[.08,-.97,.48], duration:8, section:'27.2',
  source:'https://openstax.org/books/anatomy-and-physiology-2e/pages/27-2-anatomy-and-physiology-of-the-ovarian-reproductive-system',
  action:'Follow mucus to the vestibule',
  description:'Each gold marker follows a duct toward its opening beside the vaginal orifice. The glands and nearby tissues come from one adult pelvic reconstruction. The timing illustrates secretion.',
  phases:[
    {label:'Locate the glands',text:'The greater vestibular glands lie on opposite sides of the vaginal opening. Each produces mucus.'},
    {label:'Follow the ducts',text:'Watch the two gold markers move from the glands along their narrow ducts.'},
    {label:'Locate the outlets',text:'The ducts open into the vestibule beside the vaginal orifice. Their mucus helps keep the vestibule moist.'}
  ],
  effects:sides.flatMap(side=>[
    {mode:'cue',mesh:gland(side),span:[0,.42],color:'#ffb978'},
    {mode:'trace',points:ducts[side],span:[.30,.82],color:'#ffe286',size:.018},
    {mode:'trace',points:ducts[side],range:[1,1],span:[.82,1],color:'#ffe286',size:.018}
  ])
}];

export const mountAccessoryGlandMotion = mountVisceralMotion;
